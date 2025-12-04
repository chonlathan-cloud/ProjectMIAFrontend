#!/usr/bin/env bash
set -euo pipefail

# =========================
# CONFIG
# =========================
BACKEND_DIR="$HOME/clone/backend-lineboost"
FRONTEND_DIR="$HOME/clone/frontend-lineboost"
DB_CONTAINER_NAME="lineboost-dev-db"
DB_PORT_HOST=5433
PRISMA_CMD="npx prisma migrate status"

# =========================
#  HELPER: log
# =========================
log() {
  printf "\n[run-lineboost] %s\n" "$1"
}

# =========================
# 1) เริ่ม Docker + Postgres
# =========================
log "1) Start Docker container for Postgres: ${DB_CONTAINER_NAME}"

if docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
  docker start "${DB_CONTAINER_NAME}" >/dev/null 2>&1 || true
else
  log "WARNING: ไม่พบ container ชื่อ ${DB_CONTAINER_NAME}"
  log "ถ้ายังไม่ได้สร้าง ให้สร้างเองก่อน เช่น:"
  log "  docker run --name ${DB_CONTAINER_NAME} -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=lineboost_app -p ${DB_PORT_HOST}:5432 -d postgres:16"
  exit 1
fi

log "รอให้ Postgres ตื่น (ตรวจที่พอร์ต ${DB_PORT_HOST})..."

RETRY=0
MAX_RETRY=30
until nc -z localhost "${DB_PORT_HOST}" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -gt "$MAX_RETRY" ]; then
    log "ERROR: Postgres ยังไม่ตอบกลับที่ localhost:${DB_PORT_HOST} ภายในเวลาที่กำหนด"
    exit 1
  fi
  sleep 1
done

log "Postgres พร้อมทำงานแล้ว ✅"

# =========================
# 2) เช็ก Prisma + schema
# =========================
log "2) ตรวจสอบ Prisma migrate status"

cd "${BACKEND_DIR}"
${PRISMA_CMD}

log "Prisma OK ✅"

# =========================
# 3) รัน backend (npm run dev)
# =========================
log "3) รัน Backend (npm run dev) ใน background"

cd "${BACKEND_DIR}"
npm run dev &
BACKEND_PID=$!

log "Backend PID = ${BACKEND_PID}"
log "รอ 5 วินาทีให้ backend ตื่น..."
sleep 5

# =========================
# 4) รัน frontend (npm run dev)
# =========================
log "4) รัน Frontend (npm run dev) ใน background"

cd "${FRONTEND_DIR}"
npm run dev &
FRONTEND_PID=$!

log "Frontend PID = ${FRONTEND_PID}"
log "รอ 5 วินาทีให้ frontend ตื่น..."
sleep 5

# =========================
# 5) สรุป
# =========================
log "ทุกอย่างถูกสตาร์ตแล้ว 🎯"
log "- Backend   → http://localhost:3000"
log "- Frontend  → http://localhost:5173"
log ""
log "ถ้าจะใช้กับ LINE / ngrok ให้เปิดอีกเทอร์มินัลแล้วรัน:"
log "  ngrok http 3000"
log ""
log "ถ้าต้องการหยุดทั้งหมด: kill ${BACKEND_PID} ${FRONTEND_PID}"
#!/usr/bin/env bash
set -euo pipefail

# =========================
# CONFIG
# =========================
BACKEND_DIR="$HOME/clone/backend-lineboost"
FRONTEND_DIR="$HOME/clone/frontend-lineboost"
DB_CONTAINER_NAME="lineboost-dev-db"
DB_PORT_HOST=5433
PRISMA_CMD="npx prisma migrate status"

# =========================
# HELPER: log
# =========================
log() {
  printf "\n[run-lineboost] %s\n" "$1"
}

# =========================
# 1) เริ่ม Docker + Postgres
# =========================
log("1) Start Docker container for Postgres: ${DB_CONTAINER_NAME}")

if docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
  docker start "${DB_CONTAINER_NAME}" >/dev/null 2>&1 || true
else
  log "WARNING: ไม่พบ container ชื่อ ${DB_CONTAINER_NAME}"
  log "ถ้ายังไม่ได้สร้าง ให้สร้างเองก่อน เช่น:"
  log "  docker run --name ${DB_CONTAINER_NAME} -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=lineboost_app -p ${DB_PORT_HOST}:5432 -d postgres:16"
  exit 1
fi

log "รอให้ Postgres ตื่น (ตรวจที่พอร์ต ${DB_PORT_HOST})..."

RETRY=0
MAX_RETRY=30
until nc -z localhost "${DB_PORT_HOST}" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -gt "$MAX_RETRY" ]; then
    log "ERROR: Postgres ยังไม่ตอบกลับที่ localhost:${DB_PORT_HOST} ภายในเวลาที่กำหนด"
    exit 1
  fi
  sleep 1
done

log "Postgres พร้อมทำงานแล้ว ✅"

# =========================
# 2) เช็ก Prisma + schema
# =========================
log "2) ตรวจสอบ Prisma migrate status"

cd "${BACKEND_DIR}"
${PRISMA_CMD}

log "Prisma OK ✅"

# =========================
# 3) รัน backend (npm run dev)
# =========================
log "3) รัน Backend (npm run dev) ใน background"

cd "${BACKEND_DIR}"
npm run dev &
BACKEND_PID=$!

log "Backend PID = ${BACKEND_PID}"
log "รอ 5 วินาทีให้ backend ตื่น..."
sleep 5

# =========================
# 4) รัน frontend (npm run dev)
# =========================
log "4) รัน Frontend (npm run dev) ใน background"

cd "${FRONTEND_DIR}"
npm run dev &
FRONTEND_PID=$!

log "Frontend PID = ${FRONTEND_PID}"
log "รอ 5 วินาทีให้ frontend ตื่น..."
sleep 5

# =========================
# 5) สรุป
# =========================
log "ทุกอย่างถูกสตาร์ตแล้ว 🎯"
log "- Backend   → http://localhost:3000"
log "- Frontend  → http://localhost:5173"
log ""
log "ถ้าจะใช้กับ LINE/ ngrok ให้เปิดอีกเทอร์มินัลแล้วรัน:"
log "  ngrok http 3000"
log ""
log "ถ้าต้องการหยุดทั้งหมด: kill ${BACKEND_PID} ${FRONTEND_PID}"

