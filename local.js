const zoom = require("./zoom");

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

  console.log("Authenticating with Zoom using OAuth");
  await zoom.authenticate(account, client, clientSecret);

  console.log(
    `Obtaining Zoom Meetings and Recordings between ${from} and ${to}`
  );
  const { meetings } = await zoom.getRecordings("me", from, to);

  const files = await zoom.downloadMeeetings(meetings);
  console.log(`Downloaded ${files.length} files`);
}

async function run() {
  try {
    const recordings = await downloadRecordings();
    // core.setOutput("recordings", recordings);
  } catch (error) {
    console.error(error);
  }
}

run();
