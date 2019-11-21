// import cors from 'cors'
// import { RequestHandler } from 'express-serve-static-core'

import bodyParser from 'body-parser'
import express from 'express'
import exphbs from 'express-handlebars'
import morgan from 'morgan'
import path from 'path'
import { getEXTFields, getEXTWell, getEXTWells } from './controllers'
import { jsonapiDeleteWell, jsonapiGetWells, jsonapiPatchWell, jsonapiPostWell } from './controllers'

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

app.get('/fields', getEXTFields)

app.post('/', (req: any, res: any) => {
  res.render('index.hbs', {
    body: req.body}
    )
  })

app.use(express.static( path.join(__dirname, 'public')))

app.get('/:field/wells', getEXTWells)
app.get('/well/:wellid', getEXTWell)

app.post('/well', jsonapiPostWell)
app.patch('/well', jsonapiPatchWell)
app.delete('/well/:wellId', jsonapiDeleteWell)
app.get('/subProject/:subProjectId', jsonapiGetWells)

app.get('/', (_req: any, res: any, _next: any) => {
  res.status(200).send('found it').end()
})
app.use((_req: any, res: any, _next: any) => {
  res.status(404).send('Sorry can\'t find that!!')
})

export {
  app,
}
