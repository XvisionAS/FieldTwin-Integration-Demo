// server.js
// where your node app starts

// init project
const exphbs  = require("express-handlebars")
const express = require("express")
const request = require("request")
const rp = require("request-promise")
const bodyParser = require("body-parser")
const app = express()
const cors = require("cors")


app.use(cors())

var hbs = exphbs.create({ /* config */ })

app.engine("handlebars", hbs.engine)
app.set("view engine", "handlebars")

app.use(bodyParser.urlencoded(
  {
    extended: true
  }
))
app.use(bodyParser.json())


app.use(express.static('public'))


app.get('/API/v1/:projectId/subProject/:subProjectId/:type/:id', function(request, response) {

  const backendServer = request.headers.backEndServer || "http://qa.backend.fieldap.com"
  const options = {}
  options.headers = {}
	options.headers.authorization = request.headers.authorization
	options.uri = `${backendServer}${request.path}`
  rp(options)
    .then(
    (r) => {
      console.log("r", r)
      response.send(r).end()
    }
   ).catch(
    e => {
      response.status(e.status || 500).send(e).end()
   console.log("e",e)
    }
  )
})

app.post("/", function (request, response) {
  const string = JSON.stringify(request.body)
  response.render("index.hbs", {
    body: request.body}
  ) 
})

// listen for requests :)
var listener = app.listen(process.env.PORT || 3001, function () {
  console.log('Your app is listening on port ' + listener.address().port)
});

