// ─── Drive upload ─────────────────────────────────────────────────────────────

function uploadFileToDrive(params) {
  var folderId  = params.folderId;
  var fileBase64 = params.fileBase64;
  var fileName  = params.fileName;
  var mimeType  = params.mimeType || 'application/pdf';

  if (!folderId)   throw new Error('uploadFileToDrive: folderId is required');
  if (!fileBase64) throw new Error('uploadFileToDrive: fileBase64 is required');
  if (!fileName)   throw new Error('uploadFileToDrive: fileName is required');

  var folder = DriveApp.getFolderById(folderId);

  // Decode base64 → blob
  var decoded = Utilities.base64Decode(fileBase64);
  var blob    = Utilities.newBlob(decoded, mimeType, fileName);

  var file = folder.createFile(blob);

  // Make file viewable by anyone with the link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId:      file.getId(),
    fileName:    file.getName(),
    webViewLink: file.getUrl(),
    downloadUrl: buildDownloadUrl(file.getId())
  };
}

// ─── Get file URL ─────────────────────────────────────────────────────────────

function getFileUrlById(fileId) {
  if (!fileId) throw new Error('getFileUrlById: fileId is required');
  var file = DriveApp.getFileById(fileId);
  return { url: file.getUrl() };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function buildDownloadUrl(fileId) {
  return 'https://drive.google.com/uc?id=' + fileId + '&export=download';
}
