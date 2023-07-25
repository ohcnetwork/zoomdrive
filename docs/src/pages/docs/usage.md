---
title: Usage
description: A brief overview of ZoomDrive action's inputs and outputs.
---

| Name                        | Description                                                                                                                                       | Default     |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| `zoom_account_id`           | Account ID of the Zoom Server-to-Server OAuth App.                                                                                                | *Required*  |
| `zoom_client_id`.           | Client ID of the Zoom Server-to-Server OAuth App.                                                                                                 | *Required*  |
| `zoom_client_secret`        | Client Secret of the Zoom Server-to-Server OAuth App.                                                                                             | *Required*  |
| `gsa_credentials`           | The base64 encoded string of the Google Service Account's JSON Credentials file.                                                                  | *Required*  |
| `lookback_days`             | The number of days to look back from `end_date` for which is to be downloaded (Should be < 30 as Zoom's List API itself limits it per API call).  | 1           |
| `end_date`                  | The end date of the recordings. All recordings between `end_date` and `end_date` - `lookback_days` will be attempted for sync.                    | Day of run  |
| `delete_on_success`         | Whether the successfully synced recordings should be deleted or not from Zoom's Cloud.                                                            | False       |
| `meeting_gdrive_folder_map` | A based64 encoded string of a JSON Map of Meeting IDs and Folder IDs. See [here](/#configure-repository-environment-secrets) for more.            | *Required*  |
