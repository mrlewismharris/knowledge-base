const db = require('./Utilities/Database')
db.init()
// ensure any existing article tags are stored in lowercase
require('./Utilities/NormalizeTags').normalize()

const app = require('./Utilities/ExpressControllerServer').ExpressControllerServer()
