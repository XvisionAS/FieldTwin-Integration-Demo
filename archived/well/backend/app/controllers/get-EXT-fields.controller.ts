
import axios from 'axios'
import queryString from 'query-string'
// import { Router } from 'express'

// import { RequestHandler } from 'express-serve-static-core'

// AUTHENTICATION
let authToken: string

const BASE_URL = process.env.BASE_URL
const AUTH_URL = `${process.env.BASE_AUTH_URL}/${process.env.AUTH_PATH}`
const AUTH_PARAMS = {
  grant_type: 'client_credentials',
  client_id: process.env.AUTH_CLIENT_ID,
  client_secret: process.env.AUTH_CLIENT_SECRET,
  resource: process.env.AUTH_RESOURCE
}
const AUTH_QUERY = queryString.stringify(AUTH_PARAMS)

const isExpired = (token: string): boolean => {
  return true || token
}

const getNewToken = async (): Promise<string> => {
  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: AUTH_QUERY,
    url: AUTH_URL,
  }
  try {
    const response = await axios(options)
    return response.data.access_token
  } catch (e) {
    console.error('[eee] Error while getting Authorization token: ', e)
    return e
  }
}
const getAuthToken = async (): Promise<string> => {
  if (!authToken || isExpired(authToken)) {
    authToken = await getNewToken()
  }

  return authToken
}

const getEXTFields = async (_req: any, res: any, _next: any) => {
  const token = await getAuthToken()
  try {
    const response = await axios({
      method: 'get',
      url: `${BASE_URL}/path?query`,
      headers: { Authorization: `Bearer ${token}` }
    })
    res.send(response.data.map((f: {IDENTIFIER: string}) => f.IDENTIFIER))
  } catch (e) {
    console.error(`[eee] while getting list of Field`, e)
    return res.status(e.response.status).send(e.response.data)
  }
}

const getEXTWells = async (req: any, res: any, _next: any) => {
  const token = await getAuthToken()
  try {
    const response = await axios({
      method: 'get',
      // tslint:disable-next-line:max-line-length
      url: `${BASE_URL}/path?query`,
      headers: { Authorization: `Bearer ${token}` }
    })
    res.send(response.data)
  } catch (e) {
    console.error(`[eee] while getting list of wells`, e)
    return res.status(e.response.status).send(e.response.data)
  }
}
const getEXTWell = async (_req: any, res: any, _next: any) => {
  return res.send(501)
}

/*
getEXT.get('/:field/wells', (_req: any, res: any, _next: any) => {
  return res.status(501).end()
}) */

/* getEXT.get('/well/:well/path', (_req: any, res: any, _next: any) => {
  return res.status(501).end()
}) */

export {
  getEXTFields,
  getEXTWells,
  getEXTWell,
  getAuthToken
}
