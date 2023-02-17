# this python module provides a serverless cloud function
# that handles a http request from the FieldTwin integration front end
# and returns a calculated connection profile plot for display.

import functions_framework
import json

def api_get_project(request):
  # This function requests the FieldTwin project data
  import requests
  # the FieldTwin API URL 
  api_url = request['ftApiUrl']
  # the FieldTwin project id
  project_id = request['projectId']
  # the FieldTwin API access token
  jwt = request['token']
  # retrieve the FieldTwin project data using the API
  response = requests.get(
    f'{api_url}/API/v1.9/{project_id}/basic',
    headers={
      'authorization': f'bearer {jwt}',
    }
  )
  project_data = response.json()
  return project_data

def api_get_connection(request):
  # This function requests the FieldTwin connection data
  # for the selected connection
  import requests
  # the FieldTwin API URL 
  api_url = request['ftApiUrl']
  # the FieldTwin project id
  project_id = request['projectId']
  # the FieldTwin subproject id
  subproject_id = request['subProjectId']
  # the FieldTwin connection id
  connection_id = request['connectionId']
  # the FieldTwin API access token
  jwt = request['token']
  # retrieve the connection data using the FieldTwin API
  response = requests.get(
    f'{api_url}/API/v1.9/{project_id}/subProject/{subproject_id}/connection/{connection_id}',
    headers={
      'authorization': f'bearer {jwt}',
      # request that the connection is sampled every 1 unit 
      'sample-every': '1',
      # set the sampling method to simplify to significantly reduce the data size
      'simplify': 'true',
    }
  )
  connection_data = response.json()
  return connection_data

def calculate_profile(connection_data, unit):
  # this function calculates the connection profile
  # for the selected connection and returns an svg plot image
  import math
  import matplotlib.pyplot as plotter
  from matplotlib.pyplot import figure
  import io

  # obtain the connection coordinate points
  points = []
  points.append(connection_data['fromCoordinate'])

  if 'sampled' in connection_data:
    # use the sampled connection data if it is available
    points = connection_data['sampled']
  elif 'intermediaryPoints' in connection_data:
    # otherwise use the intermediary points
    points = connection_data['intermediaryPoints']
    points.append(connection_data['toCoordinate'])

  # calculate the distance vs depth profile for the connection
  profile_distance = []
  profile_depth = []
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
    profile_distance.append(distance)
    profile_depth.append(z)

  # create a plot of the calculated profile
  connection_name = connection_data['params']['label']
  # set the plot styling and size
  plotter.style.use('seaborn-v0_8')
  plotter.figure(figsize=(10,5))
  # plot the profile
  plotter.plot(profile_distance, profile_depth, c = '#0080C0')
  # add the title and axes labels
  plotter.title(f"{connection_name} Connection Profile")
  plotter.xlabel(f'Distance along connection ({unit})')
  plotter.ylabel(f'Depth ({unit})')
  # save the plot image
  img_bytes = io.BytesIO()
  plotter.savefig(img_bytes, format='svg')
  plotter.close()
  # Return the image data as a bytes object
  return img_bytes.getvalue()

@functions_framework.http
def get_connection(request):
  # this function handles the http request from the frontend UI
  # and returns the calculated profile svg image to the UI for display
  import flask

  # read the request parameters
  request_args = request.args

  # obtain the FieldTwin project data (to get the distance unit)
  project_data = api_get_project(request_args)
  unit = project_data.get('coordinateUnits', 'm')

  # obtain the FieldTwin connection data for the selected connection
  connection_data = api_get_connection(request_args)

  # calculate the profile and create the plot image 
  image_data = calculate_profile(connection_data, unit)

  # Return the SVG image data to the frontend UI
  response = flask.make_response(image_data)
  response.headers.set('Content-Type', 'image/svg+xml')
  return response