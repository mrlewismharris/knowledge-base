const auth = require.main.require('./Utilities/Auth')

module.exports = {
    Add: async (data) => {
        if (!auth.authenticate(data.req).success)
            return await data.eta.renderFile('login.eta', {
                root: data.root,
                developer: data.serverData.environment == "dev",
                views: `${data.root}/Layouts/`
            })
        return await data.eta.renderFile(`/Views/add.eta`, {
            root: data.root,
            developer: data.serverData.environment == "dev",
            views: __dirname
        })
    }
}