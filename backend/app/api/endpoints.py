from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date, timedelta
import datetime

from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

# --- Clientes ---
@router.post("/clientes/", response_model=schemas.ClienteResponse)
def create_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    db_cliente = models.Cliente(**cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.get("/clientes/", response_model=List[schemas.ClienteResponse])
def read_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    return clientes

@router.get("/clientes/{cliente_dni}", response_model=schemas.ClienteResponse)
def read_cliente(cliente_dni: str, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.dni == cliente_dni).first()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

# --- Vehiculos ---
@router.post("/vehiculos/", response_model=schemas.VehiculoResponse)
def create_vehiculo(vehiculo: schemas.VehiculoCreate, db: Session = Depends(get_db)):
    db_vehiculo = models.Vehiculo(**vehiculo.model_dump())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@router.get("/vehiculos/", response_model=List[schemas.VehiculoResponse])
def read_vehiculos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vehiculos = db.query(models.Vehiculo).offset(skip).limit(limit).all()
    return vehiculos

@router.get("/vehiculos/{vehiculo_patente}", response_model=schemas.VehiculoResponse)
def read_vehiculo(vehiculo_patente: str, db: Session = Depends(get_db)):
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.patente == vehiculo_patente).first()
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo

# --- Turnos ---
@router.post("/turnos/", response_model=schemas.TurnoResponse)
def create_turno(turno: schemas.TurnoCreate, db: Session = Depends(get_db)):
    db_turno = models.Turno(**turno.model_dump())
    db.add(db_turno)
    db.commit()
    db.refresh(db_turno)
    return db_turno

@router.get("/turnos/", response_model=List[schemas.TurnoResponse])
def read_turnos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    turnos = db.query(models.Turno).offset(skip).limit(limit).all()
    return turnos

@router.get("/turnos/manana", response_model=List[schemas.TurnoDetalladoResponse])
def read_turnos_manana(db: Session = Depends(get_db)):
    tomorrow = date.today() + timedelta(days=1)
    tomorrow_start = datetime.datetime.combine(tomorrow, datetime.time.min)
    tomorrow_end = datetime.datetime.combine(tomorrow, datetime.time.max)
    
    turnos = db.query(models.Turno)\
        .options(joinedload(models.Turno.vehiculo).joinedload(models.Vehiculo.propietario))\
        .filter(
            models.Turno.fecha_hora >= tomorrow_start,
            models.Turno.fecha_hora <= tomorrow_end,
            models.Turno.estado == "Pendiente"
        )\
        .order_by(models.Turno.fecha_hora.asc())\
        .all()
    return turnos

@router.patch("/turnos/{turno_id}/estado", response_model=schemas.TurnoResponse)
def update_turno_estado(turno_id: int, turno_update: schemas.TurnoUpdate, db: Session = Depends(get_db)):
    db_turno = db.query(models.Turno).filter(models.Turno.id == turno_id).first()
    if not db_turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    db_turno.estado = turno_update.estado
    db.commit()
    db.refresh(db_turno)
    return db_turno

# --- Ordenes de Trabajo ---
@router.post("/ordenes/", response_model=schemas.OrdenTrabajoResponse)
def create_orden(orden: schemas.OrdenTrabajoCreate, db: Session = Depends(get_db)):
    try:
        orden_data = orden.model_dump(exclude={"servicios"})
        db_orden = models.OrdenTrabajo(**orden_data)
        db.add(db_orden)
        
        # Actualizar kilometraje del vehículo
        if orden.kilometraje:
            vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.patente == orden.vehiculo_patente).first()
            if vehiculo:
                vehiculo.kilometraje = orden.kilometraje
                
        db.commit()
        db.refresh(db_orden)
        
        if orden.servicios:
            configuraciones = db.query(models.ConfiguracionServicio).all()
            from datetime import timedelta
            
            for s in orden.servicios:
                db_servicio = models.ServicioRealizado(**s.model_dump(), orden_id=db_orden.id)
                db.add(db_servicio)
                
                # Revisar si aplica algún servicio periódico
                servicio_texto = s.servicio.lower()
                for conf in configuraciones:
                    if conf.palabra_clave.lower() in servicio_texto:
                        # Auto-generar
                        nuevo_periodico = models.ServicioPeriodico(
                            tipo_servicio=conf.palabra_clave.capitalize(),
                            kilometraje_actual=orden.kilometraje,
                            fecha_proximo=(db_orden.fecha_ingreso + timedelta(days=conf.meses_vencimiento * 30)).date() if db_orden.fecha_ingreso else None,
                            kilometraje_proximo=orden.kilometraje + conf.km_vencimiento if orden.kilometraje else None,
                            estado="Pendiente",
                            vehiculo_patente=orden.vehiculo_patente
                        )
                        db.add(nuevo_periodico)
                        
            db.commit()
            db.refresh(db_orden)
            
        return db_orden
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.get("/ordenes/", response_model=List[schemas.OrdenTrabajoResponse])
def read_ordenes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    ordenes = db.query(models.OrdenTrabajo).offset(skip).limit(limit).all()
    return ordenes

# --- Servicios Periodicos y Configuracion ---
@router.get("/configuracion-servicios/", response_model=List[schemas.ConfiguracionServicioResponse])
def read_config_servicios(db: Session = Depends(get_db)):
    return db.query(models.ConfiguracionServicio).all()

@router.post("/configuracion-servicios/", response_model=schemas.ConfiguracionServicioResponse)
def create_config_servicio(config: schemas.ConfiguracionServicioCreate, db: Session = Depends(get_db)):
    db_config = models.ConfiguracionServicio(**config.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.delete("/configuracion-servicios/{config_id}")
def delete_config_servicio(config_id: int, db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracionServicio).filter(models.ConfiguracionServicio.id == config_id).first()
    if config:
        db.delete(config)
        db.commit()
    return {"status": "ok"}

@router.get("/servicios-periodicos/", response_model=List[schemas.ServicioPeriodicoResponse])
def read_servicios_periodicos(db: Session = Depends(get_db)):
    return db.query(models.ServicioPeriodico).all()

@router.patch("/servicios-periodicos/{servicio_id}/estado", response_model=schemas.ServicioPeriodicoResponse)
def update_servicio_periodico_estado(servicio_id: int, update_data: schemas.ServicioPeriodicoUpdate, db: Session = Depends(get_db)):
    db_servicio = db.query(models.ServicioPeriodico).filter(models.ServicioPeriodico.id == servicio_id).first()
    if not db_servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db_servicio.estado = update_data.estado
    db.commit()
    db.refresh(db_servicio)
    return db_servicio

# --- CheckLists Agencia ---
@router.post("/checklists/", response_model=schemas.CheckListAgenciaResponse)
def create_checklist(checklist: schemas.CheckListAgenciaCreate, db: Session = Depends(get_db)):
    db_checklist = models.CheckListAgencia(**checklist.model_dump())
    db.add(db_checklist)
    db.commit()
    db.refresh(db_checklist)
    return db_checklist

@router.get("/checklists/", response_model=List[schemas.CheckListAgenciaResponse])
def read_checklists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    checklists = db.query(models.CheckListAgencia).offset(skip).limit(limit).all()
    return checklists
