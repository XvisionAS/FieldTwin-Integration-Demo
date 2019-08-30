const logger       = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser   = require('body-parser')
const cors         = require('cors')
const express      = require('express')
const compression  = require('compression')

const costServer = require('./cost-server')
const http       = require('http')

const app = express()

const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }

  // fallback to standard filter function
  return compression.filter(req, res)
}

app.use(
  compression({
    filter: shouldCompress
  })
)

app.disable('x-powered-by')

app.use(logger('dev'))
app.use(bodyParser.json({ limit: '150mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

const corsMiddleWare = cors({ origin: true, credentials: true })
app.use(corsMiddleWare)

app.use(cookieParser())


app.use('/cost-server', costServer)


const port = parseInt(process.env.PORT || '3000')

app.set('port', port);


const server = http.createServer(app);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
