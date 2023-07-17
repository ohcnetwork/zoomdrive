const fs = require("fs");
const {
  convertTZ,
  titleCase,
  prettyFileSize,
  progressBar,
} = require("./utils");
const qs = require("qs");
const axios = require("axios").default;

const ZOOM_API_SERVER =
  process.env.ZOOM_API_SERVER || "https://api.zoom.us/v2/";

let instance = axios.create({
  baseURL: ZOOM_API_SERVER,
});

const authenticate = async (account_id, client_id, client_secret) => {
  const credentials = Buffer.from(`${client_id}:${client_secret}`);

  const res = await axios.post(
    "https://zoom.us/oauth/token?grant_type=account_credentials",
    qs.stringify({ account_id }),
    {
      headers: {
        Authorization: `Basic ${credentials.toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  instance = axios.create({
    baseURL: ZOOM_API_SERVER,
    headers: {
      Authorization: `Bearer ${res.data.access_token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data.access_token;
};

const getRecordings = async (user_id, from, to) => {
  const res = await instance.get(
    `/users/${user_id}/recordings?page_size=100&from=${from}&to=${to}`
  );
  return res.data;
};

/**
 * @returns Recording File Name (format: "10-00-00 GMT-0700 (Pacific Daylight Time) - Audio Only.m4a")
 */
const getRecordingFileName = (recording, meeting) => {
  const timestamp = convertTZ(recording.recording_start, meeting.timezone)
    .toTimeString()
    .replace(/:/g, "-");
  const rec_type = titleCase(recording.recording_type);
  const ext = recording.file_type.toLowerCase();
  return `${timestamp} - ${rec_type}.${ext}`;
};

/**
 * @returns Meeting Directory (format: "Weekly Sync Meeting/2023-06-16")
 */
const getMeetingDirectory = ({ id, start_time, timezone }) => {
  const ts = convertTZ(start_time, timezone).toISOString().split("T")[0];
  return `${id}/${ts}`;
};

const getFiles = (meetings, parentDir = "./downloads") => {
  let total_size = 0;
  let files = [];

  meetings.forEach((meeting) => {
    const { recording_files } = meeting;
    const dir = `${parentDir}/${getMeetingDirectory(meeting)}`;

    recording_files.forEach((recording) => {
      const name = getRecordingFileName(recording, meeting);
      const path = `${dir}/${name}`;
      const { download_url, file_size } = recording;

      files.push({
        ...meeting,
        recording,
        date: convertTZ(meeting.start_time, meeting.timezone)
          .toISOString()
          .split("T")[0],
        name,
        dir,
        path,
        url: download_url,
        size: file_size,
      });

      total_size += file_size;
    });
  });

  return [files, total_size];
};

const log = (msg) => {
  console.log(`[zoom-cloud] ${msg}`);
};

const downloadMeeetings = async (meetings) => {
  let downloadedSize = 0;
  const [files, total_size] = getFiles(meetings);

  log(
    `${files.length} files (${prettyFileSize(total_size)}) queued for download.`
  );

  for (let i = 0; i < files.length; i++) {
    const { name, dir, path, url, size } = files[i];

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const res = await instance.get(url, { responseType: "stream" });

    res.data.pipe(fs.createWriteStream(path));

    log(
      `${progressBar(downloadedSize / total_size)} of ${prettyFileSize(
        total_size
      )} - Downloading ${i + 1}/${files.length} "${path}" ${prettyFileSize(
        size
      )}`
    );

    res.data.on("data", (chunk) => (downloadedSize += chunk.length));

    await new Promise((resolve) => res.data.on("end", () => resolve()));
  }

  return [files, total_size];
};

const deleteRecording = async (meetingId, recordingId) => {
  const res = await instance.delete(
    `/meetings/${meetingId}/recordings/${recordingId}`
  );
  return res.data;
};

module.exports = {
  log,
  authenticate,
  getRecordings,
  downloadMeeetings,
  deleteRecording,
};
