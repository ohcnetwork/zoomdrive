import * as core from '@actions/core'
import {spawnSync} from 'child_process'
import {writeFileSync} from 'fs'
import {ZoomFile} from './zoom'
import {prettyFileSize, progressBar} from './utils'

export type SyncResponse = ZoomFile & {
  response: number | null
}

const log = (msg: string, level: 'debug' | 'info' | 'error' = 'info'): void => {
  if (level === 'debug') {
    core.debug(`[rclone-api] ${msg}`)
  } else if (level === 'error') {
    core.error(`[rclone-api] ${msg}`)
  } else {
    core.info(`[rclone-api] ${msg}`)
  }
}

export function init(options: string): void {
  spawnSync('rclone', ['config', 'touch'])
  const process = spawnSync('rclone', ['config', 'file'])

  if (process.status !== 0) {
    throw new Error(
      'Failed to get the rclone config file path, using the default config file path.'
    )
  }

  const response = process.stdout.toString()
  const configPath = response.trim().split('\n').pop() || '~/.config/rclone/rclone.conf'

  writeFileSync(configPath, options)
}

export function listRemotes(): string[] {
  const process = spawnSync('rclone', ['listremotes'])

  if (process.status !== 0) {
    throw new Error('Failed to list remotes.')
  }

  return process.stdout.toString().trim().split('\n')
}

export function sync(
  files: ZoomFile[],
  totalSize: number,
  folderMap: Record<string, string | false>,
  onSuccess?: (file: ZoomFile) => void
): SyncResponse[] {
  // TODO: Add support for multiple remotes
  const remote = listRemotes()?.[0]

  if (!remote) {
    throw new Error('No rclone remotes found.')
  }

  files = files.filter(file => folderMap[file.id] !== false)

  const responses: SyncResponse[] = []

  // TODO: Consider uploading entire folder
  for (const [i, file] of files.entries()) {
    const folderPath = folderMap[file.id] ?? folderMap['default'] ?? '/'

    log(
      `${progressBar(
        files
          .slice(0, i - 1)
          .reduce((acc, {recording: {file_size}}) => acc + file_size, 0) / totalSize
      )} of ${prettyFileSize(totalSize)} - Uploading ${i + 1}/${files.length} "${
        file.path
      }" ${prettyFileSize(file.recording.file_size)}`,
      'info'
    )

    // TODO: Add support for showing progress using the --progress flag
    const process = spawnSync('rclone', [
      'copy',
      file.path,
      `${remote}${folderPath}`,
      '--checksum',
    ])

    responses.push({...file, response: process.status})

    if (process.status !== 0) {
      log(`Failed to upload ${file.path}`, 'error')
      continue
    }

    onSuccess?.(file)
  }

  log(
    `${progressBar(1)} - Upload complete. Total size: ${prettyFileSize(
      responses.reduce((acc, {recording: {file_size}}) => acc + file_size, 0)
    )}`,
    'info'
  )

  return responses
}
