/**
 * Bound Apps Script for Bangalore Hot List.
 * Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Project Settings → Script properties:
 *   WEBHOOK_SECRET = (same value as Vercel SHEETS_WEBHOOK_SECRET)
 */

var NOMINATIONS_SHEET = 'Nominations'
var RATE_LIMITS_SHEET = 'RateLimits'
var HOURLY_LIMIT = 3
var DAILY_LIMIT = 10
var VOTING_START = new Date('2026-09-05T05:00:00+05:30')
var VOTING_END = new Date('2026-09-06T17:00:00+05:30')
var NOMINATION_HEADERS = [
  'id',
  'created_at',
  'status',
  'nominee_name',
  'gender',
  'twitter_or_linkedin',
  'reason',
  'nominator_name',
  'votes',
]

function doGet() {
  return jsonResponse({ ok: true })
}

function doPost(e) {
  try {
    var body = JSON.parse((e.postData && e.postData.contents) || '{}')
    var secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET')
    if (!secret || body.secret !== secret) {
      return jsonResponse({ ok: false, error: 'Unauthorized' })
    }

    if (body.action === 'list') return listApproved()
    if (body.action === 'nominate') return nominate(body)
    if (body.action === 'vote') return vote(body)
    return jsonResponse({ ok: false, error: 'Unknown action' })
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) })
  }
}

function listApproved() {
  var rows = readNominations()
  var nominees = []
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].status === 'approved') nominees.push(rows[i])
  }
  nominees.sort(function (a, b) {
    return (Number(b.votes) || 0) - (Number(a.votes) || 0)
  })
  return jsonResponse({ ok: true, nominees: nominees })
}

function nominate(body) {
  var validated = validateNomination(body)
  if (validated.error) return jsonResponse({ ok: false, error: validated.error })

  var lock = LockService.getScriptLock()
  lock.waitLock(15000)
  try {
    if (body.ip_hash) {
      var limited = checkRateLimit(String(body.ip_hash))
      if (limited === 'hour') {
        return jsonResponse({
          ok: false,
          error: 'Too many nominations from your connection. Try again in an hour.',
        })
      }
      if (limited === 'day') {
        return jsonResponse({
          ok: false,
          error: 'Daily nomination limit reached. Try again tomorrow.',
        })
      }
    }

    var sheet = nominationsSheet()
    sheet.appendRow([
      Utilities.getUuid(),
      new Date().toISOString(),
      'pending',
      validated.nominee_name,
      validated.gender,
      validated.twitter_or_linkedin,
      validated.reason,
      validated.nominator_name,
      0,
    ])

    if (body.ip_hash) {
      rateLimitsSheet().appendRow([String(body.ip_hash), new Date().toISOString()])
    }

    return jsonResponse({ ok: true })
  } finally {
    lock.releaseLock()
  }
}

function vote(body) {
  var nomineeId = String(body.nominee_id || '').trim()
  if (!nomineeId) return jsonResponse({ ok: false, error: 'Nominee is required.' })

  var now = new Date()
  if (now < VOTING_START || now >= VOTING_END) {
    return jsonResponse({ ok: false, error: 'Voting is not open' })
  }

  var lock = LockService.getScriptLock()
  lock.waitLock(15000)
  try {
    var sheet = nominationsSheet()
    var values = sheet.getDataRange().getValues()
    if (values.length < 2) {
      return jsonResponse({ ok: false, error: 'Nominee not found or not approved' })
    }

    var index = headerIndex(values[0])
    for (var i = 1; i < values.length; i++) {
      var row = values[i]
      if (String(row[index.id]) !== nomineeId) continue
      if (String(row[index.status]) !== 'approved') {
        return jsonResponse({ ok: false, error: 'Nominee not found or not approved' })
      }
      var nextVotes = (Number(row[index.votes]) || 0) + 1
      sheet.getRange(i + 1, index.votes + 1).setValue(nextVotes)
      return jsonResponse({ ok: true })
    }

    return jsonResponse({ ok: false, error: 'Nominee not found or not approved' })
  } finally {
    lock.releaseLock()
  }
}

