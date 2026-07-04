from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
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

@router.get("/clientes/{cliente_id}", response_model=schemas.ClienteResponse)
def read_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.put("/clientes/{cliente_id}", response_model=schemas.ClienteResponse)
def update_cliente(cliente_id: int, cliente_update: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    update_data = cliente_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cliente, key, value)
        
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.delete("/clientes/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(db_cliente)
    db.commit()
    return {"status": "ok", "message": "Cliente eliminado con éxito"}

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

@router.put("/vehiculos/{vehiculo_patente}", response_model=schemas.VehiculoResponse)
def update_vehiculo(vehiculo_patente: str, vehiculo_update: schemas.VehiculoUpdate, db: Session = Depends(get_db)):
    db_vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.patente == vehiculo_patente).first()
    if not db_vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
    update_data = vehiculo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vehiculo, key, value)
        
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@router.delete("/vehiculos/{vehiculo_patente}")
def delete_vehiculo(vehiculo_patente: str, db: Session = Depends(get_db)):
    db_vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.patente == vehiculo_patente).first()
    if not db_vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    db.delete(db_vehiculo)
    db.commit()
    return {"status": "ok", "message": "Vehículo eliminado con éxito"}

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
    if turno_update.estado is not None:
        db_turno.estado = turno_update.estado
    if turno_update.fecha_hora is not None:
        db_turno.fecha_hora = turno_update.fecha_hora
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


# --- Finanzas Endpoints ---
@router.post("/finanzas/", response_model=schemas.MovimientoFinancieroResponse)
def create_movimiento(movimiento: schemas.MovimientoFinancieroCreate, db: Session = Depends(get_db)):
    db_movimiento = models.MovimientoFinanciero(**movimiento.model_dump())
    db.add(db_movimiento)
    db.commit()
    db.refresh(db_movimiento)
    return db_movimiento

@router.get("/finanzas/", response_model=List[schemas.MovimientoFinancieroResponse])
def read_movimientos(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    tipo: Optional[str] = None,
    categoria: Optional[str] = None,
    metodo_pago: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.MovimientoFinanciero)
    if fecha_inicio:
        query = query.filter(models.MovimientoFinanciero.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(models.MovimientoFinanciero.fecha <= fecha_fin)
    if tipo:
        query = query.filter(models.MovimientoFinanciero.tipo == tipo)
    if categoria:
        query = query.filter(models.MovimientoFinanciero.categoria == categoria)
    if metodo_pago:
        query = query.filter(models.MovimientoFinanciero.metodo_pago == metodo_pago)
        
    return query.order_by(models.MovimientoFinanciero.fecha.desc(), models.MovimientoFinanciero.id.desc()).offset(skip).limit(limit).all()

@router.put("/finanzas/{movimiento_id}", response_model=schemas.MovimientoFinancieroResponse)
def update_movimiento(movimiento_id: int, movimiento_update: schemas.MovimientoFinancieroUpdate, db: Session = Depends(get_db)):
    db_mov = db.query(models.MovimientoFinanciero).filter(models.MovimientoFinanciero.id == movimiento_id).first()
    if not db_mov:
        raise HTTPException(status_code=404, detail="Movimiento financiero no encontrado")
    
    update_data = movimiento_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_mov, key, value)
        
    db.commit()
    db.refresh(db_mov)
    return db_mov

@router.delete("/finanzas/{movimiento_id}")
def delete_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    db_mov = db.query(models.MovimientoFinanciero).filter(models.MovimientoFinanciero.id == movimiento_id).first()
    if not db_mov:
        raise HTTPException(status_code=404, detail="Movimiento financiero no encontrado")
    db.delete(db_mov)
    db.commit()
    return {"status": "ok", "message": "Movimiento eliminado con éxito"}

@router.get("/finanzas/metricas")
def get_metricas(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    # Por defecto, si no hay rango, tomamos los últimos 30 días
    if not fecha_inicio:
        fecha_inicio = date.today() - timedelta(days=30)
    if not fecha_fin:
        fecha_fin = date.today()

    # Query general en el rango
    movimientos = db.query(models.MovimientoFinanciero).filter(
        models.MovimientoFinanciero.fecha >= fecha_inicio,
        models.MovimientoFinanciero.fecha <= fecha_fin
    ).all()

    total_ingresos = sum(m.monto for m in movimientos if m.tipo == "Ingreso")
    total_gastos = sum(m.monto for m in movimientos if m.tipo == "Gasto")
    balance = total_ingresos - total_gastos

    # Distribución por categoría
    categorias_gastos = {}
    categorias_ingresos = {}
    for m in movimientos:
        if m.tipo == "Gasto":
            categorias_gastos[m.categoria] = categorias_gastos.get(m.categoria, 0) + m.monto
        else:
            categorias_ingresos[m.categoria] = categorias_ingresos.get(m.categoria, 0) + m.monto

    # Evolución mensual (últimos 6 meses)
    hoy = date.today()
    evolucion = []
    # Generar los últimos 6 meses incluyendo el actual
    for i in range(5, -1, -1):
        year = hoy.year
        month = hoy.month - i
        if month <= 0:
            month += 12
            year -= 1
        
        inicio_mes = date(year, month, 1)
        if month == 12:
            fin_mes = date(year, 12, 31)
        else:
            fin_mes = date(year, month + 1, 1) - timedelta(days=1)

        movs_mes = db.query(models.MovimientoFinanciero).filter(
            models.MovimientoFinanciero.fecha >= inicio_mes,
            models.MovimientoFinanciero.fecha <= fin_mes
        ).all()

        ingresos_mes = sum(m.monto for m in movs_mes if m.tipo == "Ingreso")
        gastos_mes = sum(m.monto for m in movs_mes if m.tipo == "Gasto")
        
        meses_nombres = {
            1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Ago", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic"
        }
        
        evolucion.append({
            "mes": f"{meses_nombres[month]} {str(year)[2:]}",
            "ingresos": ingresos_mes,
            "gastos": gastos_mes,
            "balance": ingresos_mes - gastos_mes
        })

    return {
        "total_ingresos": total_ingresos,
        "total_gastos": total_gastos,
        "balance": balance,
        "categorias_gastos": [{"categoria": k, "monto": v} for k, v in categorias_gastos.items()],
        "categorias_ingresos": [{"categoria": k, "monto": v} for k, v in categorias_ingresos.items()],
        "evolucion_mensual": evolucion
    }

