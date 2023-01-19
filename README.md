# controller-router
a custom controller router for node js + express applications, built around an intuitive and repeatable development process.

# intallation
0. required node.js + git
1. `git clone https://github.com/mrlewismharris/controller-router` clone the repo
2. `cd controller-router` change directory into controller-router
3. `npm i` install dependencies
4. `npm run dev` run the app in dev mode, controllers and their endpoints will be logged to the terminal
5. goto `http://localhost:3000` to see the live application

# config options
in the `index.js` file, call the `ExpressControllerServer` function with an object parameter:
```
const app = require('./Utilities/ExpressControllerServer').ExpressControllerServer({
  port: 3000, //port
  controllersLocation: "Controller", //controller directory
  staticFolder: "public", //public static files directory (e.g. js, css, images)
  indexController: "Index", //controller for server's landing page "/"
  indexEndpoint: indexController, //endpoint for server's landing page (copies indexController's name)
  controllerSuffix: "Controller" //suffix of controller js files (e.g. "TestController") - can be empty if you'd prefer
})
```
note: *above values are the property defaults, all directories are relative to root index.js file*

# development process
### adding controllers
controllers are used to handle server-side logic after the route has been requested by the user, but before the page is rendered. To add a controller simply make a folder inside of your controllers directory and add a javascript file with the same name as the controller name, and the controller suffix set in the config (by default "Controller") for example: "Index/IndexController.js" - the .js will be seen as a module by the module loader in ControllerEndpoints.js.

### adding endpoint
add an endpoint to a controller by simply adding a function to the controller's .js file, for example HelloWorldController.js file will contain:
```
module.export = {
  HelloWorld: () => {
    return "Hello World"
  }
}
```
when you restart the server (nodemon will autoreload) the endpoint will automatically be added to the server and return whatever is returned by the function, ejs is recommended as a templating engine but anything which can output as a string can be used within each of the endpoints - or you could create an api by outputting json, xml, csv data, etc.

### views
you can use whatever template engine you like but eta is recommended and shipped by default. make a "/Views" directory in your controllers (or name it whatever you want, or with sub-directories) and within the controller use `await data.eta.renderFile('Views/Index.eta', { views: __dirname })` to render the view - eta uses the config property "views" to specify the directory to look in for the views, the default directory (if you don't specify this view prop) is in the root "Layouts" directory.

if you'd like to access the app's root directory (where `index.js` is found) pass in `root: data.root` in the same object as the `views` prop, assuming you have `data` set as a controller arg, it should automatically be sent to the controller - then you can specify the layout file with `<% layout('/Layouts/_Layout.eta') %>`.

# aims
  - easy to understand controllers and endpoint, with repeatable workflow from zero to endpoint
  - authentication built into the express route and relevant data parsed to the controller

# todos
  - ~~remove server side fs call on every page load~~ ✔️
  - ~~simplify code and seperate concerns into server and controller/enpoint loading~~ ✔️
  - ~~add way to load the "Views" directory location inside and relative to the .js controller file~~ ✔️
    - Was complicated, but should be intuitive to end-users with a small explanation (this means add explanation to this readme file + docs)
  - ~~make nicer looking default webapp pages~~ ✔️
  - add way to load css/js pre/post on EACH view (i.e. similar to nunjucks loading "block" rather than entire file - possibly add razor style `@section Styles {  }` above the layout() function call and add as a variable in layout object + in layout page as object OR anything similar to `@RenderSection("Styles", false)`)
  - make nicer looking error pages (with debug information in dev mode)
  - ~~auto-reload in developer mode using ajax polling every 50-100ms~~ ✔️
  - ~~add eta template engine as default and add "Layouts" directory with some global layouts - update default code with new layouts~~ ✔️
  - ~~add method for parsing arguments from req to controllers (such as queries, body, etc.)~~ ✔️
  - before controller is loaded/initialised, bootstrap authentication if the user sends certain request
    - in the route request, before the endpoint.call() function, do this auth, then send it as object param
    - figure out way to decorate the endpoints in a controller in an intuitive way:
      - some form of marker on the controller or endpoint, all marked endpoints will evaluate a custom expression (based on the marker's name) BEFORE loading the endpoint, to determine whether the user has access to the endpoint, or to send a 403 response
  - modify module's structure: require() the module, initialise the new class (with config, or config added later with .addConfig({}) ), and run() (to allow for building future functionality)