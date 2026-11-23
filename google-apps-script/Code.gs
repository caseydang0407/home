/**
 * California Nurses Association (CNA) — Serverless Google Sheets & Email Backend
 * Deploy as a Google Apps Script Web App (Execute as: Me, Who has access: Anyone).
 *
 * ============================================================================
 * 1. EASY CONFIGURATION: EMAIL RECIPIENTS PER LOCATION (EDIT HERE)
 * ============================================================================
 * Update the email lists below for each California chapter.
 * At 7:00 PM PT daily, a PDF attendance report is emailed ONLY for locations
 * that had at least one member check-in on that date. If a location had 0
 * check-ins on that date, NO email is sent for that location.
 */
const EMAIL_RECIPIENTS_BY_LOCATION = {
  'Sacramento': [
    'sacramento-organizers@calnurses.org',
    'sac-field-lead@calnurses.org',
  ],
  'San Francisco': [
    'sf-organizers@calnurses.org',
    'bayarea-lead@calnurses.org',
  ],
  'Los Angeles': [
    'la-organizers@calnurses.org',
    'socal-lead@calnurses.org',
  ],
  'Irvine': [
    'irvine-organizers@calnurses.org',
    'oc-field-lead@calnurses.org',
  ],
  'San Diego': [
    'sandiego-organizers@calnurses.org',
    'sd-field-lead@calnurses.org',
  ],
};

/**
 * ============================================================================
 * 2. SECRET ACCESS CODES PER LOCATION
 * ============================================================================
 * Stored in Script Properties (via setupCnaBackend() or Project Settings ->
 * Script Properties) so secret codes are never exposed in public HTML/JS.
 */
const LOCATION_PROPERTY_KEYS = {
  'Sacramento': 'SECRET_CODE_SACRAMENTO',
  'San Francisco': 'SECRET_CODE_SAN_FRANCISCO',
  'Los Angeles': 'SECRET_CODE_LOS_ANGELES',
  'Irvine': 'SECRET_CODE_IRVINE',
  'San Diego': 'SECRET_CODE_SAN_DIEGO',
};

const SHEET_NAME_CHECKINS = 'CheckIns';

/**
 * Run this once from the Apps Script Editor to initialize the Google Sheet
 * database tab, default secret codes in Script Properties, and the 7:00 PM trigger.
 */
function setupCnaBackend() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let checkInsSheet = ss.getSheetByName(SHEET_NAME_CHECKINS);
  if (!checkInsSheet) {
    checkInsSheet = ss.insertSheet(SHEET_NAME_CHECKINS);
    checkInsSheet.appendRow([
      'RecordID',
      'DateKey',
      'TimestampISO',
      'MemberName',
      'Phone',
      'Email',
      'Role',
      'Department',
      'Location',
      'SyncedAtISO'
    ]);
    checkInsSheet.setFrozenRows(1);
  }

  const props = PropertiesService.getScriptProperties();
  const defaultCodes = {
    SECRET_CODE_SACRAMENTO: 'SAC-CNA-2026',
    SECRET_CODE_SAN_FRANCISCO: 'SF-CNA-2026',
    SECRET_CODE_LOS_ANGELES: 'LA-CNA-2026',
    SECRET_CODE_IRVINE: 'IRV-CNA-2026',
    SECRET_CODE_SAN_DIEGO: 'SD-CNA-2026',
  };

  Object.keys(defaultCodes).forEach(function (key) {
    if (!props.getProperty(key)) {
      props.setProperty(key, defaultCodes[key]);
    }
  });

  installSevenPmTrigger();
}

/**
 * Schedules the daily 7:00 PM PT email check & PDF dispatch.
 */
function installSevenPmTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'sendDailyAttendancePdfReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('sendDailyAttendancePdfReport')
    .timeBased()
    .everyDays(1)
    .atHour(19)
    .nearMinute(0)
    .create();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getCheckins';

  if (action === 'getCheckins') {
    const location = e.parameter.location || '';
    const records = readCheckInsFromSheet(location);
    return jsonResponse({ ok: true, records: records });
  }

  if (action === 'health') {
    return jsonResponse({ ok: true, service: 'CNA Google Sheets Check-In Backend' });
  }

  return jsonResponse({ ok: false, error: 'Unsupported GET action' });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;

    if (action === 'verifyAccess') {
      return jsonResponse(verifyLocationCode(body.location, body.code));
    }

    if (action === 'syncCheckins') {
      const records = Array.isArray(body.records) ? body.records : [];
      const inserted = appendUniqueCheckIns(records);
      return jsonResponse({ ok: true, insertedCount: inserted, syncedAt: new Date().toISOString() });
    }

    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function verifyLocationCode(location, submittedCode) {
  const propKey = LOCATION_PROPERTY_KEYS[location];
  if (!propKey) {
    return { ok: false, authorized: false, error: 'Invalid location selected.' };
  }
  const expected = PropertiesService.getScriptProperties().getProperty(propKey);
  if (!expected) {
    return { ok: false, authorized: false, error: 'Location access code is not configured.' };
  }
  const normalizedSubmitted = String(submittedCode || '').trim().toUpperCase();
  const normalizedExpected = String(expected).trim().toUpperCase();

  if (normalizedSubmitted === normalizedExpected) {
    return { ok: true, authorized: true, location: location };
  }
  return { ok: false, authorized: false, error: 'Incorrect secret code for ' + location + '.' };
}

function readCheckInsFromSheet(locationFilter) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_CHECKINS);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const records = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    var loc = String(row[8] || '');
    if (locationFilter && loc !== locationFilter) continue;
    records.push({
      id: String(row[0]),
      dateKey: String(row[1]),
      timestamp: String(row[2]),
      name: String(row[3]),
      phone: String(row[4] || ''),
      email: String(row[5] || ''),
      role: String(row[6]),
      department: String(row[7]),
      location: loc,
      syncStatus: 'synced'
    });
  }
  return records;
}

function appendUniqueCheckIns(incomingRecords) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_CHECKINS) || ss.insertSheet(SHEET_NAME_CHECKINS);
  const existing = sheet.getDataRange().getValues();

  const seenKeys = {};
  for (var i = 1; i < existing.length; i++) {
    var row = existing[i];
    var dedupeKey = String(row[1]) + '|' + String(row[8]) + '|' + String(row[3]).trim().toLowerCase();
    seenKeys[dedupeKey] = true;
  }

  var nowIso = new Date().toISOString();
  var inserted = 0;

  incomingRecords.forEach(function (rec) {
    var dedupeKey = String(rec.dateKey) + '|' + String(rec.location) + '|' + String(rec.name).trim().toLowerCase();
    if (!seenKeys[dedupeKey]) {
      sheet.appendRow([
        rec.id,
        rec.dateKey,
        rec.timestamp,
        rec.name,
        rec.phone || '',
        rec.email || '',
        rec.role,
        rec.department,
        rec.location,
        nowIso
      ]);
      seenKeys[dedupeKey] = true;
      inserted++;
    }
  });

  return inserted;
}

/**
 * Automatically runs daily at 7:00 PM PT (19:00) via time-based trigger.
 * - Checks each location independently.
 * - If a location has 0 check-ins on that date, NO email is sent for that location.
 * - If a location has >= 1 check-in, generates a PDF attachment and emails that location's list.
 */
