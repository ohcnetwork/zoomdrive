---
title: Getting started
pageTitle: ZoomDrive - Sync Zooom recordings to Google Drive
description: A GitHub Action to sync Zoom recordings to Google Drive or other cloud storages of your choice.
---

Learn how to get ZoomDrive set up and sync to Google Drive or other cloud storages of your choice. {% .lead %}

{% quick-links %}

{% quick-link title="Quick Start" icon="installation" href="/#quick-start" description="Step-by-step guide to set up ZoomDrive to sync recordings to Google Drive." /%}

{% quick-link title="Bring your own cloud storage" icon="presets" href="/" description="A guide on how to extend to sync to other cloud storages. " /%}

{% /quick-links %}

You'll need a Zoom account with a Pro or higher plan and have Cloud Recording enabled to use ZoomDrive. See [pre-requisites](/#pre-requisites) for more details.

---

## Pre-requisites

You'll need the following before you can use ZoomDrive:

- A Zoom account with a Pro or higher plan and have Cloud Recording enabled
- A Zoom Server-to-Server OAuth app (see [guide](/#create-a-zoom-server-to-server-oauth-app))
- A Google Service Account (see [guide](/#create-a-google-service-account))

### Create a Zoom Server-to-Server OAuth app

Go to [Zoom Marketplace](https://marketplace.zoom.us/develop/create) and create a new app. Select **Server-to-Server OAuth** as the app type. Follow the instructions available [here](https://developers.zoom.us/docs/internal-apps/create/) to create the app.

The following scopes are required for ZoomDrive to work:

- `recording:read:admin`
- `recording:write:admin` (only if recordings are to be deleted after syncing)

Once the app is created, copy the **Account ID**, **Client ID** and **Client Secret**. You'll need these to configure ZoomDrive.

### Create a Google Service Account

A Google Service Account is required to access Google Drive. Follow the instructions [here](https://developers.google.com/identity/protocols/oauth2/service-account) or head over to [Service Accounts - IAM & Admin](https://console.cloud.google.com/iam-admin/serviceaccounts) and create a new service account.

Make sure to enable the Google Drive API for the project by going to [Google Drive - APIs & Services](https://console.cloud.google.com/apis/api/drive.googleapis.com/credentials).

Once the service account is created, download the JSON key file. You'll need this to configure ZoomDrive.

Share the Google Drive folder(s) with the service account email address. This is required for ZoomDrive to be able to upload recordings to Google Drive. You can create multiple folders each for a unique Zoom Meeting ID or a single folder for all recordings.

---

## Setting up ZoomDrive

### Create a workflow file

You'll need a GitHub repository to run the ZoomDrive action. If you don't have one, you can [create a new repository](https://github.com/new).

Create a new workflow file `.github/workflows/zoomdrive.yml` in your repository. You can name the file anything you want, but it must be a YAML file in the `.github/workflows` directory of your repository.

### Configure the workflow

Add the following content to the workflow file:

```yaml
name: ZoomDrive Sync

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *"

jobs:
  sync:
    runs-on: ubuntu-latest
    environment: ZoomDrive Sync
    steps:
      - uses: coronasafe/zoomdrive@latest
        with:
          zoom_account_id: ${{ secrets.ZOOM_ACCOUNT_ID }}
          zoom_client_id: ${{ secrets.ZOOM_CLIENT_ID }}
          zoom_client_secret: ${{ secrets.ZOOM_CLIENT_SECRET }}
          gsa_credentials: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS }}
          meeting_gdrive_folder_map: ${{ secrets.GDRIVE_FOLDER_MAP }}
          delete_on_success: true
```

### Configure Repository Environment Secrets

You'll need to create an environment and add the below secrets to the environment. See [Creating and using encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) for more details.

- `ZOOM_ACCOUNT_ID`: The Zoom Account ID
- `ZOOM_CLIENT_ID`: The Zoom Client ID
- `ZOOM_CLIENT_SECRET`: The Zoom Client Secret
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`: The Google Service Account Credentials
- `GDRIVE_FOLDER_MAP`: A base64 encoded JSON object containing the mapping of Zoom Meeting IDs to Google Drive folder IDs

#### Google Service Account Credentials

The `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` secret is the base64 encoded contents of the JSON key file downloaded from Google Cloud Console. You can encode the file using the following command:

```shell
# on linux
base64 -w 0 <path-to-gsa-credentials.json>

# on mac
base64 -i <path-to-gsa-credentials.json>
```

#### Zoom Meeting ID to Google Drive Folder ID Mapping

The `GDRIVE_FOLDER_MAP` secret is a base64 encoded JSON object containing the mapping of Zoom Meeting IDs to Google Drive folder IDs. The JSON object should have a `default` property which is the Google Drive folder ID to use when a meeting ID is not found in the object. The `default` property is mandatory. You can also set the value of a meeting ID or the `default` property to `false` to skip syncing for that meeting. See the example below:

```json
{
  "85177928324": "1E***********7iUQE",
  "83123232335": "1T***********y49Bw",
  "84898985619": false, // skips syncing for this meeting
  "default": "1T***********y41Bw"
}
```

You can encode the JSON object using the following command:

```shell
# on linux
base64 -w 0 ./folder-map.json

# on mac
base64 -i ./folder-map.json
```

### Configure the workflow schedule

The workflow is configured to run every day at 12:00 AM UTC. You can change the schedule by modifying the `schedule` property of the `schedule` event. See [Events that trigger workflows](https://docs.github.com/en/actions/reference/events-that-trigger-workflows) for more details.

### Commit and push the workflow file

Commit and push the workflow file to the repository. The workflow will run automatically at the scheduled time.
