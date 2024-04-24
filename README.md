<a href="https://zoomdrive.ohc.network/">
  <p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/coronasafe/zoomdrive/blob/main/docs/src/images/logo/vector/default-monochrome-white.svg">
      <img alt="CARE Logo" src="https://github.com/coronasafe/zoomdrive/blob/main/docs/src/images/logo/vector/default-monochrome.svg">
    </picture>
  </p>
</a>

<h2></h2>
<p align="center"><b>A GitHub Action that periodically syncs your Zoom cloud meeting recordings to Google Drive.</b></p>
<p align="center">See Quick Start guide & 📖 Docs here: <a href="https://zoomdrive.ohc.network" target="_blank">https://zoomdrive.ohc.network</a></p>
<h2></h2>

## Prerequisites

- ☑️ A zoom Server-to-Server OAuth App scopes: `/recording:read:admin` and `/recording:write:admin`.
- ☑️ A Google Service Account with access to Google Drive API.
- ☑️ Write access to a Google Drive folder for the above service.

_See [here](https://zoomdrive.ohc.network/#pre-requisites) for more info._

## Inputs

Various inputs are defined in [`.github/workflows/main.yaml`](/.github/workflows/main.yaml) to let you configure the zoomdrive action:

| Name                        | Description                                                                                                                                                                                   | Default               |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------|
| `zoom_account_id`           | Account ID of the Zoom Server-to-Server OAuth App.                                                                                                                                            | N/A, Required.        |
| `zoom_client_id`.           | Client ID of the Zoom Server-to-Server OAuth App.                                                                                                                                             | N/A, Required.        |
| `zoom_client_secret`        | Client Secret of the Zoom Server-to-Server OAuth App.                                                                                                                                         | N/A, Required.        |
| `gsa_credentials`           | The base64 encoded string of the Google Service Account's JSON Credentials file.                                                                                                              | N/A, Required.        |
| `lookback_days`             | The number of days to look back from `end_date` for which is to be downloaded (Should be < 30 as Zoom's List API itself limits it per API call).                                              | 1                     |
| `end_date`                  | The end date of the recordings. All recordings between `end_date` and `end_date` - `lookback_days` will be attempted for sync.                                                                | Day of run            |
| `delete_on_success`         | Whether the successfully synced recordings should be deleted or not from Zoom's Cloud.                                                                                                        | False                 |
| `meeting_gdrive_folder_map` | A based64 encoded string of a JSON Map where keys are the meeting ID's (without spaces) and values are the folder ID's of where the recordings of that particular meeting are to be uploaded. | N/A, Required.        |
