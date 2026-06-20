// ─── Sheet helpers ────────────────────────────────────────────────────────────

function getSpreadsheet() {
  return SpreadsheetApp.openById(getProp('SPREADSHEET_ID'));
}

function getSheet(name) {
  var sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function initSheets() {
  var ss = getSpreadsheet();
  var defs = [
    { name: INVOICE_SHEET,  headers: INVOICE_HEADERS  },
    { name: VERSION_SHEET,  headers: VERSION_HEADERS  },
    { name: METADATA_SHEET, headers: METADATA_HEADERS }
  ];

  defs.forEach(function(def) {
    var sheet = ss.getSheetByName(def.name) || ss.insertSheet(def.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length)
        .setFontWeight('bold')
        .setBackground('#0F4C81')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });

  Logger.log('initSheets: done');
}

// ─── Row mapping ──────────────────────────────────────────────────────────────

function invoiceToRow(inv) {
  return [
    inv.id,
    inv.courier,
    inv.invoiceNumber,
    inv.invoiceDate,
    JSON.stringify(inv.shipper   || null),
    JSON.stringify(inv.consignee || null),
    JSON.stringify(inv.packages  || []),
    JSON.stringify(inv.charges   || []),
    inv.totalCharge || 0,
    inv.currency    || 'USD',
    inv.status      || 'pending',
    inv.version     || 1,
    inv.pdfUrl      || '',
    inv.excelUrl    || '',
    inv.extractedAt || '',
    inv.createdAt   || '',
    inv.updatedAt   || ''
  ];
}

function rowToInvoice(row) {
  function parseJSON(val, fallback) {
    try { return JSON.parse(val || 'null') || fallback; }
    catch (_) { return fallback; }
  }

  return {
    id:            row[INV.id],
    courier:       row[INV.courier],
    invoiceNumber: row[INV.invoiceNumber],
    invoiceDate:   row[INV.invoiceDate],
    shipper:       parseJSON(row[INV.shipper],   null),
    consignee:     parseJSON(row[INV.consignee], null),
    packages:      parseJSON(row[INV.packages],  []),
    charges:       parseJSON(row[INV.charges],   []),
    totalCharge:   parseFloat(row[INV.totalCharge]) || 0,
    currency:      row[INV.currency],
    status:        row[INV.status],
    version:       parseInt(row[INV.version], 10) || 1,
    pdfUrl:        row[INV.pdfUrl]   || null,
    excelUrl:      row[INV.excelUrl] || null,
    extractedAt:   row[INV.extractedAt],
    createdAt:     row[INV.createdAt],
    updatedAt:     row[INV.updatedAt]
  };
}

// ─── Invoice CRUD ─────────────────────────────────────────────────────────────

function saveInvoice(invoice) {
  var sheet = getSheet(INVOICE_SHEET);
  var now   = new Date().toISOString();

  // Check if invoice already exists
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][INV.id] === invoice.id) {
      var updated = Object.assign({}, invoice, { updatedAt: now });
      sheet.getRange(i + 1, 1, 1, INVOICE_HEADERS.length)
        .setValues([invoiceToRow(updated)]);
      return updated;
    }
  }

  // New invoice
  var newInv = Object.assign({ createdAt: now, updatedAt: now }, invoice);
  sheet.appendRow(invoiceToRow(newInv));
  return newInv;
}

