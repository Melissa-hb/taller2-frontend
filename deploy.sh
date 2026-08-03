#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado - Taller 2 DevOps: taller2-frontend
# Universidad ICESI - Fase 2 (IaC & Continuous Delivery)
# ==============================================================================

set -e

PORT=${PORT:-3000}
BACKEND_URL=${BACKEND_URL:-"http://localhost:8080"}
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "=== [1/5] Iniciando despliegue de taller2-frontend en puerto $PORT ==="
echo "Target Backend URL: $BACKEND_URL"

# ------------------------------------------------------------------------------
# 1. Configuración de Firewall (UFW en Linux / Simulación en macOS)
# ------------------------------------------------------------------------------
echo "=== [2/5] Configurando Firewall y Reglas de Red ==="
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v ufw > /dev/null 2>&1; then
        echo "Detectado sistema Linux. Configurando UFW para habilitar puerto $PORT/tcp..."
        if [ "$EUID" -ne 0 ]; then
            echo "[WARN] Se requieren permisos sudo para modificar UFW. Ejecutando sudo ufw..."
            sudo ufw allow $PORT/tcp comment 'Permitir taller2-frontend' || true
            sudo ufw reload || true
        else
            ufw allow $PORT/tcp comment 'Permitir taller2-frontend' || true
            ufw reload || true
        fi
        echo "Reglas de firewall UFW actualizadas exitosamente."
    else
        echo "[WARN] ufw no está instalado en este sistema Linux. Por favor verifique el firewall manualmente."
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "[INFO] Detectado macOS (Apple Silicon). Simulación de UFW: El puerto $PORT está abierto localmente."
else
    echo "[INFO] Sistema operativo: $OSTYPE. Simulación de políticas de firewall completada."
fi

# ------------------------------------------------------------------------------
# 2. Verificación de Node.js y Dependencias
# ------------------------------------------------------------------------------
echo "=== [3/5] Verificando Entorno de Node.js y npm ==="
if ! command -v node > /dev/null 2>&1; then
    echo "[ERROR] Node.js no está instalado. Por favor instale Node.js 18+ antes de continuar."
    exit 1
fi

if ! command -v npm > /dev/null 2>&1; then
    echo "[ERROR] npm no está instalado."
    exit 1
fi

echo "Instalando dependencias de Node.js..."
npm install --quiet

# ------------------------------------------------------------------------------
# 3. Detener instancias previas y Ejecutar Servidor Frontend (nohup)
# ------------------------------------------------------------------------------
echo "=== [4/5] Liberando puerto $PORT y arrancando Frontend ==="

PID=$(lsof -ti:$PORT || true)
if [ -n "$PID" ]; then
    echo "Deteniendo proceso previo en puerto $PORT (PID: $PID)..."
    kill -9 $PID || true
    sleep 1
fi

export PORT=$PORT
export BACKEND_URL=$BACKEND_URL

echo "=== [5/5] Ejecutando servidor Node.js en segundo plano ==="
nohup node server.js > frontend.log 2>&1 &
NEW_PID=$!

sleep 2

if ps -p $NEW_PID > /dev/null; then
    echo "=========================================================================="
    echo "🌐 ¡DESPLIEGUE EXITOSO DE taller2-frontend!"
    echo "PID del Proceso: $NEW_PID"
    echo "URL Aplicación:  http://localhost:$PORT"
    echo "Status / Health: http://localhost:$PORT/status"
    echo "Log de Salida:   $APP_DIR/frontend.log"
    echo "=========================================================================="
else
    echo "[ERROR] El servidor frontend falló al iniciar. Revisa $APP_DIR/frontend.log para más detalles."
    cat frontend.log
    exit 1
fi
