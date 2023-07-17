const core = require("@actions/core");
const zoom = require("./zoom");
const { google } = require("googleapis");

function getDateRange() {
  const lookbackDays = Number(core.getInput("lookback-days") || 7);
  let end = new Date(core.getInput("end-date") || Date.now());

  let start = new Date(end);
  start.setDate(start.getDate() - lookbackDays);

  start = start.toISOString().split("T")[0];
  end = end.toISOString().split("T")[0];

  return [start, end];
}

async function downloadRecordings() {
  const account = core.getInput("zoom-account-id");
  const client = core.getInput("zoom-client-id");
  const clientSecret = core.getInput("zoom-client-secret");
  const [from, to] = getDateRange();

  core.info("Authenticating with Zoom using OAuth");
  await zoom.authenticate(account, client, clientSecret);

  core.info(`Obtaining Zoom Meetings and Recordings between ${from} and ${to}`);
  const { meetings } = await zoom.getRecordings("me", from, to);

  const files = await zoom.downloadMeeetings(meetings);
  core.info(`Downloaded ${files.length} files`);

  return files;
}

async function uploadToGoogleDrive(files) {
  const credentials = core.getInput("gsa-credentials");
  const folderId = core.getInput("folder-id");

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  const promises = files.map((file) => {
    const name = file.split("/").pop();
    const media = {
      mimeType: "application/octet-stream",
      body: require("fs").createReadStream(file),
    };

    return drive.files.create({
      requestBody: {
        name,
        parents: [folderId],
      },
      media,
      fields: "id",
    });
  });

  const results = await Promise.all(promises);
  const ids = results.map((result) => result.data.id);

  core.info(`Uploaded ${ids.length} files to Google Drive`);

  return ids;
}

async function run() {
  try {
    const files = await downloadRecordings();
    await uploadToGoogleDrive(files);
    core.setOutput("recordings", files);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
