const fs = require('fs')

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
    var creds = JSON.parse(fs.readFileSync('login_info.json'))
    if (creds.findIndex(x => x.id == data.id) == -1)
      return { success: false, msg: "authentication failed" }
    var foundUser = creds.find(x => x.id == data.id)
    if (foundUser.key != data.key)
      return { success: false, msg: "authentication failed" }
    return { success: true }
  }
}