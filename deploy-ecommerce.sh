#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-lineoa-g49}"
REGION="${REGION:-asia-southeast1}"
SERVICE_NAME_RAW="${SERVICE_NAME:-webecommerce}"
SERVICE_NAME="$(printf '%s' "${SERVICE_NAME_RAW}" | tr '[:upper:]' '[:lower:]')"
REPO_NAME="${REPO_NAME:-frontend-repo}"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud ไม่พบใน PATH"
  exit 1
fi

ENV_FILE="${ENV_FILE:-.env.ecommerce}"
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${ENV_FILE}"
  set +a
else
  echo "ไม่พบไฟล์ ${ENV_FILE} (ใช้สำหรับ webEcommerce)"
  exit 1
fi

if [[ -n "${BACKEND_API_URL:-}" ]]; then
  VITE_API_BASE_URL="${BACKEND_API_URL}"
fi

VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}"
BACKEND_API_URL="${VITE_API_BASE_URL}"

echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
if [[ "${SERVICE_NAME_RAW}" != "${SERVICE_NAME}" ]]; then
  echo "Service: ${SERVICE_NAME} (normalized from ${SERVICE_NAME_RAW})"
else
  echo "Service: ${SERVICE_NAME}"
fi
echo "Repo: ${REPO_NAME}"
echo "Backend API: ${BACKEND_API_URL}"
echo "Image: ${IMAGE}"

gcloud config set project "${PROJECT_ID}" >/dev/null

echo "Enabling required services..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com --project "${PROJECT_ID}" >/dev/null

echo "Checking Artifact Registry repo..."
if ! gcloud artifacts repositories describe "${REPO_NAME}" --project="${PROJECT_ID}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${REPO_NAME}" \
    --project="${PROJECT_ID}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for ${SERVICE_NAME}"
fi

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Ensuring Artifact Registry write access for build service accounts..."
for SA in "${CLOUDBUILD_SA}" "${COMPUTE_SA}"; do
  gcloud artifacts repositories add-iam-policy-binding "${REPO_NAME}" \
    --location "${REGION}" \
    --project "${PROJECT_ID}" \
    --member "serviceAccount:${SA}" \
    --role "roles/artifactregistry.writer" >/dev/null
done

SUBSTITUTIONS=(
  "_IMAGE=${IMAGE}"
  "_VITE_API_BASE_URL=${VITE_API_BASE_URL}"
  "_VITE_SERVERA_BASE_URL=${VITE_SERVERA_BASE_URL:-}"
  "_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY:-}"
  "_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN:-}"
  "_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID:-}"
  "_VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET:-}"
  "_VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID:-}"
  "_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID:-}"
  "_VITE_BUILDER_URL=${VITE_BUILDER_URL:-}"
  "_VITE_LIFF_ID=${VITE_LIFF_ID:-}"
  "_VITE_STORE_ID=${VITE_STORE_ID:-}"
  "_VITE_PUBLIC_SITE_BASE_URL=${VITE_PUBLIC_SITE_BASE_URL:-}"
)

gcloud builds submit \
  --config "cloudbuild-ecommerce.yaml" \
  --substitutions "$(IFS=,; printf '%s' "${SUBSTITUTIONS[*]}")" \
  .

DEPLOY_ARGS=(
  "${SERVICE_NAME}"
  "--image" "${IMAGE}"
  "--region" "${REGION}"
  "--platform" "managed"
  "--port" "8080"
)

if [[ "${ALLOW_UNAUTHENTICATED}" == "true" ]]; then
  DEPLOY_ARGS+=("--allow-unauthenticated")
fi

gcloud run deploy "${DEPLOY_ARGS[@]}"

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format "value(status.url)")"
echo "Service URL: ${SERVICE_URL}"
echo "Deploy complete."
