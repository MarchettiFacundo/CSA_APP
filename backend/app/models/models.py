from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Date, Float
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    apellido = Column(String, index=True, nullable=True)
    telefono = Column(String, nullable=False)
    es_agencia = Column(Boolean, default=False)

    vehiculos = relationship("Vehiculo", back_populates="propietario", cascade="all, delete-orphan")


class Vehiculo(Base):
    __tablename__ = "vehiculos"
    patente = Column(String, primary_key=True, index=True)
    marca = Column(String)
    modelo = Column(String, nullable=True)
    anio = Column(Integer, nullable=True)
    color = Column(String, nullable=True)
    kilometraje = Column(Integer, nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))

    propietario = relationship("Cliente", back_populates="vehiculos")
    ordenes = relationship("OrdenTrabajo", back_populates="vehiculo", cascade="all, delete-orphan")
    turnos = relationship("Turno", back_populates="vehiculo", cascade="all, delete-orphan")
    servicios = relationship("ServicioPeriodico", back_populates="vehiculo", cascade="all, delete-orphan")
    checklists = relationship("CheckListAgencia", back_populates="vehiculo", cascade="all, delete-orphan")


class Turno(Base):
    __tablename__ = "turnos"
    id = Column(Integer, primary_key=True, index=True)
    fecha_hora = Column(DateTime)
    motivo = Column(String)
    estado = Column(String, default="Pendiente") # Pendiente, Confirmado, Cancelado
    vehiculo_patente = Column(String, ForeignKey("vehiculos.patente"))
    
    vehiculo = relationship("Vehiculo", back_populates="turnos")


class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"
    id = Column(Integer, primary_key=True, index=True)
    fecha_ingreso = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    descripcion = Column(Text)
    tareas_realizadas = Column(Text, nullable=True)
    repuestos = Column(Text, nullable=True)
    kilometraje = Column(Integer, nullable=True)
    vehiculo_patente = Column(String, ForeignKey("vehiculos.patente"))

    vehiculo = relationship("Vehiculo", back_populates="ordenes")
    servicios = relationship("ServicioRealizado", back_populates="orden", cascade="all, delete-orphan")

class ServicioRealizado(Base):
    __tablename__ = "servicios_realizados"
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes_trabajo.id"))
    servicio = Column(String, index=True)
    observaciones = Column(Text, nullable=True)
    repuestos = Column(Text, nullable=True)

    orden = relationship("OrdenTrabajo", back_populates="servicios")


class ServicioPeriodico(Base):
    __tablename__ = "servicios_periodicos"
    id = Column(Integer, primary_key=True, index=True)
    tipo_servicio = Column(String)
    kilometraje_actual = Column(Integer, nullable=True)
    fecha_proximo = Column(Date, nullable=True)
    kilometraje_proximo = Column(Integer, nullable=True)
    estado = Column(String, default="Pendiente") # Pendiente, Recordado, Desestimado, Realizado
    vehiculo_patente = Column(String, ForeignKey("vehiculos.patente"))

    vehiculo = relationship("Vehiculo", back_populates="servicios")


class CheckListAgencia(Base):
    __tablename__ = "checklists_agencias"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    motor_ok = Column(Boolean, default=False)
    chapa_ok = Column(Boolean, default=False)
    pintura_ok = Column(Boolean, default=False)
    interiores_ok = Column(Boolean, default=False)
    observaciones = Column(Text, nullable=True)
    vehiculo_patente = Column(String, ForeignKey("vehiculos.patente"))

    vehiculo = relationship("Vehiculo", back_populates="checklists")

class ConfiguracionServicio(Base):
    __tablename__ = "configuracion_servicios"
    id = Column(Integer, primary_key=True, index=True)
    palabra_clave = Column(String, index=True, nullable=False)
    meses_vencimiento = Column(Integer, nullable=False)
    km_vencimiento = Column(Integer, nullable=False)


class MovimientoFinanciero(Base):
    __tablename__ = "movimientos_financieros"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # 'Ingreso' o 'Gasto'
    monto = Column(Float, nullable=False)
    categoria = Column(String, nullable=False)
    fecha = Column(Date, nullable=False)
    descripcion = Column(Text, nullable=True)
    metodo_pago = Column(String, nullable=False, default="Efectivo")

