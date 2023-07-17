const core = require("@actions/core");
const zoom = require("./zoom");
const gdrive = require("./gdrive");
const { google } = require("googleapis");
const { prettyFileSize, progressBar } = require("./utils");

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

  zoom.log("Authenticating using OAuth");
  await zoom.authenticate(account, client, clientSecret);

  zoom.log(`Obtaining Meetings and Recordings between '${from}' and '${to}'`);
  const { meetings } = await zoom.getRecordings("me", from, to);

  const [files, total_size] = await zoom.downloadMeeetings(meetings);
  zoom.log(
    `${progressBar(1)} - Download complete. Total size: ${prettyFileSize(
      total_size
    )}`
  );

  return [files, total_size];
}

async function syncToGoogleDrive(files, total_size) {
  const credentials = Buffer.from(core.getInput("gsa-credentials"), "base64")
    .toString("utf-8")
    .replaceAll(/\\n/g, "\n");

  console.log(credentials);
  console.log("JSON Parse: ", JSON.parse(credentials));

  const folderMap = JSON.parse(core.getInput("meeting-gdrive-folder-map"));

  gdrive.log("Authenticating using Google Service Account Credentials");
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });
  return await gdrive.syncToGoogleDrive(drive, files, total_size, folderMap);
}

async function run() {
  try {
    const [files, total_size] = await downloadRecordings();
    await syncToGoogleDrive(files, total_size);

    core.setOutput("recordings", files);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
