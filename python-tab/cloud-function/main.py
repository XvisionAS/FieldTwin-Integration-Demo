# this python module provides a serverless cloud function
# that handles a http request from the FieldTwin integration front end
# and returns a calculated connection profile plot for display.

import functions_framework
import json

def api_get_project(request):
  # This function requests the FieldTwin project data
  import requests
  # the FieldTwin API URL 
  apiUrl = request['ftApiUrl']
  # the FieldTwin project id
  projectId = request['projectId']
  # the session JWT authorising access to the API
  apiToken = request['token']
  # retrieve the FieldTwin project data using the API
  response = requests.get(
    f'{apiUrl}/API/v1.9/{projectId}',
    headers={
      'authorization': f'bearer {apiToken}',
    }
  )
  projectData = response.json()
  return projectData

def api_get_connection(request):
  # This function requests the FieldTwin connection data
  # for the selected connection
  import requests
  # the FieldTwin API URL 
  apiUrl = request['ftApiUrl']
  # the FieldTwin project id
  projectId = request['projectId']
  # the FieldTwin subproject id
  subprojectId = request['subProjectId']
  # the FieldTwin connection id
  connectionId = request['connectionId']
  apiToken = request['token']
  # retrieve the subproject data using the FieldTwin API
  response = requests.get(
    f'{apiUrl}/API/v1.9/{projectId}/subProject/{subprojectId}/connection/{connectionId}',
    headers={
      'authorization': f'bearer {apiToken}',
      'sample-every': '1',
      'simplify': 'true',
    }
  )
  connectionData = response.json()
  return connectionData

def calculate_profile(connectionData, unit):
  # this function calculates the connection profile
  # for the selected connection and creates a plot image
  import math
  import matplotlib.pyplot as plotter
  from matplotlib.pyplot import figure

  # obtain the connection coordinate points
  points = []
  points.append(connectionData['fromCoordinate'])

  if 'sampled' in connectionData:
    # use the sampled connection data if it is available
    points = connectionData['sampled']
  elif 'intermediaryPoints' in connectionData:
    # otherwise use the intermediary points
    points = connectionData['intermediaryPoints']
    points.append(connectionData['toCoordinate'])

  # calculate the distance vs depth profile for the connection
  profileDistance = []
  profileDepth = []
  distance = 0
  x0 = points[0]['x']
  y0 = points[0]['y']
  for point in points:
    x1 = point['x']
    y1 = point['y']
    z = point['z']
    # accumulate the along connection distance
    distance += math.hypot((x1-x0), (y1-y0))
    x0 = x1
    y0 = y1
    # build the profile x and y arrays
    profileDistance.append(distance)
    profileDepth.append(z)

  # create a plot of the calculated profile
  name = connectionData['params']['label']
  plotter.style.use('seaborn-v0_8')
  plotter.figure(figsize=(10,5))
  plotter.plot(profileDistance, profileDepth, c = '#0080C0')
  # add the title and axes labels
  plotter.title(f"{name} Connection Profile")
  plotter.xlabel(f'Distance along connection ({unit})')
  plotter.ylabel(f'Depth ({unit})')
  # save the plot image to a local file
  plotter.savefig('profile.svg')
  plotter.close()
  return

@functions_framework.http
def get_connection(request):
  # this function handles the http request from the frontend UI
  import os
  import flask

  # delete any existing file
  if os.path.exists("profile.svg"):
    os.remove("profile.svg")

  # read the request parameters
  request_json = request.get_json(silent=True)
  request_args = request.args

  # obtain the FieldTwin project data
  projectData = api_get_project(request_args)
  unit = projectData['coordinateUnits']

  # obtain the FieldTwin connection data for the selected connection
  connectionData = api_get_connection(request_args)

  # calculate the profile and create the image file
  calculate_profile(connectionData, unit)

  # return the created image file to the frontend UI for display
  return flask.send_from_directory(os.getcwd(), "profile.svg", mimetype="image/svg+xml")
