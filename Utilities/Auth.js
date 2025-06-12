const db = require('./Database').db

module.exports = {
  authenticate: (data = {}) => {
    if (typeof data.headers.cookie == `undefined`)
      return { success: false, msg: "no cookie sent" }
    data = Object.fromEntries(data.headers.cookie.split(`; `).map(cookie => cookie.split("=")))
    if (!data.hasOwnProperty('auth'))
      return { success: false, msg: "no auth sent in cookie"}
    try {
      data = JSON.parse(Buffer.from(data.auth, 'base64'))
    } catch (e) {
      return {success: false, msg: "auth cookie malformed, could not be parsed"}
    }
    if (!data.hasOwnProperty('id') || !data.hasOwnProperty('key'))
      return { success: false, msg: "missing id or key" }
    const row = db.prepare('SELECT key FROM users WHERE id = ?').get(data.id)
    if (!row)
      return { success: false, msg: "authentication failed" }
    if (row.key != data.key)
      return { success: false, msg: "authentication failed" }
    return { success: true }
  }
}