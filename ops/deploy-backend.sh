#!/bin/sh
# Deploys backend/ to Google Cloud Run (the public pilot server).
# Needs gcloud, signed in to the account that owns the project.
#
# Limits keep the pilot within the free tier: at most one instance, which
# scales to zero when idle. The second-generation environment (same price)
# reads files much faster than the first, and Lean reads its whole library
# when it starts: on gen1 that took about 15 s of a cold start. The project also has a hard spending cap: an
# 18 ILS (~$5) budget whose alerts trigger ops/billing-cap, which unlinks
# billing when the budget is reached.
#
# The service runs Lean code from the public, so it runs as its own service
# account with no roles: anything that reads its token from the metadata
# server gets access to nothing. (The default compute account is usually
# Editor on the project.)
#
# Outbound network access is cut too: all egress goes through a VPC whose
# firewall denies every outgoing connection, so a malicious proof cannot
# reach the internet. Incoming requests and their responses are unaffected.
set -e
cd "$(dirname "$0")/../backend"
PROJECT=easylean-pilot-1003
REGION=europe-west1
SA=easylean-runner@$PROJECT.iam.gserviceaccount.com
gcloud iam service-accounts describe "$SA" --project "$PROJECT" >/dev/null 2>&1 \
    || gcloud iam service-accounts create easylean-runner \
        --display-name "EasyLean backend (no permissions)" --project "$PROJECT"

gcloud services enable compute.googleapis.com --project "$PROJECT"
gcloud compute networks describe easylean-isolated --project "$PROJECT" >/dev/null 2>&1 \
    || gcloud compute networks create easylean-isolated --subnet-mode custom --project "$PROJECT"
gcloud compute networks subnets describe easylean-isolated --region "$REGION" --project "$PROJECT" >/dev/null 2>&1 \
    || gcloud compute networks subnets create easylean-isolated --network easylean-isolated \
        --region "$REGION" --range 10.8.0.0/26 --project "$PROJECT"
gcloud compute firewall-rules describe easylean-deny-egress --project "$PROJECT" >/dev/null 2>&1 \
    || gcloud compute firewall-rules create easylean-deny-egress --network easylean-isolated \
        --direction EGRESS --action DENY --rules all --destination-ranges 0.0.0.0/0 \
        --priority 1000 --project "$PROJECT"

gcloud run deploy easylean-backend \
    --service-account "$SA" \
    --network easylean-isolated --subnet easylean-isolated --vpc-egress all-traffic \
    --source . \
    --project "$PROJECT" \
    --region "$REGION" \
    --allow-unauthenticated \
    --min-instances 0 --max-instances 1 \
    --concurrency 4 --cpu 1 --memory 1Gi --timeout 60 \
    --cpu-throttling \
    --execution-environment gen2 \
    --quiet
