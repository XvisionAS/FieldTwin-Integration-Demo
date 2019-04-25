
import axios from 'axios'

import { Router } from 'express'
import { RequestHandler } from 'express-serve-static-core'

const getJsonapiData: Router = Router()

const getJsonapiDataFor = (model: string): RequestHandler => {
  return (req: any, res: any, _next: any) => {
    axios({
      method: 'get',
      url: `${req.headers.backendurl}/jsonapi/${model}/${req.params.objectId}`,
      headers: {Authorization: req.headers.authorization}
    }).then(
      (r) => {
        res.send(r.data)
      }
    ).catch(
      (e) => {
        console.log(`[eee] while get ${model} with id ${req.params.objectId}`, e)
        return res.status(e.response.status).send(e.response.data)
      }
    )
  }
}

getJsonapiData.get('/wells/:objectId', getJsonapiDataFor('wells'))
getJsonapiData.get('/stagedAssets/:objectId', getJsonapiDataFor('stagedAssets'))

export {
  getJsonapiData,
}
