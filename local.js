const zoom = require("./zoom");
const { google } = require("googleapis");
const gdrive = require("./gdrive");
const { prettyFileSize, progressBar } = require("./utils");

function getDateRange() {
  const lookbackDays = 7;
  let end = new Date("2023-06-28" || Date.now());

  let start = new Date(end);
  start.setDate(start.getDate() - lookbackDays);

  start = start.toISOString().split("T")[0];
  end = end.toISOString().split("T")[0];

  return [start, end];
}

async function downloadRecordings() {
  const account = process.env.ZOOM_ACCOUNT_ID;
  const client = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
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
  const credentials = Buffer.from(
    process.env.GSA_CREDENTIALS,
    "base64"
  ).toString("utf-8");

  const folderMap = { 83105532335: "1cP_OA__ay2JGzfNXN6586TxChDoOUFqE" };

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
  } catch (error) {
    console.error(error);
  }
}

run();
