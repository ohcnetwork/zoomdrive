const { prettyFileSize, progressBar } = require("./utils");

async function createFolder(drive, name, parent) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parent],
    },
    fields: "id",
  });

  return res.data.id;
}

const log = (msg) => {
  console.log(`[gdrive-api] ${msg}`);
};

async function syncToGoogleDrive(drive, files, total_size, meetingFolderMap) {
  // Skip files that have been marked as false
  files = files.filter((file) => meetingFolderMap[file.id] !== false);

  const responses = [];
  const subFoldersLookup = {};
  let uploadedSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const folderId = meetingFolderMap[file.id] ?? meetingFolderMap["default"];

    if (!folderId) {
      throw new Error(
        `No folder ID found for meeting ${file.id} (${file.topic}) nor a default folder ID provided.`
      );
    }

    const lookupId = `${file.id}.${file.date}`;

    if (!subFoldersLookup[lookupId]) {
      log(
        `${progressBar(uploadedSize / total_size)} of ${prettyFileSize(
          total_size
        )} - Creating subfolder "${file.date}" for meeting "${file.topic}" (${
          file.id
        })`
      );

      subFoldersLookup[lookupId] = await createFolder(
        drive,
        file.date,
        folderId
      );
    }

    const name = file.name;
    const media = {
      mimeType: "application/octet-stream",
      body: require("fs").createReadStream(file.path),
    };

    const subFolder = subFoldersLookup[lookupId];

    log(
      `${progressBar(uploadedSize / total_size)} of ${prettyFileSize(
        total_size
      )} - Uploading ${i + 1}/${files.length} "${file.path}" ${prettyFileSize(
        file.recording.file_size
      )}`
    );

    const res = await drive.files.create({
      requestBody: {
        name,
        parents: [subFolder],
      },
      media,
      fields: "id",
    });

    uploadedSize += file.recording.file_size;
    responses.push(res);
  }

  log(
    `${progressBar(1)} - Upload complete. Total size: ${prettyFileSize(
      uploadedSize
    )}`
  );

  return responses;
}

module.exports = {
  log,
  createFolder,
  syncToGoogleDrive,
};
