const express = require("express")
const request = require("request")
const rp = require("request-promise")
const {argv} = require("yargs")
const cors = require("cors")
const bodyParser = require("body-parser")
const exphbs  = require("express-handlebars")
const https = require('https')

const app = express()
const port = argv.port || 80

const credentials = {
  key: `-----BEGIN RSA PRIVATE KEY-----
// CREATE PRIVATE KEY
-----END RSA PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
//CREATE CERTIFICATE
-----END CERTIFICATE-----`}
const httpsServer = https.createServer(credentials, app)

const metaDataVendorId = ["b6", "b7", "b8", "b9", "b10", "b11", "b12" ]

const STEPS_NUMBER= 100

const getMetaDataValues = (metaData) => {
	const data = {}
	metaDataVendorId.forEach(
		(id) => {
			const metaDatum = metaData.find(
				(data) => data.vendorId == id
			)
			data[id] = metaDatum.value
		}
	)
	return data
}
app.use(cors())

var hbs = exphbs.create({ /* config */ })

app.engine("handlebars", hbs.engine)
app.set("view engine", "handlebars")

app.use(bodyParser.urlencoded({
	extended: true

}))
app.use(bodyParser.json())

app.get("/API/v1/:projectId/subProject/:subProjectId/connection/:connectionId",
	(request, response) => {
		let data
		let res = {}



		const backendServer = request.headers.backendurl || "http://qa.backend.fieldtwin.com"
		
		const options = {}
		options.headers = {}
		options.headers.authorization = request.headers.authorization
		options.uri = `${backendServer}${request.path}`
		console.log(options)

		return rp(options).then(
			(body) => {
				body = JSON.parse(body)
				data = getMetaDataValues(body.metaData)
				data.length = body.length
				data.name = body.params.label || "No Name"
				return data
			}
		).then(
			() => {
				res.points = []
				const formula = (l) => (((data.b6)-(data.b7))/Math.pow(Math.E, ((l/1000) *(data.b10)*(data.b11)*Math.PI )/((data.b8)*(data.b9)))+(data.b7))
				const step = data.length / STEPS_NUMBER
				for (let l = 0 ; l <= STEPS_NUMBER; l += 1) {
					const y = formula(l * step)
					const x = l * step
					res.points.push({x,y})
				}
				res.title = `Jdi Heat loss Demo Simulation for ${data.name}, Length: ${data.length.toFixed(2)}`
				res.xAxisLabel ="Length"
				res.yAxisLabel ="Temperature"
			}
		).then(
			() => {
				response.json(res)
			}
		).then(
			() => console.log(`\nserver is listening on ${port}`)
		).catch(
			(e) => {
				console.log(`[eee] Error: ${e.message}`)
				response.status(e.statusCode || 500).json(e.error || {"error": "Unknown error"})
			}
		)
	}
)
app.post("/", function (request, response) {
	response.render("index.hbs", {
		body: request.body}
	)
})
app.listen()
/* httpsServer.listen(port, (err) => {
	if (err) {
		return console.log("something bad happened", err)
	}

	console.log(`server is listening on ${port}`)
}) */