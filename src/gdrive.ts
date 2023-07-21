import * as core from '@actions/core'
import type {drive_v3} from 'googleapis'
import fs from 'fs'

import {prettyFileSize, progressBar} from './utils'
import {ZoomFile} from './zoom'

const log = (msg: string): void => {
  core.debug(`[gdrive-api] ${msg}`)
}

export async function createFolder(
  drive: drive_v3.Drive,
  name: string,
  parent: string
): Promise<string | null | undefined> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parent],
    },
    fields: 'id',
  })

  return res.data.id
}

export async function syncToGoogleDrive(
  drive: drive_v3.Drive,
  files: ZoomFile[],
  total_size: number,
  meetingFolderMap: {[key: string]: string | false},
  onSuccess: (file: ZoomFile) => void
): Promise<drive_v3.Schema$File[]> {
  // Skip meetings that have been marked as false
  files = files.filter(file => meetingFolderMap[file.id] !== false)

  const responses = []
  const subFoldersLookup: {[key: string]: string} = {}
  let uploadedSize = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const folderId = meetingFolderMap[file.id] ?? meetingFolderMap['default']

    if (!folderId) {
      throw new Error(
        `No folder ID found for meeting ${file.id} (${file.topic}) nor a default folder ID provided.`
      )
    }

    const lookupId = `${file.id}.${file.date}`

    if (!subFoldersLookup[lookupId]) {
      log(
        `${progressBar(uploadedSize / total_size)} of ${prettyFileSize(
          total_size
        )} - Creating subfolder "${file.date}" for meeting "${file.topic}" (${file.id})`
      )

      const driveFolderId = await createFolder(drive, file.date, folderId)
      if (driveFolderId) {
        subFoldersLookup[lookupId] = driveFolderId
      } else {
        throw new Error(
          `Failed to create folder "${file.date}" for meeting "${file.topic}" (${file.id})`
        )
      }
    }

    const {name} = file
    const media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(file.path),
    }

    const subFolder = subFoldersLookup[lookupId]

    log(
      `${progressBar(uploadedSize / total_size)} of ${prettyFileSize(
        total_size
      )} - Uploading ${i + 1}/${files.length} "${file.path}" ${prettyFileSize(
        file.recording.file_size
      )}`
    )

    const res = await drive.files.create({
      requestBody: {
        name,
        parents: [subFolder],
      },
      media,
      fields: 'id',
    })

    uploadedSize += file.recording.file_size
    responses.push(res as drive_v3.Schema$File)

    onSuccess(file)
  }

  if (uploadedSize) {
    log(
      `${progressBar(1)} - Upload complete. Total size: ${prettyFileSize(uploadedSize)}`
    )
  }

  return responses
}
