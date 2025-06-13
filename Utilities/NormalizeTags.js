const db = require('./Database').db

function normalize() {
  const articles = db.prepare('SELECT id, tags FROM articles').all()
  const stmt = db.prepare('UPDATE articles SET tags = ? WHERE id = ?')
  articles.forEach(article => {
    if (!article.tags) return
    const lower = article.tags
      .split(' ') // split tags by space
      .map(t => t.toLowerCase())
      .join(' ')
    if (lower !== article.tags) {
      stmt.run(lower, article.id)
    }
  })
}

if (require.main === module) {
  normalize()
  console.log('Tags normalized to lowercase')
}

module.exports = { normalize }
