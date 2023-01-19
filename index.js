const fs = require('fs')

if (!fs.existsSync('login_info.json'))
{
    fs.writeFileSync('login_info.json', JSON.stringify([
        {
            "id": "462dfdc7-645b-40f5-bfbd-502541a9927f",
            "username": "root",
            "password": "root",
            "key": ""
        }
    ], null, 2))
    console.log("login_info.json not found - created with root user (password root)")
}

if (!fs.existsSync('kbase.json'))
{
    fs.writeFileSync('kbase.json', "[]")
    console.log("kbase.json db file not found - created json db")
}

const app = require('./Utilities/ExpressControllerServer').ExpressControllerServer()