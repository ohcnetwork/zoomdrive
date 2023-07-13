const core = require("@actions/core");
const github = require("@actions/github");
const zoom = require("./zoom");

async function downloadRecordings() {
  const account = core.getInput("zoom-account-id");
  const client = core.getInput("zoom-client-id");
  const clientSecret = core.getInput("zoom-client-secret");

  core.info("Obtaining Zoom access token using OAuth");
  const accessToken = await zoom.authenticate(account, client, clientSecret);

  const daysToKeep = Number(core.getInput("days-to-keep"));

  let from = new Date();
  from.setDate(from.getDate() - daysToKeep);
  from = from.toISOString().split("T")[0];

  core.info(
    `Obtaining Zoom Meetings and Recordings for the past ${daysToKeep} days`
  );
  const { meetings } = await zoom.getRecordings(accessToken, "me", from);
}

async function run() {
  try {
    const recordings = await downloadRecordings();
    core.setOutput("recordings", recordings);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
