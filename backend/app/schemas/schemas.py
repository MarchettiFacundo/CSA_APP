from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

# --- Cliente ---
class ClienteBase(BaseModel):
    dni: str
    nombre: str
    apellido: str
    telefono: str
    email: Optional[str] = None
    es_agencia: bool = False

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    class Config:
        from_attributes = True

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    es_agencia: Optional[bool] = None

# --- Vehiculo ---
class VehiculoBase(BaseModel):
    patente: str
    marca: str
    modelo: str
    anio: int
    color: str
    kilometraje: Optional[int] = None
    cliente_dni: str

class VehiculoCreate(VehiculoBase):
    pass

class VehiculoResponse(VehiculoBase):
    class Config:
        from_attributes = True

class VehiculoUpdate(BaseModel):
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    color: Optional[str] = None
    kilometraje: Optional[int] = None
    cliente_dni: Optional[str] = None


# --- Turno ---
class TurnoBase(BaseModel):
    fecha_hora: datetime
    motivo: str
    estado: str = "Pendiente"
    vehiculo_patente: str

class TurnoCreate(TurnoBase):
    pass

class TurnoUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_hora: Optional[datetime] = None

class TurnoResponse(TurnoBase):
    id: int

    class Config:
        from_attributes = True

class ClienteEnTurno(BaseModel):
    dni: str
    nombre: str
    apellido: Optional[str] = None
    telefono: str
    email: Optional[str] = None

    class Config:
        from_attributes = True

class VehiculoEnTurno(BaseModel):
    patente: str
    marca: str
    modelo: str
    propietario: ClienteEnTurno

    class Config:
        from_attributes = True

class TurnoDetalladoResponse(BaseModel):
    id: int
    fecha_hora: datetime
    motivo: str
    estado: str
    vehiculo_patente: str
    vehiculo: VehiculoEnTurno

    class Config:
        from_attributes = True

# --- ServicioRealizado ---
class ServicioRealizadoBase(BaseModel):
    servicio: str
    observaciones: Optional[str] = None
    repuestos: Optional[str] = None

class ServicioRealizadoCreate(ServicioRealizadoBase):
    pass

class ServicioRealizado(ServicioRealizadoBase):
    id: int
    orden_id: int

    class Config:
        from_attributes = True

# --- Orden de Trabajo ---
class OrdenTrabajoBase(BaseModel):
    descripcion: str
    tareas_realizadas: Optional[str] = None
    repuestos: Optional[str] = None
    kilometraje: Optional[int] = None
    vehiculo_patente: str

class OrdenTrabajoCreate(OrdenTrabajoBase):
    servicios: Optional[List[ServicioRealizadoCreate]] = None

class OrdenTrabajoResponse(OrdenTrabajoBase):
    id: int
    fecha_ingreso: datetime
    servicios: List[ServicioRealizado] = []

    class Config:
        from_attributes = True

# --- Servicio Periodico ---
class ServicioPeriodicoBase(BaseModel):
    tipo_servicio: str
    kilometraje_actual: Optional[int] = None
    fecha_proximo: Optional[date] = None
    kilometraje_proximo: Optional[int] = None
    estado: str = "Pendiente"
    vehiculo_patente: str

class ServicioPeriodicoCreate(ServicioPeriodicoBase):
    pass

class ServicioPeriodicoUpdate(BaseModel):
    estado: str

class ServicioPeriodicoResponse(ServicioPeriodicoBase):
    id: int

    class Config:
        from_attributes = True

# --- CheckList Agencia ---
class CheckListAgenciaBase(BaseModel):
    motor_ok: bool = False
    chapa_ok: bool = False
    pintura_ok: bool = False
    interiores_ok: bool = False
    observaciones: Optional[str] = None
    vehiculo_patente: str

class CheckListAgenciaCreate(CheckListAgenciaBase):
    pass

class CheckListAgenciaResponse(CheckListAgenciaBase):
    id: int
    fecha: datetime

    class Config:
        from_attributes = True

# --- Configuracion Servicio ---
class ConfiguracionServicioBase(BaseModel):
    palabra_clave: str
    meses_vencimiento: int
    km_vencimiento: int

class ConfiguracionServicioCreate(ConfiguracionServicioBase):
    pass

class ConfiguracionServicioResponse(ConfiguracionServicioBase):
    id: int

    class Config:
        from_attributes = True


# --- Movimiento Financiero ---
class MovimientoFinancieroBase(BaseModel):
    tipo: str  # 'Ingreso' o 'Gasto'
    monto: float
    categoria: str
    fecha: date
    descripcion: Optional[str] = None

class MovimientoFinancieroCreate(MovimientoFinancieroBase):
    pass

class MovimientoFinancieroUpdate(BaseModel):
    tipo: Optional[str] = None
    monto: Optional[float] = None
    categoria: Optional[str] = None
    fecha: Optional[date] = None
    descripcion: Optional[str] = None

class MovimientoFinancieroResponse(MovimientoFinancieroBase):
    id: int

    class Config:
        from_attributes = True

