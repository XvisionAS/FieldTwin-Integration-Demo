#! /usr/bin/env python3

import sys
import os
import requests

if not len(sys.argv) == 5:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <WELL_ID> <RANGE>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

for var in ["TOKEN", "BACKEND_HOST"]:
    if not var in os.environ:
        print('Required environment variable not set: %s' % var)
        sys.exit(1)

def inRange(p1, p2, range):
    dist = ((float(p1[0]) - float(p2[0])) ** 2 + (float(p1[1]) - float(p2[1])) ** 2) ** 0.5
    return dist <= range

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
WELL_ID = sys.argv[3]
RANGE = sys.argv[4]

TOKEN = os.environ['TOKEN']
PORT = os.environ.get('PORT', '')
HOST_URL = 'https://{}{}{}'.format(
    os.environ['BACKEND_HOST'],
    ':' if PORT else '',
    PORT
)
API_VERSION = 'v1.9'

url = f'{HOST_URL}/API/{API_VERSION}/{PROJECT_ID}/subProject/{SUBPROJECT_ID}/well/{WELL_ID}'
headers = {
    'token': TOKEN
}
r = requests.get(url, headers=headers)
if r.status_code != 200:
    print(r.text)
    sys.exit(1)
response = r.json()
wellPos = [response["x"], response["y"]]

url = f'{HOST_URL}/API/{API_VERSION}/{PROJECT_ID}/subProject/{SUBPROJECT_ID}'
r = requests.get(url, headers=headers)
if r.status_code != 200:
    print(r.text)
    sys.exit(1)
response = r.json()

stagedAssets = response["stagedAssets"]
stagedAssetsFiltered = [
    v for v in stagedAssets.values() if inRange(
        [v['initialState']['x'], v['initialState']['y']], wellPos, float(RANGE)
    )
]

print(stagedAssetsFiltered)