function sendDailyAttendancePdfReport(customDateKey) {
  var tz = 'America/Los_Angeles';
  var dateKey = customDateKey || Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var allRecords = readCheckInsFromSheet('');
  var todaysRecords = allRecords.filter(function (r) {
    return r.dateKey === dateKey;
  });

  // Skip completely if no one checked in anywhere on this date
  if (todaysRecords.length === 0) {
    Logger.log('No check-in activity on ' + dateKey + '. Skipping 7:00 PM email.');
    return { sentLocations: [], skippedAll: true };
  }

  var sentLocations = [];

  Object.keys(EMAIL_RECIPIENTS_BY_LOCATION).forEach(function (location) {
    var locationRecords = todaysRecords.filter(function (r) {
      return r.location === location;
    });

    // Only send email if there is sign-in activity for this location on this date
    if (locationRecords.length === 0) {
      Logger.log('No check-ins for ' + location + ' on ' + dateKey + '. No email sent.');
      return;
    }

    var recipients = (EMAIL_RECIPIENTS_BY_LOCATION[location] || []).filter(Boolean);
    if (recipients.length === 0) {
      Logger.log('No email recipients configured for ' + location + '.');
      return;
    }

    var roleCounts = { 'Union Rep': 0, 'Unit Rep': 0, 'PPC': 0 };
    locationRecords.forEach(function (r) {
      roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
    });

    var rowsHtml = locationRecords.map(function (r, idx) {
      var timeStr = Utilities.formatDate(new Date(r.timestamp), tz, 'hh:mm a');
      return '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td><strong>' + escapeHtml(r.name) + '</strong></td>' +
        '<td>' + escapeHtml(r.phone) + '</td>' +
        '<td>' + escapeHtml(r.email) + '</td>' +
        '<td>' + escapeHtml(r.role) + '</td>' +
        '<td>' + escapeHtml(r.department) + '</td>' +
        '<td>' + timeStr + '</td>' +
      '</tr>';
    }).join('');

    var html =
      '<html><head><style>' +
      'body{font-family:Helvetica,Arial,sans-serif;color:#0f172a;margin:28px;font-size:11px;}' +
      '.header{border-bottom:3px solid #b91c1c;padding-bottom:12px;margin-bottom:18px;}' +
      'h1{margin:0;font-size:18px;color:#0f172a;}' +
      '.sub{margin:4px 0 0;color:#475569;font-size:11px;}' +
      '.summary{display:table;width:100%;margin-bottom:18px;border-collapse:collapse;}' +
      '.kpi{display:table-cell;width:25%;border:1px solid #cbd5e1;padding:10px;background:#f8fafc;}' +
      '.kpi-label{font-size:9px;color:#475569;text-transform:uppercase;}' +
      '.kpi-val{font-size:16px;font-weight:bold;color:#0f172a;margin-top:4px;}' +
      'table.roster{width:100%;border-collapse:collapse;margin-top:12px;}' +
      'table.roster th{background:#0f172a;color:#ffffff;text-align:left;padding:7px;font-size:10px;}' +
      'table.roster td{border-bottom:1px solid #e2e8f0;padding:6px 7px;font-size:10px;}' +
      '</style></head><body>' +
      '<div class="header">' +
      '<h1>California Nurses Association — ' + escapeHtml(location) + ' Daily Participation</h1>' +
      '<p class="sub">Report Date: ' + dateKey + ' · Generated at 7:00 PM PT</p>' +
      '</div>' +
      '<div class="summary">' +
      '<div class="kpi"><div class="kpi-label">Total Check-Ins</div><div class="kpi-val">' + locationRecords.length + '</div></div>' +
      '<div class="kpi"><div class="kpi-label">Union Reps</div><div class="kpi-val">' + (roleCounts['Union Rep'] || 0) + '</div></div>' +
      '<div class="kpi"><div class="kpi-label">Unit Reps</div><div class="kpi-val">' + (roleCounts['Unit Rep'] || 0) + '</div></div>' +
      '<div class="kpi"><div class="kpi-label">PPC Members</div><div class="kpi-val">' + (roleCounts['PPC'] || 0) + '</div></div>' +
      '</div>' +
      '<table class="roster"><thead><tr>' +
      '<th>#</th><th>Member Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Department</th><th>Time</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
      '</body></html>';

    var safeLoc = location.replace(/\s+/g, '-');
    var pdfBlob = Utilities.newBlob(html, 'text/html', 'CNA-' + safeLoc + '-' + dateKey + '.html')
      .getAs('application/pdf')
      .setName('CNA-' + safeLoc + '-Attendance-' + dateKey + '.pdf');

    MailApp.sendEmail({
      to: recipients.join(','),
      subject: 'CNA ' + location + ' Daily Attendance — ' + dateKey + ' (' + locationRecords.length + ' Members)',
      body: 'Attached is the California Nurses Association daily attendance PDF report for ' + location + ' on ' + dateKey + '.\n\n' +
        'Summary by Role:\n' +
        '- Union Rep: ' + (roleCounts['Union Rep'] || 0) + '\n' +
        '- Unit Rep: ' + (roleCounts['Unit Rep'] || 0) + '\n' +
        '- PPC: ' + (roleCounts['PPC'] || 0) + '\n\n' +
        'Total Checked In: ' + locationRecords.length,
      attachments: [pdfBlob]
    });

    sentLocations.push(location);
  });

  return { sentLocations: sentLocations, skippedAll: false };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
