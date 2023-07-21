# ZoomDrive

ZoomDrive is a GitHub Action that allows you to automatically download Zoom meeting recordings periodically and upload them to Google Drive. This action simplifies the process of managing Zoom meeting recordings by automating the downloading and uploading tasks, saving you time and effort.

## Prerequisites

- [ ] A zoom Server-to-Server OAuth App with the following scopes
  - View all user recordings `/recording:read:admin`
  - View and manage all user recordings `/recording:write:admin` (Required only if you want to delete recordings from Zoom Cloud after uploading to Google Drive)
- [ ] A Google Service Account with access to Google Drive API (`https://console.cloud.google.com/apis/api/drive.googleapis.com/credentials?project={GOOGLE_CLOUD_PROJECT_ID}`)
- [ ] Write access to a Google Drive folder for the above service

