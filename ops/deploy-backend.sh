#!/bin/sh
# Deploys backend/ to Google Cloud Run (the public pilot server).
# Needs gcloud, signed in to the account that owns the project.
#
# Limits keep the pilot within the free tier: at most one instance, which
# scales to zero when idle. The project also has a hard spending cap: an
# 18 ILS (~$5) budget whose alerts trigger ops/billing-cap, which unlinks
# billing when the budget is reached.
set -e
cd "$(dirname "$0")/../backend"
gcloud run deploy easylean-backend \
    --source . \
    --project easylean-pilot-1003 \
    --region europe-west1 \
    --allow-unauthenticated \
    --min-instances 0 --max-instances 1 \
    --concurrency 4 --cpu 1 --memory 1Gi --timeout 60 \
    --cpu-throttling \
    --quiet
