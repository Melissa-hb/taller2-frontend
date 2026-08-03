// JavaScript Client Logic - HU1 Servicio de Suma (Taller 2 DevOps ICESI)

let BACKEND_URL = 'http://localhost:8080';

// Elementos del DOM
const connectionStatusEl = document.getElementById('connectionStatus');
const statusTextEl = document.getElementById('statusText');
const inputAEl = document.getElementById('inputA');
const inputBEl = document.getElementById('inputB');
const resultDisplayEl = document.getElementById('resultDisplay');
const resultOperationEl = document.getElementById('resultOperation');

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupEventListeners();
});

// Cargar la configuración expuesta por el servidor Express
async function loadConfig() {
  try {
    const res = await fetch('/config');
    if (res.ok) {
      const data = await res.json();
      if (data.backendUrl) {
        BACKEND_URL = data.backendUrl;
      }
    }
  } catch (err) {
    console.warn('Uso de Backend URL por defecto:', BACKEND_URL);
  }
}

// Event Listeners
function setupEventListeners() {
  const sumBtn = document.querySelector('.op-btn[data-op="sum"]');
  if (sumBtn) {
    sumBtn.addEventListener('click', performSum);
  }
}

// Ejecutar Operación de Suma (HU1) en Backend
async function performSum() {
  const a = parseFloat(inputAEl.value);
  const b = parseFloat(inputBEl.value);

  if (isNaN(a) || isNaN(b)) {
    resultDisplayEl.textContent = '❌ ERROR';
    resultOperationEl.textContent = 'Por favor ingresa números válidos en A y B.';
    return;
  }

  const url = `${BACKEND_URL}/api/sum`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ a, b })
    });

    const data = await response.json();

    if (response.ok) {
      resultDisplayEl.textContent = data.result;
      resultOperationEl.textContent = data.operation;
      setConnectionStatus(true, 'Backend Online (HU1)');
    } else {
      resultDisplayEl.textContent = '❌ ERROR';
      resultOperationEl.textContent = `Error HTTP ${response.status}`;
    }
  } catch (err) {
    console.error('Fallo de red en suma:', err);
    resultDisplayEl.textContent = '❌ ERROR';
    resultOperationEl.textContent = `No se pudo alcanzar el Backend en ${BACKEND_URL}.`;
    setConnectionStatus(false, 'Backend Desconectado');
  }
}

function setConnectionStatus(isOnline, message) {
  if (connectionStatusEl) {
    connectionStatusEl.className = `status-badge ${isOnline ? 'online' : 'offline'}`;
  }
  if (statusTextEl) {
    statusTextEl.textContent = message;
  }
}
