const JSONAPIClient        = require('@holidayextras/jsonapi-client')
const security             = require('routes/security')
const utils                = require('lib/utils')
const JSONAPI_SERVER_URL   = `${process.env.JSONAPI_URL}/jsonapi`

const CACHED_CLIENT = []
module.exports.directGetForBackend = async function(disableCaching = false, fastSearch = false) {
  let index = 0
  if (disableCaching) {
    index++
  }
  if (fastSearch) {
    index++
  }
  let cashedClient = CACHED_CLIENT[index]
  if (!cashedClient) {
    const options = { disableCaching }
    const header  = {
      fastSearch
    }
    header.token = process.env.JSONAPI_SECRET
    const token = await security.generateTokens({
        backendAccess:true,
    }, 3600000)
    header.authorization = `Bearer ${token}`
    cashedClient = CACHED_CLIENT[index] = new JSONAPIClient(JSONAPI_SERVER_URL, {
      header
    }, options)
  }
  return cashedClient
}

module.exports.getForBackend = function(req, res, next) {
  module.exports.directGetForBackend().then(
    (JSONAPI) => {
      if (JSONAPI) {
        req.JSONAPI = JSONAPI
        next()
      } else {
        console.log('getForBackend::directGetForBackend returned a null jsonapi client')
        res.status(500).end()
      }
    }
  ).catch(
    err => {
      console.log('getForBackend error', err)
      res.status(500).end(err)
    }
  )
}


module.exports.getWithoutIncludes = function(req, res, next) {
  const header = {}

  if (req && req.header) {
    if (req.headers.authorization) {
      header.authorization = req.headers.authorization
    }
    if (req.headers.token) {
      header.token = req.headers.token
    }
  }

  const JSONAPI = new JSONAPIClient(JSONAPI_SERVER_URL,
    { header },
    { disableCaching:true })
  if (JSONAPI) {
    req.JSONAPI = JSONAPI
    next()
  } else {
    res.status(500).end()
  }
}

module.exports.get = function(req, res, next) {
  const header = {}

  if (req && req.header) {
    if (req.headers.authorization) {
      header.authorization = req.headers.authorization
    }
    if (req.headers.token) {
      header.token = req.headers.token
    }
  }

  const JSONAPI = new JSONAPIClient(JSONAPI_SERVER_URL,
    { header },
    { disableCaching:false })
  if (JSONAPI) {
    req.JSONAPI = JSONAPI
    next()
  } else {
    res.status(500).end()
  }
}

module.exports.catch = function(error, res) {
  if (error.message === '401 Unauthorized') {
    return res.status(401).json({ error:error.message }).end()
  }
  if (process.env.DEVELOPER_MODE) {
    return res.status(error.status || 500).json({ error, message:error.message, stack:error.stack  }).end()
  }
  return res.status(error.status || 500).json({ error  }).end()
}

module.exports.asyncMiddleware = fn => utils.asyncMiddleware(
  fn,
  (e, req, res) => {
    console.log(e)
    module.exports.catch(e, res)
  }
)
