const Database = require('better-sqlite3')
const bcrypt = require('bcrypt')
const db = new Database('knowledge.db')

function init() {
  db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    key TEXT
  )`).run()

  db.prepare(`CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT,
    html TEXT,
    plainText TEXT,
    tags TEXT,
    created TEXT
  )`).run()

  const row = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (row.count === 0) {
    const hashed = bcrypt.hashSync('root', 10)
    db.prepare('INSERT INTO users (id, username, password, key) VALUES (?, ?, ?, ?)')
      .run('462dfdc7-645b-40f5-bfbd-502541a9927f', 'root', hashed, '')
    console.log('Database initialized with root user (password root)')
  }
}

module.exports = {
  db,
  init
}
