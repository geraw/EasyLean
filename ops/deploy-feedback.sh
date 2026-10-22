#!/bin/sh
# Deploys feedback/ to Google Cloud Run: the service that keeps the feedback
# students send from the site, in the private bucket gs://$BUCKET.
# Needs gcloud, signed in to the account that owns the project.
#
# The service runs as its own service account, whose only permission is to
# create objects in that bucket: it cannot read the feedback back, or touch
# anything else. Like the backend, at most one instance, scaling to zero when
# idle; feedback is small (a few hundred KB each), so the bucket costs cents.
# Read the feedback with ops/feedback-inbox.sh.
set -e
cd "$(dirname "$0")/../feedback"
PROJECT=easylean-pilot-1003
REGION=europe-west1
BUCKET=$PROJECT-feedback
SA=easylean-feedback@$PROJECT.iam.gserviceaccount.com
gcloud iam service-accounts describe "$SA" --project "$PROJECT" >/dev/null 2>&1 \
    || gcloud iam service-accounts create easylean-feedback \
        --display-name "EasyLean feedback (writes to the feedback bucket only)" --project "$PROJECT"

gcloud storage buckets describe "gs://$BUCKET" --project "$PROJECT" >/dev/null 2>&1 \
    || gcloud storage buckets create "gs://$BUCKET" --project "$PROJECT" --location "$REGION" \
        --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
    --member "serviceAccount:$SA" --role roles/storage.objectCreator >/dev/null

gcloud run deploy easylean-feedback \
    --service-account "$SA" \
    --source . \
    --project "$PROJECT" \
    --region "$REGION" \
    --allow-unauthenticated \
    --min-instances 0 --max-instances 1 \
    --concurrency 10 --cpu 1 --memory 256Mi --timeout 30 \
    --cpu-throttling \
    --set-env-vars "FEEDBACK_BUCKET=$BUCKET" \
    --quiet
