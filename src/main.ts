import * as core from '@actions/core'

import {
  ZoomFile,
  authenticate,
  getRecordings,
  downloadMeetings,
  deleteRecording,
} from './zoom'
import {init, sync} from './rclone'
import {rmSync} from 'fs'
import path from 'path'

function getDateRange(): [string, string] {
  const lookbackDays = Number(core.getInput('lookback_days') || 1)
  const endDate = new Date(core.getInput('end_date') || Date.now())

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - lookbackDays)

  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  return [start, end]
}

async function downloadRecordings(): Promise<[ZoomFile[], number]> {
  const account = core.getInput('zoom_account_id', {required: true})
  const client = core.getInput('zoom_client_id', {required: true})
  const clientSecret = core.getInput('zoom_client_secret', {required: true})
  const [from, to] = getDateRange()

  await authenticate(account, client, clientSecret)

  const {meetings} = await getRecordings('me', from, to)

  return await downloadMeetings(meetings)
}

async function run(): Promise<void> {
  try {
    // TODO: Upload file using rclone copyurl without downloading it locally
    const [files, totalSize] = await downloadRecordings()
    const deleteOnSuccess = core.getBooleanInput('delete_on_success')
    const folderMap = JSON.parse(
      Buffer.from(core.getInput('folder_map'), 'base64').toString() || '{}'
    )
    const rcloneConfig = Buffer.from(
      core.getInput('rclone_config'),
      'base64'
    ).toString()

    init(rcloneConfig)

    sync(files, totalSize, folderMap, file => {
      if (deleteOnSuccess) {
        deleteRecording(file)
      }
    })

    core.setOutput('recordings', files)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  } finally {
    rmSync(path.join(__dirname, 'downloads'), {recursive: true, force: true})
  }
}

run()
