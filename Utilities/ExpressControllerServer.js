const express = require('express')
const bodyParser = require('body-parser')
const ControllerEndpoints = require('./ControllerEndpoints')
const eta = require('eta')

module.exports = {
    ExpressControllerServer: (config = {}) => {
        //runtime environment: development or production (use arg -env production/development)
        const __environment = process.argv.includes("-env") ? process.argv[process.argv.indexOf("-env")+1] : "prod"
        //set port, controllersLocation, staticFolder, default/index controller name, and controller suffix from config or use defaults
        const port = config.port ?? 3000
        const controllersLocation = config.controllersLocation ?? "Controllers"
        const staticFolder = config.public ?? "public"
        const indexController = config.indexController ?? "Index"
        const indexEndpoint = config.indexEndpoint ?? indexController
        const controllerSuffix = config.controllerSuffix ?? "Controller"
        const layoutDirectories = config.layouts ?? []

        var endpoints = new ControllerEndpoints(controllersLocation, indexController, indexEndpoint, controllerSuffix)

        //create app + define static folder based on config
        const app = express()
        app.use(bodyParser.urlencoded({ extended: false }))
        app.use(bodyParser.json())

        //might have to come back to this...
        /*eta.configure({
            views: [ "Layouts" ].concat(layoutDirectories)
        })*/

        const server = {
            environment: __environment,
            initiateTime: new Date()
        }

        app.use(`/${staticFolder}`, express.static(`${staticFolder}`))

        //return a controller based on controller folder + endpoint
        app.use('/:controller/:endpoint', async (req, res) => {
            return res.send(await endpoints.call({
                controller: req.params.controller,
                endpoint: req.params.endpoint,
                serverData: server,
                eta: eta,
                req: req
            }) ?? await endpoints.call({
                controller: "Shared",
                endpoint: "404"
            }))
        })

        app.use('/:controller', async (req, res) => {
            return res.send(await endpoints.call({
                controller: req.params.controller,
                serverData: server,
                eta: eta,
                req: req
            }) ??await  endpoints.call({
                controller: "Shared",
                endpoint: "404"
            }))
        })

        //set the default index page
        app.use('/', async (req, res) => {
            return res.send(await endpoints.call({
                serverData: server,
                eta: eta,
                req: req
            }) ?? await endpoints.call({
                controller: "Shared",
                endpoint: "404"
            }))
        })
        
        app.listen(port, () => {
            console.log(`Server started on port ${port} in ${__environment} mode`)
        })

    }
}