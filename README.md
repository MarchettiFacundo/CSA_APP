# Guía de Despliegue y Ejecución - CSA APP

Esta guía contiene los pasos necesarios para configurar, ejecutar localmente y desplegar en producción tanto el **Backend (FastAPI)** como el **Frontend (React + Vite)** de la aplicación CSA APP.

---

## 1. Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:
*   [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
*   [Python](https://www.python.org/) (Versión 3.10 o superior recomendada)
*   [Git](https://git-scm.com/)

---

## 2. Ejecución en Entorno Local (Desarrollo)

### A. Configuración y Ejecución del Backend

1.  Abre una terminal y navega hasta la carpeta del backend:
    ```bash
    cd backend
    ```
2.  Crea un entorno virtual de Python:
    ```bash
    python -m venv venv
    ```
3.  Activa el entorno virtual:
    *   **En Windows (PowerShell)**:
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
    *   **En Windows (CMD)**:
        ```cmd
        .\venv\Scripts\activate.bat
        ```
    *   **En macOS/Linux**:
        ```bash
        source venv/bin/activate
        ```
4.  Instala las dependencias necesarias:
    ```bash
    pip install -r requirements.txt
    ```
5.  Configura las variables de entorno locales creando un archivo `.env` en la carpeta `backend/` basado en el archivo `.env.example`:
    ```env
    DATABASE_URL=sqlite:///./csa_app.db
    SECRET_KEY=clave-secreta-de-desarrollo-super-segura
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```
    *(Nota: Para desarrollo local rápido, puedes usar una base de datos SQLite como se muestra arriba).*
6.  Ejecuta los scripts de inicialización o migración de base de datos si fuera necesario (por ejemplo, `reset_db.py` o `alter_db.py` si deseas estructurar las tablas de forma limpia):
    ```bash
    python reset_db.py
    ```
7.  Inicia el servidor de desarrollo de FastAPI con Uvicorn:
    ```bash
    uvicorn app.main:app --reload
    ```
    El backend estará disponible en `http://localhost:8000`. Puedes ingresar a la documentación interactiva de la API en `http://localhost:8000/docs`.

---

### B. Configuración y Ejecución del Frontend

1.  Abre otra terminal y navega hasta la carpeta del frontend:
    ```bash
    cd frontend
    ```
2.  Instala los paquetes y dependencias de Node:
    ```bash
    npm install
    ```
3.  Configura las variables de entorno locales creando un archivo `.env` en la carpeta `frontend/` (Vite las cargará automáticamente):
    ```env
    VITE_API_URL=http://localhost:8000/api
    ```
4.  Inicia el servidor de desarrollo de Vite:
    ```bash
    npm run dev
    ```
    El frontend se ejecutará típicamente en `http://localhost:5173`. Abre esa URL en tu navegador para ver la aplicación funcionando localmente.

---

## 3. Despliegue en Producción

### Opción Recomendada: CI/CD Automático mediante GitHub

La forma más profesional y sencilla de desplegar es subir el código a un repositorio privado de **GitHub** y conectar los servicios a plataformas en la nube que ofrecen despliegue continuo gratuito o de bajo costo.

---

### A. Despliegue del Backend (API en FastAPI)
Se recomienda utilizar plataformas como **Render**, **Railway** o **Fly.io** por su excelente compatibilidad con Python y bases de datos PostgreSQL.

#### Pasos en Render (PaaS Gratuito/Pago):
1.  Inicia sesión en [Render](https://render.com/).
2.  Crea un nuevo servicio **"Web Service"** y conéctalo a tu repositorio de GitHub.
3.  Configura los siguientes parámetros en la creación:
    *   **Root Directory**: `backend`
    *   **Environment**: `Python`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4.  Configura las **Variables de Entorno (Environment Variables)** en Render:
    *   `DATABASE_URL`: La URL de conexión de tu base de datos de producción (por ejemplo, una base de datos PostgreSQL provista por Render o Supabase). Debe tener el formato `postgresql://user:pass@host:port/dbname?sslmode=require`.
    *   `SECRET_KEY`: Una cadena de texto aleatoria y sumamente segura para firmar tokens.
    *   `ALGORITHM`: `HS256`
    *   `ACCESS_TOKEN_EXPIRE_MINUTES`: `60` (o el tiempo que prefieras).
5.  Haz clic en **Deploy Web Service**. Una vez finalizado, Render te proporcionará una URL pública (ejemplo: `https://csa-backend.onrender.com`).

---

### B. Despliegue del Frontend (React + Vite)
Dado que el frontend se compila a archivos HTML/JS/CSS estáticos, el despliegue es sumamente rápido y de altísimo rendimiento utilizando **Vercel** o **Netlify**. El proyecto ya incluye una configuración optimizada para Vercel (`vercel.json`).

#### Pasos en Vercel:
1.  Navega a la carpeta `frontend/` y edita el archivo `.env.production` colocando la URL de tu backend en producción:
    ```env
    VITE_API_URL=https://tu-backend-en-render.com/api
    ```
2.  Sube los cambios a GitHub.
3.  Inicia sesión en [Vercel](https://vercel.com/) y crea un nuevo proyecto haciendo clic en **Add New** > **Project**.
4.  Importa tu repositorio de GitHub.
5.  Configura los siguientes parámetros para el frontend:
    *   **Root Directory**: `frontend`
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
6.  En la sección **Environment Variables**, añade la variable de producción si prefieres no usar el archivo físico `.env.production`:
    *   `VITE_API_URL` = `https://tu-backend-en-render.com/api`
7.  Haz clic en **Deploy**. ¡Listo! Vercel te proporcionará una URL pública optimizada y con SSL gratuito para acceder a la aplicación.

---

## 4. Estructura de la Base de Datos en Producción
Cuando conectes la aplicación a una base de datos limpia en producción (como PostgreSQL), es necesario inicializar las tablas de la base de datos por primera vez. Para esto, puedes correr el script de inicialización desde el entorno del backend en producción, o ejecutar el script localmente apuntando temporalmente tu `DATABASE_URL` del archivo `.env` a la base de datos de producción antes de desplegar:
```bash
python reset_db.py
```
*(Precaución: Correr `reset_db.py` eliminará y volverá a crear todas las tablas, borrando los datos existentes. Utilízalo únicamente en la inicialización inicial).*
