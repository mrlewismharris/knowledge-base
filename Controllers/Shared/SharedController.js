module.exports = {
    404: () => {
        return `404: Requested resource not found on server.`
    },
    500: () => {
        return `500: Internal server error.`
    }
}