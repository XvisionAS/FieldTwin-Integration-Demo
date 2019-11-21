import axios from 'axios'
import { Request, Response  } from 'express'
import { Point } from '../interfaces'
import { getAuthToken } from './get-EXT-fields.controller'

interface FTWell {
  name: string,
  id: string
}

const BASE_URL = process.env.BASE_URL

const getWellPath = async (well: any): Promise<Point[]> => {
  const token = await getAuthToken()
  const response = await axios({
    method: 'get',
    // tslint:disable-next-line:max-line-length
    url: `${BASE_URL}/path/?query`,
    headers: { Authorization: `Bearer ${token}` }
  })
  const firstWellBore = response.data[0].UNIQUE_WELLBORE_IDENTIFIER

  const path = response.data.filter(
    (p: any) => p.UNIQUE_WELLBORE_IDENTIFIER === firstWellBore
    ).map((p: any) => {
    return {
      x: p.EASTING,
      y: p.NORTHING,
      z: p.TVD
    }
  })
  return path
}
const getWellDataForJSONAPI = async (body: any): Promise<any> => {
  const path = await getWellPath(body)
  const attributes = {
    name: body.UNIQUE_WELL_IDENTIFIER,
    path,
    radius: 1,
    radiusViewDependant: true,
    x: body.EASTING,
    y: body.NORTHING,
    visible: true,
    color: '#ff0000',
    labelVisible: true,
    labelOffsetX: 0,
    labelOffsetY: 0,
    labelRotation: 0,
    fromWaterLevel: false
  } as any
  const relationships = {
    subProject: {
      data: {
        type: 'subProjects',
        id: body.subProject
      }
    }
  } as any
  return {data: {attributes, relationships}}
}

const jsonapiPostWell =  async (req: Request, res: Response ) => {
  let data
  try {
    data  = await getWellDataForJSONAPI(req.body)
  } catch (e) {
    return res.status(500).json(e)
  }

  const options = {
    method: 'POST',
    headers: { Authorization: req.headers.authorization },
    url: `${process.env.BACKEND_URL}/jsonapi/wells`,
    data
  }
  try {
    const response = await axios(options)
    return res.status(200).json(response.data)
  } catch (e) {

     return res.status(e.status).send(e.message)
  }
}
const jsonapiPatchWell = async (req: Request, res: Response ) => {
  let data
  try {
    data  = await getWellDataForJSONAPI(req.body)
  } catch (e) {
    return res.status(500).json(e)
  }

  const options = {
    method: 'PATCH',
    headers: { Authorization: req.headers.authorization },
    url: `${process.env.BACKEND_URL}/jsonapi/wells/${req.body.FTid}`,
    data
  }
  try {
    const response = await axios(options)
    return res.status(200).json(response.data)
  } catch (e) {

     return res.status(e.status).send(e.message)
  }
}
const jsonapiDeleteWell = async (req: Request, res: Response ) => {
  const options = {
    method: 'DELETE',
    headers: { Authorization: req.headers.authorization },
    url: `${process.env.BACKEND_URL}/jsonapi/wells/${req.params.wellId}`
  }
  try {
    const response = await axios(options)
    return res.status(200).json(response.data)
  } catch (e) {
     return res.status(e.status).send(e.message)
  }
}

const jsonapiGetWells = async (req: Request, res: Response ) => {
  const options = {
    method: 'GET',
    headers: { Authorization: req.headers.authorization },
    url: `${process.env.BACKEND_URL}/jsonapi/wells/?filter[subProject]=${req.params.subProjectId}`,
  }
  try {
    const response = await axios(options)
    const data: FTWell[] = response.data.data.map(
      (d: any) => {
        return {
          id: d.id,
          name: d.attributes.name,
          x: d.attributes.x,
          y: d.attributes.y
        }
      }
    )
    return res.json(data)
  } catch (e) {
    console.error(`[eee] Error while getting wells for subProject ${req.params.subProjectId} :`, e.response || e)
    // tslint:disable-next-line:max-line-length
    return res.status((e.response  && e.response.status) || 500).send((e.response  && e.response.stack) || 'Unknown Error')
  }
}
export {
  jsonapiDeleteWell,
  jsonapiGetWells,
  jsonapiPatchWell,
  jsonapiPostWell
}
