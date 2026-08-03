const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

const START_TIME = Date.now();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// HU5: Telemetría de Operaciones / Health Check en Frontend (/status)
app.get('/status', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
  let backendHealth = null;
  let backendReachable = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${BACKEND_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      backendHealth = await response.json();
      backendReachable = true;
    }
  } catch (error) {
    backendHealth = { error: `No se pudo conectar al Backend en ${BACKEND_URL}: ${error.message}` };
  }

  res.json({
    frontend: {
      status: "UP",
      uptime_seconds: uptimeSeconds,
      port: PORT,
      timestamp: new Date().toISOString()
    },
    backend_url: BACKEND_URL,
    backend_reachable: backendReachable,
    backend_telemetry: backendHealth
  });
});

// Endpoint de configuración para que el cliente web obtenga la URL del backend
app.get('/config', (req, res) => {
  res.json({
    backendUrl: BACKEND_URL
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==========================================================================`);
  console.log(`🌐 Servidor Frontend corriendo exitosamente`);
  console.log(`Servidor Local:   http://localhost:${PORT}`);
  console.log(`Backend URL:      ${BACKEND_URL}`);
  console.log(`Status Telemetría:http://localhost:${PORT}/status`);
  console.log(`==========================================================================`);
});
