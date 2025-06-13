const crypto = require('crypto')
const bcrypt = require('bcrypt')
const auth = require.main.require('./Utilities/Auth')
const db = require.main.require('./Utilities/Database').db

module.exports = {
    GetServerData: (data) => {
        if (data.serverData.environment != "dev")
            return
        return data.serverData
    },
    GetLastServerRestart: (data) => {
        if (data.serverData.environment != "dev")
            return
        return { restartHash: crypto.createHash('md5').update(data.serverData.initiateTime.toString()).digest('hex') }
    },
    CreateKnowledgeArticle: (data) => {
        if (!auth.authenticate(data.req).success)
            return
        data = Object.assign({}, data.req.body)
        if (data.title == '' || data.plainText == '')
            return "Title or plaintext cannot be empty."

        data['id'] = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
        data['date-created'] = new Date()

        db.prepare(`INSERT INTO articles (id, title, html, plainText, tags, created)` +
            ` VALUES (?, ?, ?, ?, ?, ?)`).run(
                data.id, data.title, data.html, data.plainText, data.tags ?? '',
                data['date-created'].toISOString()
            )

        return "success"
    },
    EditKnowledgeArticle: (data) => {
        if (!auth.authenticate(data.req).success)
            return
        data = Object.assign({}, data.req.body)
        if (!data.id)
            return "Article id missing."
        if (data.title == '' || data.plainText == '')
            return "Title or plaintext cannot be empty."

        db.prepare(`UPDATE articles SET title = ?, html = ?, plainText = ?, tags = ? WHERE id = ?`).run(
            data.title, data.html, data.plainText, data.tags ?? '', data.id
        )

        return "success"
    },
    Search: (data) => {
        if (!auth.authenticate(data.req).success)
            return
        data = Object.assign({}, data.req.body)
        var search = data.search.toLowerCase()
        var articles = db.prepare('SELECT * FROM articles ORDER BY created DESC').all()
        if (data.search == '')
            return articles

        var filtered = []
        search.split(" ").forEach(phrase => {
            articles.forEach(item => {
                var strength = 0

                if (item.title.toLowerCase().includes(phrase))
                    strength = strength + 1
                
                if (item.tags.toLowerCase().split(" ").includes(phrase))
                    strength = strength + 2

                if (item.plainText.toLowerCase().includes(phrase))
                    strength = strength + 1
                
                if (strength > 0) {
                    item['strength'] = strength
                    if (!filtered.find(filteredItem => filteredItem.id == item.id))
                        filtered.push(item)
                    else
                        filtered[filtered.findIndex(filteredItem => filteredItem.id == item.id)].strength = filtered[filtered.findIndex(filteredItem => filteredItem.id == item.id)].strength + strength
                }
            })
        })
        return filtered.sort(x => x.strength).slice(0, 25)
    },
    DeleteKnowledgeArticle: (data) => {
        if (!auth.authenticate(data.req).success)
            return
        data = Object.assign({}, data.req.body)
        db.prepare('DELETE FROM articles WHERE id = ?').run(data.id)
        return "success"
    },
    GetMostUsedTags: (data) => {
        if (!auth.authenticate(data.req).success)
            return
        var allTagStrings = []
        var rows = db.prepare('SELECT tags FROM articles').all()
        rows.forEach(article => {
            (article.tags || '').split(' ').forEach(tag => {
                if (tag)
                    allTagStrings.push(tag.toUpperCase())
            })
        })
        var allTagObjects = []
        allTagStrings.forEach(tag => {
            if (allTagObjects.findIndex(x => x.name == tag) == -1)
                allTagObjects.push({ name: tag, count: 1 })
            else
                allTagObjects[allTagObjects.findIndex(x => x.name == tag)].count++
        })
        return {
            totalTags: allTagObjects.length,
            tags: allTagObjects.sort(x => x.count).slice(0, 50)
        }
    },
    CreateUser: (data) => {
        if (!auth.authenticate(data.req).success)
            return { success: false, msg: 'authentication failed' }
        data = Object.assign({}, data.req.body)
        if (!data.username || !data.password)
            return { success: false, msg: 'username or password missing' }

        if (db.prepare('SELECT id FROM users WHERE username = ?').get(data.username))
            return { success: false, msg: 'user already exists' }

        const hashedPassword = bcrypt.hashSync(data.password, 10)
        const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
        db.prepare('INSERT INTO users (id, username, password, key) VALUES (?, ?, ?, ?)')
          .run(id, data.username, hashedPassword, '')
        console.log(`User "${data.username}" created.`)
        return { success: true, id: id }
    },
    AttemptLogin: (data) => {
        data = Object.assign({}, data.req.body)
        //check posted data exists
        if (typeof (data['username']) == 'undefined')
            return { success: false, msg: 'login unsuccessful: username was undefined' }
        if (typeof (data['password']) == 'undefined')
            return { success: false, msg: 'login unsuccessful: password was undefined' }
        const userCreds = db.prepare('SELECT * FROM users WHERE username = ?').get(data['username'])
        if (!userCreds)
            return { success: false, msg: 'login unsuccessful: wrong username or password' }
        if (!bcrypt.compareSync(data['password'], userCreds['password']))
            return { success: false, msg: 'login unsuccessful: wrong username or password' }

        var newKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })

        db.prepare('UPDATE users SET key = ? WHERE id = ?').run(newKey, userCreds.id)
        console.log(`User "${userCreds.username}" logged in successfully.`)
        return {
            success: true,
            id: userCreds.id,
            key: newKey
        }
    },
    Logout: (data) => {
        if (!auth.authenticate(data.req).success)
            return
        if (typeof data.req.headers.cookie == `undefined`)
          return { success: false, msg: "no cookie sent" }
        data = Object.fromEntries(data.req.headers.cookie.split(`; `).map(cookie => cookie.split("=")))
        if (!data.hasOwnProperty('auth'))
          return { success: false, msg: "no auth sent in cookie"}
        try {
          data = JSON.parse(Buffer.from(data.auth, 'base64'))
        } catch (e) {
          return {success: false, msg: "auth cookie malformed, could not be parsed"}
        }
        if (!data.hasOwnProperty('id') || !data.hasOwnProperty('key'))
          return { success: false, msg: "missing id or key" }
          
        if (!data.hasOwnProperty("key"))
            return "logout unsuccessful: key was undefined"
        if (!data.hasOwnProperty("id"))
            return "logout unsuccessful: id was undefined"
        const userData = db.prepare('SELECT * FROM users WHERE id = ?').get(data['id'])
        if (!userData || userData.key != data['key'])
            return "logout unsuccessful: wrong id or key"
        db.prepare('UPDATE users SET key = "" WHERE id = ?').run(data['id'])
        return "success"
    }
}