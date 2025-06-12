const auth = require.main.require('./Utilities/Auth')
const db = require.main.require('./Utilities/Database').db

module.exports = {
    Edit: async (data) => {
        if (!auth.authenticate(data.req).success)
            return await data.eta.renderFile('login.eta', {
                root: data.root,
                developer: data.serverData.environment == "dev",
                views: `${data.root}/Layouts/`
            })
        const id = data.req.query.id
        if(!id)
            return 'Article id missing'
        const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id)
        if(!article)
            return 'Article not found'
        return await data.eta.renderFile(`/Views/edit.eta`, {
            root: data.root,
            developer: data.serverData.environment == "dev",
            views: __dirname,
            article: article
        })
    }
}
