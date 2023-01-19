const crypto = require('crypto')
const fs = require('fs')

module.exports = {
    GetServerData: (data) => {
        if (data.serverData.environment != "dev")
            return
        return data.serverData
    },
    GetLastServerRestart: (data) => {
        if (data.serverData.environment != "dev")
            return "400"
        return { restartHash: crypto.createHash('md5').update(data.serverData.initiateTime.toString()).digest('hex') }
    },
    CreateKnowledgeArticle: (data) => {
        data = Object.assign({}, data.req.body)
        if (data.title == '' || data.plainText == '')
            return "Title or plaintext cannot be empty."
        
        if (!fs.existsSync('kbase.json')) {
            fs.writeFileSync('kbase.json', '[]')
            console.log("kbase.json didn't exist, created it...")
        }

        data['id'] = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
        data['date-created'] = new Date()

        fs.readFile('kbase.json', function(err, file) {
            var json = JSON.parse(file)
            json.push(data)
            fs.writeFileSync('kbase.json', JSON.stringify(json, null, 2))
        })
        
        return "success"
    },
    Search: (data) => {
        data = Object.assign({}, data.req.body)
        var search = data.search.toLowerCase()
        var db = JSON.parse(fs.readFileSync('kbase.json')).reverse()
        if (data.search == '')
            return db

        var filtered = []
        search.split(" ").forEach(phrase => {
            db.forEach(item => {
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
        data = Object.assign({}, data.req.body)
        fs.readFile('kbase.json', function(err, file) {
            fs.writeFileSync('kbase.json', JSON.stringify(JSON.parse(file).filter(x => x.id != data.id), null, 2))
        })
        return "success"
    },
    GetMostUsedTags: (data) => {
        var tags = []
        var db = fs.readFileSync('kbase.json')
        json = JSON.parse(db)
        json.forEach(article => {
            article.tags.split(" ").forEach(tag => {
                if (tag.trim() != "")
                    tags.push({
                        name: tag,
                        count: 1
                    })
            })
        })
        return {
            totalTags: tags.length,
            tags: tags.sort(x => x.count).slice(0, 50)
        }
    },
    AttemptLogin: (data) => {
        data = Object.assign({}, data.req.body)
        //check posted data exists
        if (typeof (data['username']) == 'undefined')
            return { success: false, msg: 'login unsuccessful: username was undefined' }
        if (typeof (data['password']) == 'undefined')
            return { success: false, msg: 'login unsuccessful: password was undefined' }
        //get file
        var creds = JSON.parse(fs.readFileSync('login_info.json'))
        //validate user exists
        if (creds.findIndex(user => user['username'] == data['username']) == -1)
            return { success: false, msg: 'login unsuccessful: wrong username or password' }
        var userCreds = creds.find(x => x.username == data['username'])
        //auth
        if (data['username'] != userCreds['username'] || data['password'] != userCreds['password'])
            return { success: false, msg: 'login unsuccessful: wrong username or password' }
        
        var newKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })

        userCreds['key'] = newKey
        creds.splice(creds.findIndex(x => x.username == data['username']), 1)
        creds.push(userCreds)
        fs.writeFileSync('login_info.json', JSON.stringify(creds, null, 2))
        console.log(`User "${userCreds.username}" logged in successfully.`)
        return {
            success: true,
            id: userCreds.id,
            key: newKey
        }
    },
    Logout: (data) => {
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
        var creds = JSON.parse(fs.readFileSync('login_info.json'))
        if (creds.findIndex(user => user['id'] == data['id']) == -1)
            return "logout unsuccessful: wrong id or key"
        var userData = creds.find(user => user['id'] == data['id'])
        if (userData['key'] != data['key'])
            return "logout unsuccessful: wrong id or key"
        userData['key'] = ''
        creds.splice(creds.indexOf(x => x.id == data['id']), 1)
        creds.push(userData)
        fs.writeFileSync('login_info.json', JSON.stringify(creds, null, 2))
        return "success"
    }
}