function validateNomination(body) {
  var nominee_name = String(body.nominee_name || '').trim()
  var nominator_name = String(body.nominator_name || '').trim()
  var reason = String(body.reason || '').trim()
  var social = String(body.twitter_or_linkedin || '').trim()
  var gender = String(body.gender || '').trim()

  if (!nominee_name || !nominator_name || !reason || !social || !gender) {
    return { error: 'All fields are required.' }
  }
  if (['man', 'woman', 'other'].indexOf(gender) === -1) {
    return { error: 'Invalid gender.' }
  }
  if (normalizeName(nominee_name) === normalizeName(nominator_name)) {
    return { error: 'You can’t nominate yourself — pick someone else.' }
  }
  var link = normalizeSocialLink(social)
  if (!isValidSocialLink(link)) {
    return { error: 'Add a valid Twitter or LinkedIn link.' }
  }

  return {
    nominee_name: nominee_name,
    nominator_name: nominator_name,
    reason: reason,
    gender: gender,
    twitter_or_linkedin: link,
  }
}

function checkRateLimit(ipHash) {
  var sheet = rateLimitsSheet()
  var values = sheet.getDataRange().getValues()
  var now = Date.now()
  var hourAgo = now - 60 * 60 * 1000
  var dayAgo = now - 24 * 60 * 60 * 1000
  var hourCount = 0
  var dayCount = 0

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) !== ipHash) continue
    var created = new Date(values[i][1]).getTime()
    if (created >= dayAgo) dayCount++
    if (created >= hourAgo) hourCount++
  }

  if (hourCount >= HOURLY_LIMIT) return 'hour'
  if (dayCount >= DAILY_LIMIT) return 'day'
  return null
}

function readNominations() {
  var values = nominationsSheet().getDataRange().getValues()
  if (values.length < 2) return []
  var index = headerIndex(values[0])
  var rows = []
  for (var i = 1; i < values.length; i++) {
    var row = values[i]
    var id = String(row[index.id] || '').trim()
    if (!id) continue
    rows.push({
      id: id,
      created_at: formatTimestamp(row[index.created_at]),
      status: String(row[index.status] || 'pending'),
      nominee_name: String(row[index.nominee_name] || ''),
      gender: String(row[index.gender] || ''),
      twitter_or_linkedin: String(row[index.twitter_or_linkedin] || ''),
      reason: String(row[index.reason] || ''),
      nominator_name: String(row[index.nominator_name] || ''),
      votes: Number(row[index.votes]) || 0,
    })
  }
  return rows
}

function nominationsSheet() {
  return getOrCreateSheet(NOMINATIONS_SHEET, NOMINATION_HEADERS)
}

function rateLimitsSheet() {
  return getOrCreateSheet(RATE_LIMITS_SHEET, ['ip_hash', 'created_at'])
}

var SPREADSHEET_ID = '1-TfDbPolBlj775zeQpuwe0QPrpJFRl7otstIQvt4yTc'

function workbook() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet()
    if (active) return active
  } catch (err) {
    // standalone / web app
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID)
}

function getOrCreateSheet(name, headers) {
  var ss = workbook()
  var sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
  }
  return sheet
}

function headerIndex(headerRow) {
  var index = {}
  for (var i = 0; i < NOMINATION_HEADERS.length; i++) {
    var key = NOMINATION_HEADERS[i]
    var found = headerRow.indexOf(key)
    index[key] = found === -1 ? i : found
  }
  return index
}

function normalizeName(value) {
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeSocialLink(raw) {
  var trimmed = String(raw).trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.indexOf('www.') === 0) return 'https://' + trimmed
  return 'https://' + trimmed
}

function isValidSocialLink(value) {
  try {
    var host = String(value).toLowerCase()
    return (
      host.indexOf('twitter.com') !== -1 ||
      host.indexOf('x.com') !== -1 ||
      host.indexOf('linkedin.com') !== -1 ||
      host.indexOf('t.co') !== -1
    )
  } catch (err) {
    return false
  }
}

function formatTimestamp(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString()
  }
  return String(value || '')
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
