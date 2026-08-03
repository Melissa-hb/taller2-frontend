// JavaScript Client Logic - Taller 2 DevOps ICESI

let BACKEND_URL = 'http://localhost:8080';

// Elementos del DOM
const connectionStatusEl = document.getElementById('connectionStatus');
const statusTextEl = document.getElementById('statusText');

const inputAEl = document.getElementById('inputA');
const inputBEl = document.getElementById('inputB');

const resultDisplayEl = document.getElementById('resultDisplay');
const resultOperationEl = document.getElementById('resultOperation');

const errorAlertEl = document.getElementById('errorAlert');
const errorTitleEl = document.getElementById('errorTitle');
const errorMessageEl = document.getElementById('errorMessage');
const closeAlertBtn = document.getElementById('closeAlertBtn');

const historyListEl = document.getElementById('historyList');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

const backendUrlDisplayEl = document.getElementById('backendUrlDisplay');
const backendUptimeDisplayEl = document.getElementById('backendUptimeDisplay');
const frontendUptimeDisplayEl = document.getElementById('frontendUptimeDisplay');
const sorWritableDisplayEl = document.getElementById('sorWritableDisplay');
const telemetryStateEl = document.getElementById('telemetryState');

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  setupEventListeners();
  await updateTelemetryAndStatus();
  await fetchHistory();

  // Polling de telemetría cada 5 segundos
  setInterval(updateTelemetryAndStatus, 5000);
});

// Cargar la configuración exposed por el servidor Express
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
  if (backendUrlDisplayEl) {
    backendUrlDisplayEl.textContent = BACKEND_URL;
  }
}

// Event Listeners
function setupEventListeners() {
  // Botones de Operación (Suma, Resta, Multiplicación, División)
  document.querySelectorAll('.op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.getAttribute('data-op');
      performOperation(op);
    });
  });

  // Cerrar banner de error
  if (closeAlertBtn) {
    closeAlertBtn.addEventListener('click', hideError);
  }

  // Refrescar Historial manualmente
  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', fetchHistory);
  }
}

// Ejecutar Operación en Backend
async function performOperation(operation) {
  hideError();

  const a = parseFloat(inputAEl.value);
  const b = parseFloat(inputBEl.value);

  if (isNaN(a) || isNaN(b)) {
    showError('Error de Validación Input', 'Por favor ingresa números válidos en los campos A y B.');
    return;
  }

  const endpointMap = {
    sum: '/api/sum',
    subtract: '/api/subtract',
    multiply: '/api/multiply',
    divide: '/api/divide'
  };

  const url = `${BACKEND_URL}${endpointMap[operation]}`;

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
      // Éxito HTTP 200
      resultDisplayEl.textContent = data.result;
      resultOperationEl.textContent = data.operation;

      // Actualizar automáticamente el historial en SoR
      await fetchHistory();
    } else if (response.status === 400) {
      // Capturar HTTP 400 amigablemente (HU4: División por cero)
      const errorMsg = data.detail?.error || data.error || 'Error HTTP 400 Bad Request';
      showError('Validación HTTP 400 Bad Request', errorMsg);
      resultDisplayEl.textContent = '❌ ERROR';
      resultOperationEl.textContent = errorMsg;
    } else {
      showError(`Error HTTP ${response.status}`, data.detail || 'Fallo inesperado al comunicarse con el Backend.');
    }
  } catch (err) {
    console.error('Fallo de red en operación:', err);
    showError('Fallo de Conexión de Red', `No se pudo alcanzar el Servidor Backend en ${BACKEND_URL}. Verifique que el servicio esté activo y el Firewall configurado.`);
  }
}

// Consultar Historial (HU3)
async function fetchHistory() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/history`);
    if (!res.ok) return;

    const data = await res.json();
    historyListEl.innerHTML = '';

    if (!data.history || data.history.length === 0) {
      historyListEl.innerHTML = '<li class="empty-state">No hay operaciones registradas aún.</li>';
      return;
    }

    data.history.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.textContent = item;
      historyListEl.appendChild(li);
    });
  } catch (err) {
    console.warn('Error al obtener el historial:', err);
  }
}

// Consultar Telemetría / Status (HU5)
async function updateTelemetryAndStatus() {
  try {
    const res = await fetch('/status');
    if (!res.ok) throw new Error('Status Frontend respondió con error');

    const data = await res.json();

    // Actualizar Uptime Frontend
    if (frontendUptimeDisplayEl) {
      frontendUptimeDisplayEl.textContent = `${data.frontend.uptime_seconds}s`;
    }

    // Evaluar Estado del Backend
    if (data.backend_reachable && data.backend_telemetry) {
      setConnectionStatus(true, 'Backend Online (UP)');
      
      const bt = data.backend_telemetry;
      if (backendUptimeDisplayEl) {
        backendUptimeDisplayEl.textContent = `${bt.uptime_seconds || 0}s`;
      }
      if (sorWritableDisplayEl) {
        sorWritableDisplayEl.textContent = bt.persistence_writable ? 'Sí (chmod 666 OK)' : 'No (Sin Permiso)';
        sorWritableDisplayEl.className = bt.persistence_writable ? 'telemetry-val text-success' : 'telemetry-val text-danger';
      }
      if (telemetryStateEl) {
        telemetryStateEl.textContent = 'SYSTEM UP';
        telemetryStateEl.className = 'badge-tag text-success';
      }
    } else {
      setConnectionStatus(false, 'Backend Desconectado');
      if (backendUptimeDisplayEl) backendUptimeDisplayEl.textContent = 'N/A';
      if (sorWritableDisplayEl) sorWritableDisplayEl.textContent = 'Desconocido';
      if (telemetryStateEl) {
        telemetryStateEl.textContent = 'BACKEND DOWN';
        telemetryStateEl.className = 'badge-tag text-danger';
      }
    }
  } catch (err) {
    setConnectionStatus(false, 'Frontend Desconectado');
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

function showError(title, message) {
  if (errorTitleEl) errorTitleEl.textContent = title;
  if (errorMessageEl) errorMessageEl.textContent = message;
  if (errorAlertEl) errorAlertEl.classList.remove('hidden');
}

function hideError() {
  if (errorAlertEl) errorAlertEl.classList.add('hidden');
}
