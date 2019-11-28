// import cors from 'cors'
// import { RequestHandler } from 'express-serve-static-core'

import bodyParser from 'body-parser'
import express from 'express'
import exphbs from 'express-handlebars'

import axios from 'axios'
import morgan from 'morgan'
import path from 'path'

const app: express.Application = express()
// app.use(cors)
app.use(morgan('dev'))
const hbs = exphbs.create({ /* config */ })

app.engine('handlebars', hbs.engine as any)
app.set('view engine', 'handlebars')
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(express.static( path.join(__dirname, 'public')))

// tslint:disable-next-line:max-line-length
app.post('/', (req: any, res: any) => {
  res.render('index.hbs', {
    body: req.body}
    )
  })

app.patch('/API/v1.5/:projectId/subProject/:subProjectId/well/:wellId',
  async (req, res) => {
    let response
    console.log(req.body)
    try {
      response = await axios({
        method: 'post',
        // tslint:disable-next-line:max-line-length
        url: `https://app.oliasoft.com/api/traj_gen`,
        // tslint:disable-next-line:max-line-length
        headers: { authorization: `Bearer ${process.env.OLIASOFT_TOKEN}`
        },
        data : {
          method: 'optalign_dls1_dls2',
          param1: 3,
          param2: 3,
          resolution: 30,
          src_azi: 0,
          src_ew: req.body.first.x || 0,
          src_inc: 0,
          src_md: 0,
          src_ns: req.body.first.y || 0,
          src_tvd: Math.abs(req.body.first.z) || 0,
          tgt_azi: 60,
          tgt_ew: req.body.last.x || 2000,
          tgt_inc: 30,
          tgt_ns: req.body.last.y || 1000,
          tgt_tvd: Math.abs(req.body.last.z) || 2000
        },
      })
    } catch (e) {
      console.error(3, e)
      return res.status(e.response.status || 500).json(e.response.data)
    }
    console.log(response.data)
    const wellPath: any[] = []
    response.data.pts.forEach(
        (p: any) => {
          const point = {} as any
          point.z = p[3] + req.body.first.z
          point.x = p[4] + req.body.first.x
          point.y = p[5] + req.body.first.y
          wellPath.push(point)
        }
      )
    try {
      await axios({
        method: 'patch',
        // tslint:disable-next-line:max-line-length
        url: `https://${process.env.LEGACY_HOST}/API/v1.5/${req.params.projectId}/subProject/${req.params.subProjectId}/well/${req.params.wellId}`,
        headers: { authorization: req.headers.authorization },
        data : {
          path: wellPath
        }
      })
      return res.send(200).send('Ok')
    } catch (e) {
      console.error(2, e)
      return res.status(e.status || 500).send(e.data)
    }
  }
)
app.get('/API/v1.5/:projectId/subProject/:subProjectId/well/:wellId',
  async (req, res) => {
    try {

      const  data = await axios({
        method: 'get',
        // tslint:disable-next-line:max-line-length
        url: `https://${process.env.LEGACY_HOST}/API/v1.5/${req.params.projectId}/subProject/${req.params.subProjectId}/well/${req.params.wellId}`,
        headers: { authorization: req.headers.authorization }
      })
      return res.json(data.data)
    } catch (e) {
      console.error(4, e)
      return res.status(e.status || 500).send(e.data)

    }
  }
)

app.get('/', (_req: any, res: any, _next: any) => {
  res.status(200).send('found it').end()
})
app.use((_req: any, res: any, _next: any) => {
  res.status(404).send('Sorry can\'t find that!!')
})

export {
  app,
}
