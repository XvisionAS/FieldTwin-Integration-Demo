// @ts-nocheck
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const exphbs  = require('express-handlebars')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')

const PORT = 3000
const app = express()

// app.use(cors)
app.use(morgan('dev'))

const hbs = exphbs.create({ /* config */ })

const channels = {}
let clientId = 0

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')

app.disable('x-powered-by')

app.use( bodyParser.json() )       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}))

app.post('/tab', (request, response) => {
  var decodedToken = jwt.decode(request.body.token, {complete: true});
  console.log('decodedToken', decodedToken);
  const payload = {
    userEmail: decodedToken.payload.userEmail,
    project: request.body.project,
    subProject: request.body.subProject
  }
  console.log('Payload:', payload)
  response.render('index.hbs', {
    body: payload}
  )
})


app.get('/event/:projectId', (request, response) => {
  request.socket.setTimeout(Number.MAX_VALUE);
	response.writeHead(200, {
		'Content-Type': 'text/event-stream', // <- Important headers
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
  });
  if (!channels[request.params.projectId]) {
    channels[request.params.projectId] = {}
  }
  const clients = channels[request.params.projectId]
	response.write('\n');
	const attach = (clientId) => {
		clients[clientId] = response // <- Add this client to those we consider "attached"
		request.on("close", function () {
      delete clients[clientId]
		}); // <- Remove this client when he disconnects
  }
  attach(++clientId)
})

app.post('/event/:projectId', (request, response) => {
  clients = channels[request.params.projectId]
  for (id in clients) {
    clients[id].write(`event:new-event\n`)
    clients[id].write(`data:${JSON.stringify(request.body)}\n\n`)
  } 
  response.status(200).send()
})

app.use(express.static( path.join(__dirname, 'public')))


app.use((_req, res, _next) => {
  res.status(404).send('Sorry can\'t find that!')
})

setInterval(function () {
  for (key in channels) {
    const clients = channels[key]
    for (id in clients) {
      clients[id].write(":ping\n\n")
    }
	}
}, 60000)

app.listen(PORT, function () {
  console.log(`listening on port ${PORT}!`)
})