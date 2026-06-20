// ─── Entry Points ─────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (!verifySecret(body.secret)) {
      return jsonResponse({ status: 'error', error: 'Unauthorized' });
    }

    return routeAction(body.action, body);
  } catch (err) {
    Logger.log('[doPost] ' + err.message);
    return jsonResponse({ status: 'error', error: err.message });
  }
}

function doGet(e) {
  try {
    if (!verifySecret(e.parameter.secret)) {
      return jsonResponse({ status: 'error', error: 'Unauthorized' });
    }

    return routeAction(e.parameter.action, e.parameter);
  } catch (err) {
    Logger.log('[doGet] ' + err.message);
    return jsonResponse({ status: 'error', error: err.message });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

function routeAction(action, params) {
  switch (action) {
    // ── Invoice ──
    case 'saveInvoice':
      return ok(saveInvoice(params.invoice));

    case 'saveInvoiceBatch':
      return ok(saveInvoiceBatch(params.invoices));

    case 'getInvoices':
      return ok(getInvoices(params));

    case 'getInvoice':
      return ok(getInvoiceById(params.id));

    case 'updateInvoice':
      return ok(updateInvoice(params.id, params.data));

    // ── Version ──
    case 'saveVersion':
      return ok(saveVersion(params.version));

    case 'getVersions':
      return ok(getVersions(params.invoiceId));

    // ── Drive ──
    case 'uploadFile':
      return ok(uploadFileToDrive(params));

    case 'getFileUrl':
      return ok(getFileUrlById(params.fileId));

    // ── Utility ──
    case 'init':
      initSheets();
      return ok({ message: 'Sheets initialized successfully' });

    case 'ping':
      return ok({ message: 'pong', timestamp: new Date().toISOString() });

    default:
      return jsonResponse({ status: 'error', error: 'Unknown action: ' + action });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function verifySecret(secret) {
  try {
    return secret === getProp('API_SECRET');
  } catch (_) {
    return false;
  }
}

function ok(data) {
  return jsonResponse({ status: 'success', data: data });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
