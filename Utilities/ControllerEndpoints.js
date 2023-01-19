const fs = require('fs')

class ControllerEndpoints {
    constructor(controllersLocation = "Controllers", defaultController = "Index", defaultEndpoint = "Index", controllerSuffix = "Controller") {
        this.controllers = []
        this.defaultController = defaultController
        this.defaultEndpoint = defaultEndpoint

        const __root = process.cwd()
        this.root = __root
        //at construction, inject the controller objects, using require, into the bootstrappedControllers array
        fs.readdir(`${__root}/${controllersLocation}`, (err, path) => {
            var controllerList = []
            if (err)
                console.log(`Error reading controllers location: "${controllersLocation}" - Check it exists in the root directory`)
            path.forEach(path => {
                if (fs.lstatSync(`${__root}/${controllersLocation}/${path}`).isDirectory()) {
                    if (fs.existsSync(`${__root}/${controllersLocation}/${path}/${path}${controllerSuffix}.js`)) {
                        controllerList[path] = require(`${__root}/${controllersLocation}/${path}/${path}${controllerSuffix}.js`)
                    } else {
                        console.log(`The Controller directory "${path}" exists, but does not include a js file - create a .js file in this directory with the name of the controller + "${controllerSuffix}.js"`)
                    }
                }
            })
            this.controllers = controllerList
            //this.print()
        })
    }

    print = () => console.log(this.getControllersWithEndpoints())

    getControllersWithEndpoints() {
        let controllers = []
        for (const controller in this.controllers) {
            let endpoints = []
            for (const endpoint in this.controllers[controller]) {
                endpoints.push(endpoint)
            }
            controllers[controller] = endpoints
        }
        return controllers
    }

    getControllerNames() {
        let controllers = []
        for (const controller in this.controllers) {
            controllers.push(controller)
        }
        return controllers
    }

    controllerExists(controller) {
        return this.getControllerNames().includes(controller)
    }

    endpointExists(controller, endpoint) {
        return !this.controllerExists(controller) ? null : this.getControllersWithEndpoints()[controller].includes(endpoint) ? true : null
    }

    async call(data) {
        var controller = data.controller || this.defaultController
        var endpoint = data.endpoint || controller || this.defaultController

        //add data for final endpoint
        data['controller'] = controller
        data['endpoint'] = endpoint
        data['root'] = this.root

        if (!this.controllerExists(controller))
            return null
        if (!this.endpointExists(controller, endpoint))
            return null

        return await this.controllers[controller][endpoint](data)
    }

}

module.exports = ControllerEndpoints