#! /usr/bin/env python3

import sys
import os
import requests

if not len(sys.argv) == 4:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <CONNECTION_ID>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

for var in ["TOKEN", "BACKEND_HOST"]:
    if not var in os.environ:
        print('Required environment variable not set: %s' % var)
        sys.exit(1)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
CONNECTION_ID = sys.argv[3]

TOKEN = os.environ['TOKEN']
PORT = os.environ.get('PORT', '')
HOST_URL = 'https://{}{}{}'.format(
    os.environ['BACKEND_HOST'],
    ':' if PORT else '',
    PORT
)
API_VERSION = 'v1.10'

url = f'{HOST_URL}/API/{API_VERSION}/{PROJECT_ID}/subProject/{SUBPROJECT_ID}/connection/{CONNECTION_ID}'
headers= {
    'token': TOKEN
}
r = requests.get(url, headers=headers)
if r.status_code != 200:
    print(r.text)
    sys.exit(1)
response = r.json()

# Print the connection path as x,y,z values

start_point = response['fromCoordinate']
inter_points = response['intermediaryPoints']
end_point = response['toCoordinate']

print('{} {} {}'.format(start_point['x'], start_point['y'], start_point['z']))
for p in inter_points:
    print('{} {} {}'.format(p['x'], p['y'], p['z']))
print('{} {} {}'.format(end_point['x'], end_point['y'], end_point['z']))
