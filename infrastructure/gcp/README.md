# Google Cloud Platform — Freshy

Freshy uses **Google Cloud Storage (GCS)** for user-generated and static assets:

| Prefix      | Content                                  |
| ----------- | ---------------------------------------- |
| `places/`   | Venue photos                             |
| `avatars/`  | User profile images                      |
| `ci/`       | PR screenshot previews (public read)     |
| `releases/` | Mobile build artifacts (optional mirror) |

## Prerequisites

- Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated

## 1. Create storage bucket

```bash
export GCP_PROJECT_ID="your-project-id"
export GCS_BUCKET_NAME="freshy-assets"
export GCP_REGION="southamerica-east1"

gcloud config set project "$GCP_PROJECT_ID"

gcloud storage buckets create "gs://${GCS_BUCKET_NAME}" \
  --location="$GCP_REGION" \
  --uniform-bucket-level-access
```

## 2. CORS (web uploads)

```bash
cat > /tmp/gcs-cors.json <<'EOF'
[
  {
    "origin": ["http://localhost:3000", "https://*.freshy.app"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update "gs://${GCS_BUCKET_NAME}" --cors-file=/tmp/gcs-cors.json
```

## 3. Service account

```bash
gcloud iam service-accounts create freshy-api \
  --display-name="Freshy API"

gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET_NAME}" \
  --member="serviceAccount:freshy-api@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud iam service-accounts keys create freshy-sa-key.json \
  --iam-account="freshy-api@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
```

Store the key securely. **Never commit** `freshy-sa-key.json`.

## 4. CI screenshots (public read on `ci/` prefix)

```bash
gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET_NAME}" \
  --member="allUsers" \
  --role="roles/storage.objectViewer" \
  --condition='expression=starts_with(resource.name, "projects/_/buckets/'${GCS_BUCKET_NAME}'/objects/ci/"),title=ci-public-read,description=Public CI screenshots'
```

Or use a dedicated bucket `freshy-ci-screenshots` with uniform public access on that bucket only.

## 5. Environment variables

Copy root `.env.example` to `.env` and set:

```env
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=freshy-assets
GOOGLE_APPLICATION_CREDENTIALS=./freshy-sa-key.json
```

## 6. GitHub Actions secrets

| Secret            | Description                               |
| ----------------- | ----------------------------------------- |
| `GCP_PROJECT_ID`  | GCP project ID                            |
| `GCS_BUCKET_NAME` | Bucket name                               |
| `GCP_SA_KEY`      | Service account JSON (full file contents) |
| `EXPO_TOKEN`      | Expo access token for EAS mobile builds   |

## SDK usage

The backend package (`@freshy/api`) exposes helpers in `src/storage/gcs.ts`:

- `uploadAsset(path, buffer, contentType)` — upload file
- `getSignedUrl(path)` — temporary read URL
- `isGcsConfigured()` — health check
