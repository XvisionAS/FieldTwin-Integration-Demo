// import cors from 'cors'

import bodyParser from 'body-parser'
import express from 'express'
import exphbs from 'express-handlebars'
import morgan from 'morgan'
import path from 'path'
import { getJsonapiData, getSqlData } from './controllers'

const app: express.Application = express()
// app.use(cors)
app.use(morgan('dev'))
const hbs = exphbs.create({ /* config */ })

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

app.post('/', (request, response) => {
  response.render('index.hbs', {
    body: request.body}
  )
})

app.use(express.static( path.join(__dirname, 'public')))

app.use('/API', getSqlData)
app.use('/jsonapi', getJsonapiData)

app.use((_req, res, _next) => {
  res.status(404).send('Sorry can\'t find that!')
})

export {
  app,
}
