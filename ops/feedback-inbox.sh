#!/bin/sh
# Downloads the feedback students sent (from the bucket of
# ops/deploy-feedback.sh) to ~/EasyLeanFeedback, or to the folder given, and
# opens a page that shows all of it, newest first.
# Needs gcloud, signed in to the account that owns the project, and node.
set -e
PROJECT=easylean-pilot-1003
DIR="${1:-$HOME/EasyLeanFeedback}"
mkdir -p "$DIR"
gcloud storage rsync --recursive "gs://$PROJECT-feedback" "$DIR" --project "$PROJECT"
node "$(dirname "$0")/../feedback/inbox.js" "$DIR"
open "$DIR/index.html" 2>/dev/null || xdg-open "$DIR/index.html" 2>/dev/null || true
