module.exports = {
    Test: async (data) => {
        return await data.eta.renderFile(`Views/Test.eta`, {
            root: data.root,
            developer: data.serverData.environment == "dev",
            views: __dirname
        })
    },
    ApiCall: () => {
        return { message: `Server datetime is: ${new Date()}` }
    }
}