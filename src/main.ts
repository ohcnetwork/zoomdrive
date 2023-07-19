import * as core from '@actions/core'
import {google, drive_v3} from 'googleapis'

import {syncToGoogleDrive} from './gdrive'
import {ZoomFile, authenticate, getRecordings, downloadMeetings} from './zoom'

const envOrInput = (name: string, options?: core.InputOptions): string => {
  const envName = `INPUT_${name.replace(/[ -]/g, '_').toUpperCase()}`
  return process.env[envName] ?? core.getInput(name, options)
}

function getDateRange(): [string, string] {
  const lookbackDays = Number(envOrInput('lookback-days') || 1)
  const endDate = new Date(envOrInput('end-date') || Date.now())

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - lookbackDays)

  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  return [start, end]
}

async function downloadRecordings(): Promise<[ZoomFile[], number]> {
  const account = envOrInput('zoom-account-id', {required: true})
  const client = envOrInput('zoom-client-id', {required: true})
  const clientSecret = envOrInput('zoom-client-secret', {required: true})
  const [from, to] = getDateRange()

  await authenticate(account, client, clientSecret)

  const {meetings} = await getRecordings('me', from, to)

  return await downloadMeetings(meetings)
}

async function authAndSyncToGoogleDrive(
  files: ZoomFile[],
  total_size: number
): Promise<drive_v3.Schema$File[]> {
  const credentials = Buffer.from(envOrInput('gsa-credentials'), 'base64').toString(
    'utf-8'
  )

  const folderMap = JSON.parse(envOrInput('meeting-gdrive-folder-map'))

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  const drive = google.drive({version: 'v3', auth})
  return await syncToGoogleDrive(drive, files, total_size, folderMap)
}

async function run(): Promise<void> {
  try {
    const [files, total_size] = await downloadRecordings()
    await authAndSyncToGoogleDrive(files, total_size)

    core.setOutput('recordings', files)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
