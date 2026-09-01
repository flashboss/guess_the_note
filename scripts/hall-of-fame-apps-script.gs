/**
 * Guess the Note — Hall of Fame API (Google Apps Script)
 *
 * Setup:
 * 1. Create a new Apps Script project at https://script.google.com
 * 2. Paste this file, save
 * 3. (Optional) Project settings → Script properties → SUBMIT_TOKEN = a secret string
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL into js/constants.js → HALL_OF_FAME_API_URL
 *
 * The JSON file stays private in your Drive. Only this script can read/write it.
 */

const FILE_NAME = "guess-the-note-hall-of-fame.json";
const MAX_RECORDS = 50;
const MAX_NAME_LENGTH = 24;

function getSubmitToken_() {
  return PropertiesService.getScriptProperties().getProperty("SUBMIT_TOKEN") || "";
}

function jsonResponse_(payload, e) {
  const json = JSON.stringify(payload);
  const callback = e && e.parameter && e.parameter.callback;
  if (callback && /^[a-zA-Z_$][\w.$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ")").setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFile_() {
  const files = DriveApp.getFilesByName(FILE_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  return DriveApp.createFile(FILE_NAME, JSON.stringify({ records: [] }), MimeType.PLAIN_TEXT);
}

function readData_() {
  const text = getOrCreateFile_().getBlob().getDataAsString("UTF-8") || '{"records":[]}';
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data.records)) {
      data.records = [];
    }
    return data;
  } catch (error) {
    return { records: [] };
  }
}

function writeData_(data) {
  getOrCreateFile_().setContent(JSON.stringify(data));
}

function highScore_(records) {
  if (!records.length) {
    return 0;
  }
  return records.reduce((max, row) => Math.max(max, Number(row.score) || 0), 0);
}

function normalizeName_(name) {
  return String(name || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

function sortedRecords_(records) {
  return records
    .slice()
    .sort((a, b) => Number(b.score) - Number(a.score) || String(b.at).localeCompare(String(a.at)))
    .slice(0, MAX_RECORDS);
}

function submitRecord_(params) {
  const expectedToken = getSubmitToken_();
  if (expectedToken && params.token !== expectedToken) {
    return { ok: false, error: "forbidden" };
  }

  const name = normalizeName_(params.name);
  const score = Math.round(Number(params.score));
  const grade = Math.round(Number(params.grade));

  if (!name) {
    return { ok: false, error: "invalid_name" };
  }
  if (!Number.isFinite(score) || score < 0 || score > 999999999) {
    return { ok: false, error: "invalid_score" };
  }
  if (!Number.isFinite(grade) || grade < 0 || grade > 10) {
    return { ok: false, error: "invalid_grade" };
  }

  const data = readData_();
  const previousHigh = highScore_(data.records);
  const entry = {
    name: name,
    score: score,
    grade: grade,
    at: new Date().toISOString(),
  };

  data.records.push(entry);
  data.records = sortedRecords_(data.records);
  writeData_(data);

  return {
    ok: true,
    added: true,
    isNewHigh: score > previousHigh,
    highScore: highScore_(data.records),
    records: data.records,
  };
}

function doGet(e) {
  const action = String(e.parameter.action || "list").toLowerCase();

  if (action === "list") {
    const data = readData_();
    const records = sortedRecords_(data.records);
    return jsonResponse_(
      {
        ok: true,
        highScore: highScore_(records),
        records: records,
      },
      e
    );
  }

  if (action === "submit") {
    return jsonResponse_(submitRecord_(e.parameter), e);
  }

  return jsonResponse_({ ok: false, error: "unknown_action" }, e);
}
