# 🌐 Repositorio 2: taller2-frontend

Aplicación Web e Interfaz Gráfica Distribuida para el **Taller 2: Simulación de Despliegue DevOps — La Pared de la Confusión y Automatización** de la Universidad ICESI. Desarrollado en Node.js con Express, HTML5, CSS3 Glassmorphism y Vanilla Javascript.

---

## 📋 Funcionalidades Implementadas

- **Consumo REST Parametrizable**: Se conecta a la API del Backend según la variable de entorno `BACKEND_URL` (por defecto `http://localhost:8080`).
- **Controladores de Interfaz (HU1, HU2, HU4)**:
  - Botones interactivos para **Suma**, **Resta**, **Multiplicación** y **División**.
  - **Captura amigable de errores HTTP 400 (HU4)**: Si se intenta dividir por cero, captura el código de estado HTTP 400 y despliega una alerta visual amigable sin romper la experiencia del usuario.
- **Historial SoR en tiempo real (HU3)**: Visualización dinámica de las últimas 5 operaciones persisitidas en `sor_history.txt`.
- **Telemetría y Estado del Sistema (HU5)**:
  - Endpoint `GET /status` en Frontend que reporta Uptime propio y realiza sondaje de salud contra el endpoint `GET /health` del Backend.
  - Indicador badge de conexión en tiempo real (Online/Offline) en la interfaz gráfica.

---

## 📂 Estructura del Repositorio

```text
taller2-frontend/
├── server.js          # Servidor Express.js en puerto 3000 (HU5 /status y /config)
├── package.json       # Dependencias y scripts de Node.js
├── deploy.sh          # Script Bash de despliegue e infraestructura como código (Fase 2)
├── public/            # Interfaz Web SPA
│   ├── index.html     # Estructura de la aplicación web
│   ├── style.css      # Sistema de diseño Glassmorphism Dark Mode
│   └── app.js         # Lógica JS del cliente (HU1 a HU5)
├── .gitignore         # Exclusiones de Git (node_modules, logs)
└── README.md          # Instrucciones de despliegue para Fase 1 y Fase 2
```

---

## 🛠️ Guía de Despliegue Manual — Fase 1 (Silos Organizacionales / ZIP)

En la Fase 1, el equipo de **Devs** envía el código en un comprimido `.zip` al equipo de **Ops**.

### Instrucciones para Ops (Servidor de Producción PC 2):

1. **Descomprimir el código**:
   ```bash
   unzip taller2-frontend.zip -d taller2-frontend
   cd taller2-frontend
   ```

2. **Configurar la Regla de Firewall (UFW)**:
   > ⚠️ **RESTRICCIÓN DE RED**: El cortafuegos debe bloquear todo el tráfico entrante excepto el puerto del Frontend (`3000`).
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 3000/tcp comment 'Permitir Frontend Taller 2'
   sudo ufw enable
   sudo ufw status verbose
   ```

3. **Instalar Dependencias de Node.js**:
   ```bash
   npm install
   ```

4. **Configurar la URL del Backend (IP del PC 1)**:
   ```bash
   export BACKEND_URL="http://192.168.1.X:8080" # Reemplazar con la IP asignada al PC 1 (Backend)
   ```

5. **Iniciar el Servidor Frontend**:
   ```bash
   nohup npm start > frontend.log 2>&1 &
   ```

6. **Verificar Ejecución**:
   Acceder a `http://localhost:3000` o `http://<IP-PC-2>:3000` desde el navegador.

---

## ⚡ Guía de Despliegue Automatizado — Fase 2 (Adopción DevOps / IaC)

En la Fase 2, el equipo integrado ejecuta la automatización del despliegue:

1. **Dar permisos de ejecución al script**:
   ```bash
   chmod +x deploy.sh
   ```

2. **Ejecutar el script de despliegue (opcionalmente pasando BACKEND_URL)**:
   ```bash
   BACKEND_URL="http://192.168.1.X:8080" ./deploy.sh
   ```

El script `deploy.sh` realizará automáticamente:
- Apertura del puerto `3000` en `ufw`.
- Instalación limpia de dependencias Node.js (`npm install`).
- Detención de procesos anteriores en el puerto `3000`.
- Inyección de variables de entorno y arranque del servicio en segundo plano con `nohup`.
