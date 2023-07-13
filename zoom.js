const fs = require("fs");
const { convertTZ, titleCase } = require("./utils");
const ZOOM_API_SERVER = "https://api.zoom.us/v2";
const { Headers, FormData } = require("node-fetch");

const getAccessToken = async (account_id, client_id, client_secret) => {
  const headers = new Headers();
  headers.append(
    "Authorization",
    `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString("base64")}`
  );

  const body = new FormData();
  body.append("account_id", account_id);

  const response = await fetch(
    "https://zoom.us/oauth/token?grant_type=account_credentials",
    {
      method: "POST",
      headers,
      body,
    }
  );

  if (response.status !== 200) {
    throw new Error(await response.text());
  }

  const json = await response.json();
  return json;
};

const getHeaders = (access_token) => {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${access_token}`);
  return headers;
};

const getRecordings = async (access_token, user_id, from) => {
  const response = await fetch(
    `${ZOOM_API_SERVER}/users/${user_id}/recordings?page_size=100&from=${from}`,
    {
      method: "GET",
      headers: getHeaders(access_token),
    }
  );

  if (response.status !== 200) {
    throw new Error(await response.text());
  }

  const json = await response.json();
  return json;
};

const getRecordingFileName = (recording, meeting) => {
  const timestamp = convertTZ(recording.recording_start, meeting.timezone);
  const rec_type = titleCase(recording.recording_type);
  const ext = recording.file_type.toLowerCase();

  return `${timestamp} - ${rec_type}.${ext}`;
};

const getMeetingDirectory = ({ topic, start_time, timezone }) => {
  const ts = convertTZ(start_time, timezone).toLocaleString().toUpperCase();
  const dir = topic.replace(/[^a-zA-Z0-9]/g, "_");
  return `${dir}/${ts}`;
};

const getDownloadFilePaths = (meeting) => {
  return meeting.recording_files.map((recording) => {
    const fileName = getRecordingFileName(recording, meeting);
    const dir = getMeetingDirectory(meeting);
    return `./downloads/${dir}/${fileName}`;
  });
};

const downloadMeeting = async (access_token, meeting) => {
  const { recording_files } = meeting;
  const headers = getHeaders(access_token);
  const filePaths = getDownloadFilePaths(meeting);

  let totalProgress = 0;

  for (let i = 0; i < recording_files.length; i++) {
    const { download_url, file_size } = recording_files[i];
    const path = filePaths[i];

    const file = fs.createWriteStream(path);

    const response = await fetch(download_url, {
      method: "GET",
      headers,
    });

    response.body.pipe(file);

    let progress = 0;
    response.body.on("data", (chunk) => {
      progress += chunk.length;
      totalProgress += chunk.length;
      const percent = ((progress * 100) / file_size).toFixed();
      const totalPercent = (
        (totalProgress * 100) /
        meeting.total_size
      ).toFixed();
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(
        // 16% - Downloading 1/2 "Weekly Sync Meeting/2023-06-16/2023-06-16 10:00:00 AM - Recording.mp4" (32% of 1000000)
        `${totalPercent}% - Downloading ${i + 1}/${
          recording_files.length
        } "${path}" (${percent}% of ${file_size})`
      );
    });

    await new Promise((resolve) => {
      response.body.on("end", () => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Downloaded ${fileName}\n`);
        resolve();
      });
    });
  }
  // const { id, topic, start_time, total_size, recording_files } = meeting;
  // recording_files.forEach(async ({ download_url, file_size, file_type }) => {
  //   const response = await fetch(download_url, {
  //     method: "GET",
  //     headers: getHeaders(access_token),
  //   });

  //   const file = fs.createWriteStream(
  //     `${directory}/${topic.replace(/[^a-zA-Z0-9]/g, "_")}_${id}.${file_type}`
  //   );
  //   response.body.pipe(file);

  //   let progress = 0;
  //   response.body.on("data", (chunk) => {
  //     progress += chunk.length;
  //     const percent = ((progress / file_size) * 100).toFixed(2);
  //     process.stdout.clearLine();
  //     process.stdout.cursorTo(0);
  //     process.stdout.write(
  //       `Downloading ${topic} (${percent}% of ${total_size})`
  //     );
  //   });

  //   response.body.on("end", () => {
  //     process.stdout.clearLine();
  //     process.stdout.cursorTo(0);
  //     process.stdout.write(`Downloaded ${topic} (${file_size} bytes)\n`);
  //   });
  // });
};

module.exports = {
  getAccessToken,
  getRecordings,
  downloadMeeting,
};
