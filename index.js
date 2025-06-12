const db = require('./Utilities/Database')
db.init()

const app = require('./Utilities/ExpressControllerServer').ExpressControllerServer()
