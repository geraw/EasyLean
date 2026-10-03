"""Hard spending cap for the EasyLean pilot's Google Cloud project.

A budget on the project publishes its status to the Pub/Sub topic
billing-cap; when the cost reaches the budget, this function unlinks the
project from its billing account, which stops all paid services in it.
(Google's budgets only send alerts by themselves.) To restart afterwards:
  gcloud billing projects link PROJECT --billing-account=ACCOUNT
"""
import base64
import json
import os

import functions_framework
from googleapiclient import discovery

PROJECT_ID = os.environ["PROJECT_ID"]


@functions_framework.cloud_event
def stop_billing(cloud_event):
    data = json.loads(base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8"))
    cost, budget = data["costAmount"], data["budgetAmount"]
    if cost < budget:
        print(f"Cost {cost} is under the budget {budget}; nothing to do.")
        return

    billing = discovery.build("cloudbilling", "v1", cache_discovery=False)
    name = f"projects/{PROJECT_ID}"
    if not billing.projects().getBillingInfo(name=name).execute().get("billingEnabled"):
        print("Billing is already disabled.")
        return
    billing.projects().updateBillingInfo(name=name, body={"billingAccountName": ""}).execute()
    print(f"Cost {cost} reached the budget {budget}: billing disabled for {PROJECT_ID}.")