function saveInvoiceBatch(invoices) {
  var sheet = getSheet(INVOICE_SHEET);
  var now   = new Date().toISOString();

  // Build lookup: id → row index (1-based, after header)
  var data = sheet.getDataRange().getValues();
  var idToRowIdx = {};
  for (var i = 1; i < data.length; i++) {
    idToRowIdx[data[i][INV.id]] = i + 1;
  }

  var toUpdate = [];
  var toAppend = [];

  invoices.forEach(function(inv) {
    var enriched = Object.assign({ createdAt: now, updatedAt: now }, inv);
    if (idToRowIdx[inv.id]) {
      toUpdate.push({ rowIdx: idToRowIdx[inv.id], data: enriched });
    } else {
      toAppend.push(enriched);
    }
  });

  // Update existing rows individually (no bulk range for scattered rows)
  toUpdate.forEach(function(item) {
    sheet.getRange(item.rowIdx, 1, 1, INVOICE_HEADERS.length)
      .setValues([invoiceToRow(item.data)]);
  });

  // Append new rows as a single batch write
  if (toAppend.length > 0) {
    var lastRow = sheet.getLastRow();
    var rows = toAppend.map(invoiceToRow);
    sheet.getRange(lastRow + 1, 1, rows.length, INVOICE_HEADERS.length)
      .setValues(rows);
  }

  return { saved: invoices.length, failed: 0 };
}

function getInvoices(params) {
  var sheet = getSheet(INVOICE_SHEET);
  var data  = sheet.getDataRange().getValues();

  // Skip header
  var rows = data.slice(1).filter(function(r) { return r[INV.id]; });

  // Filter by status
  if (params.status) {
    rows = rows.filter(function(r) { return r[INV.status] === params.status; });
  }

  // Filter by courier
  if (params.courier) {
    rows = rows.filter(function(r) { return r[INV.courier] === params.courier; });
  }

  var total    = rows.length;
  var page     = parseInt(params.page, 10)     || 1;
  var pageSize = parseInt(params.pageSize, 10) || 20;
  var start    = (page - 1) * pageSize;
  var items    = rows.slice(start, start + pageSize).map(rowToInvoice);

  return {
    items:      items,
    total:      total,
    page:       page,
    pageSize:   pageSize,
    totalPages: Math.ceil(total / pageSize) || 1
  };
}

function getInvoiceById(id) {
  var sheet = getSheet(INVOICE_SHEET);
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][INV.id] === id) return rowToInvoice(data[i]);
  }

  throw new Error('Invoice not found: ' + id);
}

function updateInvoice(id, patch) {
  var sheet = getSheet(INVOICE_SHEET);
  var data  = sheet.getDataRange().getValues();
  var now   = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (data[i][INV.id] === id) {
      var existing = rowToInvoice(data[i]);
      var updated  = Object.assign({}, existing, patch, {
        id:        existing.id,
        version:   existing.version + 1,
        updatedAt: now
      });
      sheet.getRange(i + 1, 1, 1, INVOICE_HEADERS.length)
        .setValues([invoiceToRow(updated)]);
      return updated;
    }
  }

  throw new Error('Invoice not found: ' + id);
}

// ─── Version CRUD ─────────────────────────────────────────────────────────────

function saveVersion(version) {
  var sheet = getSheet(VERSION_SHEET);
  var now   = new Date().toISOString();
  var row   = [
    version.versionId,
    version.invoiceId,
    version.versionNo,
    JSON.stringify(version.snapshot || null),
    version.createdAt || now
  ];
  sheet.appendRow(row);
  return version;
}

function getVersions(invoiceId) {
  var sheet = getSheet(VERSION_SHEET);
  var data  = sheet.getDataRange().getValues();

  var versions = data.slice(1)
    .filter(function(r) { return r[VER.invoiceId] === invoiceId; })
    .map(function(r) {
      return {
        versionId:  r[VER.versionId],
        invoiceId:  r[VER.invoiceId],
        versionNo:  parseInt(r[VER.versionNo], 10) || 1,
        snapshot:   safeParseJSON(r[VER.snapshot], null),
        createdAt:  r[VER.createdAt]
      };
    });

  // Newest version first
  versions.sort(function(a, b) { return b.versionNo - a.versionNo; });
  return versions;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

function setMetadata(key, value) {
  var sheet = getSheet(METADATA_SHEET);
  var data  = sheet.getDataRange().getValues();
  var now   = new Date().toISOString();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 1, 1, 3).setValues([[key, value, now]]);
      return;
    }
  }
  sheet.appendRow([key, value, now]);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function safeParseJSON(val, fallback) {
  try { return JSON.parse(val || 'null') || fallback; }
  catch (_) { return fallback; }
}
