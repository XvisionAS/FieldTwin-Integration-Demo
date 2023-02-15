#! /usr/bin/env python3

import sys
import os
import requests

if not len(sys.argv) == 4:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <CATEGORY>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

for var in ["TOKEN", "BACKEND_HOST"]:
    if not var in os.environ:
        print('Required environment variable not set: %s' % var)
        sys.exit(1)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
CATEGORY = sys.argv[3]

TOKEN = os.environ['TOKEN']
PORT = os.environ.get('PORT', '')
HOST_URL = 'https://{}{}{}'.format(
    os.environ['BACKEND_HOST'],
    ':' if PORT else '',
    PORT
)
API_VERSION = 'v1.9'

url = f'{HOST_URL}/API/{API_VERSION}/{PROJECT_ID}/subProject/{SUBPROJECT_ID}'
headers = {
    'token': TOKEN
}
r = requests.get(url, headers=headers)
if r.status_code != 200:
    print(r.text)
    sys.exit(1)
response = r.json()

stagedAssets = response["stagedAssets"]
stagedAssetsFiltered = [ v for v in stagedAssets.values() if v['asset']['category'] == CATEGORY ]

print(stagedAssetsFiltered)
