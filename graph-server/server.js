const express = require('express')
const bodyParser = require("body-parser");
const {argv} = require("yargs")
var cors = require('cors')

const logIncomingConnection = (request) => {
	console.log(`\n######################################`)
	console.log(`Incoming connection from ${request.ip}`)
	console.log(`account: ${request.body.project}`)
	console.log(`project: ${request.body.project}`)
	console.log(`subProject: ${request.body.subProject}`)
	console.log(`connection id: ${request.body.connection}`)
	console.log(`stagedAsset id: ${request.body.stagedAsset}`)
	console.log(`token ${request.headers.token}`)
}

const app = express()
const port = argv.port || 3001
const options = {
	method: "GET",
	headers: {
	},
	json: true
}
const metaDataVendorId = ["b6", "b7", "b8", "b9", "b10", "b11", "b12" ]

const STEPS_NUMBER= 100
const DELAY = 450


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max))
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
let max = 9

app.post('/',
	(request, response) => {
        logIncomingConnection(request)
        const res = []
        res.push(
            {
                type: "bar",
                data: {
                    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                    datasets: [{
                        label: 'Dataset 1',
                        backgroundColor: "red",
                        borderColor: "red",
                        borderWidth: 1,
                        data: [
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max)
                        ]
                    }, {
                        label: 'Dataset 2',
                        backgroundColor: "blue",
                        borderColor: "blue",
                        borderWidth: 1,
                        data: [
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max)
                        ]
                    }],
                    options: {
                        responsive: true,
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Chart.js Bar Chart'
                        }
                    }
        
                }
            }
        )    
        res.push(
            {
                type: "line",
                data: {
                    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                    datasets: [{
                        label: 'Dataset 1',
                        backgroundColor: "red",
                        borderColor: "red",
                        borderWidth: 1,
                        data: [
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max)
                        ]
                    }, {
                        label: 'Dataset 2',
                        backgroundColor: "blue",
                        borderColor: "blue",
                        borderWidth: 1,
                        data: [
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max)
                        ]
                    }],
                    options: {
                        responsive: true,
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Chart.js Bar Chart'
                        }
                    }
        
                }
            }
        )   
        res.push(
            {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                        ],
                        backgroundColor: [
                            "red",
                            "orange",
                            "yellow",
                            "green",
                            "blue",
                        ],
                        label: 'Dataset 1'
                    }],
                    labels: [
                        'Red',
                        'Orange',
                        'Yellow',
                        'Green',
                        'Blue'
                    ]
                },
                options: {
                    responsive: true,
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Chart.js Doughnut Chart'
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }

            }
        ) 
        res.push({
            type: 'radar',
			data: {
				labels: [['Eating', 'Dinner'], ['Drinking', 'Water'], 'Sleeping', ['Designing', 'Graphics'], 'Coding', 'Cycling', 'Running'],
				datasets: [{
					label: 'My First dataset',
					backgroundColor: "green",
					borderColor:"green",
					pointBackgroundColor: "green",
					data: [
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max)
					]
				}, {
					label: 'My Second dataset',
					backgroundColor: "red",
					borderColor: "red",
					pointBackgroundColor: "red",
					data: [
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max),
						getRandomInt(max)
					]
				}]
			},
			options: {
				legend: {
					position: 'top',
				},
				title: {
					display: true,
					text: 'Chart.js Radar Chart'
				},
				scale: {
					ticks: {
						beginAtZero: true
					}
				}
            }
        })
        res.push({
                type:"polarArea",
                data: {
                    datasets: [{
                        data: [
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                            getRandomInt(max),
                        ],
                        backgroundColor: [
                            "red",
                            "orange",
                            "yellow",
                            "green",
                            "blue",
                        ],
                        label: 'My dataset' // for legend
                    }],
                    labels: [
                        'Red',
                        'Orange',
                        'Yellow',
                        'Green',
                        'Blue'
                    ]
                },
                options: {
                    responsive: true,
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Chart.js Polar Area Chart'
                    },
                    scale: {
                        ticks: {
                            beginAtZero: true
                        },
                        reverse: false
                    },
                    animation: {
                        animateRotate: false,
                        animateScale: true
                    }
                }
			
        })
        max = 1
        max = 13
        res.push({
            type: "bar",
            data :{
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets: [{
                    type: 'line',
                    label: 'Dataset 1',
                    borderColor: "blue",
                    borderWidth: 2,
                    fill: false,
                    data: [
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max)
                    ]
                }, {
                    type: 'bar',
                    label: 'Dataset 2',
                    backgroundColor: "red",
                    data: [
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max)
                    ],
                    borderColor: 'white',
                    borderWidth: 2
                }, {
                    type: 'bar',
                    label: 'Dataset 3',
                    backgroundColor: "green",
                    data: [
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max),
                        getRandomInt(max)
                    ]
                }]
    
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Chart.js Combo Bar Line Chart'
                },
                tooltips: {
                    mode: 'index',
                    intersect: true
                }
            }
        })
        res.push({
            type: "scatter" ,
            data: {
                datasets: [{
                    label: 'My First dataset',
                    borderColor: "red",
                    backgroundColor: "red",
                    data: [{
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }]
                }, {
                    label: 'My Second dataset',
                    borderColor: "blue",
                    backgroundColor: "blue",
                    data: [{
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }, {
                        x: getRandomInt(max),
                        y: getRandomInt(max),
                    }]
                }]
            }
        })
        response.json(res)
    }
)

app.listen(port, (err) => {
	if (err) {
		return console.log('something bad happened', err)
	}

	console.log(`server is listening on ${port}`)
})