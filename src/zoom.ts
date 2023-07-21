import * as core from '@actions/core'
import axios from 'axios'
import qs from 'qs'
import fs from 'fs'

import {convertTZ, titleCase, prettyFileSize, progressBar} from './utils'

export interface ZoomRecording {
  deleted_time: string
  download_url: string
  file_path: string
  file_size: number
  file_type: string
  file_extension: string
  id: string
  meeting_id: string
  play_url: string
  recording_end: string
  recording_start: string
  recording_type: string
  status: 'completed' | 'processing' | 'recording' | 'failed'
}

export interface ZoomMeeting {
  timezone: string
  recording_files: ZoomRecording[]
  start_time: string
  id: string
  uuid: string
  topic: string
}

export interface ZoomFile {
  uuid: string
  id: string
  name: string
  dir: string
  path: string
  url: string
  size: number
  recording: ZoomRecording
  date: string
  topic: string
}

interface MeetingsResponse {
  meetings: ZoomMeeting[]
}

const ZOOM_API_SERVER = process.env.ZOOM_API_SERVER || 'https://api.zoom.us/v2/'

let instance = axios.create({
  baseURL: ZOOM_API_SERVER,
})

const log = (msg: string): void => {
  core.debug(`[zoom-cloud] ${msg}`)
}

export const authenticate = async (
  account_id: string,
  client_id: string,
  client_secret: string
): Promise<string> => {
  log('Authenticating using OAuth')
  const credentials = Buffer.from(`${client_id}:${client_secret}`)

  const res = await axios.post(
    'https://zoom.us/oauth/token?grant_type=account_credentials',
    qs.stringify({account_id}),
    {
      headers: {
        Authorization: `Basic ${credentials.toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  instance = axios.create({
    baseURL: ZOOM_API_SERVER,
    headers: {
      Authorization: `Bearer ${res.data.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  return res.data.access_token
}

export const getRecordings = async (
  user_id: string,
  from: string,
  to: string
): Promise<MeetingsResponse> => {
  log(`Obtaining Meetings and Recordings between '${from}' and '${to}'`)
  const res = await instance.get(
    `/users/${user_id}/recordings?page_size=100&from=${from}&to=${to}`
  )
  return res.data
}

/**
 * @returns Recording File Name (format: "10-00-00 GMT-0700 (Pacific Daylight Time) - Audio Only.m4a")
 */
export const getRecordingFileName = (
  recording: ZoomRecording,
  meeting: ZoomMeeting
): string => {
  const timestamp = convertTZ(recording.recording_start, meeting.timezone)
    .toTimeString()
    .replace(/:/g, '-')
  const rec_type = titleCase(recording.recording_type)
  const ext = recording.file_type.toLowerCase()
  return `${timestamp} - ${rec_type}.${ext}`
}

/**
 * @returns Meeting Directory (format: "Weekly Sync Meeting/2023-06-16")
 */
const getMeetingDirectory = ({id, start_time, timezone}: ZoomMeeting): string => {
  const ts = convertTZ(start_time, timezone).toISOString().split('T')[0]
  return `${id}/${ts}`
}

const getFiles = (
  meetings: ZoomMeeting[],
  parentDir = './downloads'
): [ZoomFile[], number] => {
  let total_size = 0
  const zoomFiles: ZoomFile[] = []

  for (const meeting of meetings) {
    const {recording_files} = meeting
    const dir = `${parentDir}/${getMeetingDirectory(meeting)}`

    for (const recording of recording_files) {
      if (recording.status !== 'completed') {
        continue
      }

      const name = getRecordingFileName(recording, meeting)
      const path = `${dir}/${name}`
      const {download_url, file_size} = recording

      zoomFiles.push({
        ...meeting,
        recording,
        date: convertTZ(meeting.start_time, meeting.timezone)
          .toISOString()
          .split('T')[0],
        name,
        dir,
        path,
        url: download_url,
        size: file_size,
      })

      total_size += file_size
    }
  }

  return [zoomFiles, total_size]
}

export const downloadMeetings = async (
  meetings: ZoomMeeting[]
): Promise<[ZoomFile[], number]> => {
  let downloadedSize = 0
  const [files, total_size] = getFiles(meetings)

  log(`${files.length} files (${prettyFileSize(total_size)}) queued for download.`)

  for (let i = 0; i < files.length; i++) {
    const {dir, path, url, size} = files[i]

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true})
    }

    const res = await instance.get(url, {responseType: 'stream'})

    res.data.pipe(fs.createWriteStream(path))

    log(
      `${progressBar(downloadedSize / total_size)} of ${prettyFileSize(
        total_size
      )} - Downloading ${i + 1}/${files.length} "${path}" ${prettyFileSize(size)}`
    )

    res.data.on('data', (chunk: {length: number}) => (downloadedSize += chunk.length))

    await new Promise<void>(resolve => res.data.on('end', () => resolve()))
  }

  if (total_size) {
    log(
      `${progressBar(1)} - Download complete. Total size: ${prettyFileSize(total_size)}`
    )
  }

  return [files, total_size]
}

export const deleteRecording = async (
  meetingId: string,
  recordingId: string
): Promise<{}> => {
  const res = await instance.delete(`/meetings/${meetingId}/recordings/${recordingId}`)
  return res.data
}
