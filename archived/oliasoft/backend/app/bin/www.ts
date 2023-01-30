#!/usr/bin/env node
'use strict'

/**
 * Module dependencies.
 */
import http from 'http'
import { app } from '../app'
/**
 * Get port from environment and store in Express.
 */

console.log(`[iii] ##########################################################`)
console.log(`[iii] PORT = ${process.env.PORT || '3000'}`)

const port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

/**
 * Create HTTP server.
 */

const server = http.createServer(app)
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: any) {
  const normalizeedPort = parseInt(val, 10)

  if (isNaN(normalizeedPort)) {
    // named pipe
    return val
  }

  if (normalizeedPort >= 0) {
    // port number
    return normalizeedPort
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address() || 'No Address'
  const bind = typeof addr === 'string' // @ts-ignore
    ? `pipe ${addr}`
    : `port ${addr.port}`
  console.log('Listening on ' + bind)
}

process.on('unhandledRejection', (up) => {throw up})
