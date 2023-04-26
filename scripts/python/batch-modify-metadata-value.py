#! /usr/bin/env python3

import sys
import os
import json
import requests

def valueForType(value, type):
    if type == 'numerical' or type == 'slider':
        return float(value)
    elif type == 'boolean':
        return 'true' if value.lower() in ['true', '1', 'yes'] else 'false'
    elif type == 'choices' or type == 'table':
        # See HOWTO.md for how to handle these types
        raise NotImplementedError('Type %s is not yet handled by this script' % type)
    else:
        return value

if not len(sys.argv) == 5:
    print('Usage: %s <PROJECT_ID> <SUBPROJECT_ID> <VENDOR_ID> <METADATA_VALUE>' % os.path.basename(sys.argv[0]))
    sys.exit(1)

for var in ["TOKEN", "BACKEND_HOST"]:
    if not var in os.environ:
        print('Required environment variable not set: %s' % var)
        sys.exit(1)

PROJECT_ID = sys.argv[1]
SUBPROJECT_ID = sys.argv[2]
VENDOR_ID = sys.argv[3]
NEW_VALUE = sys.argv[4]

if VENDOR_ID == "":
    print('Vendor ID must not be empty')
    sys.exit(1)

TOKEN = os.environ['TOKEN']
PORT = os.environ.get('PORT', '')
HOST_URL = 'https://{}{}{}'.format(
    os.environ['BACKEND_HOST'],
    ':' if PORT else '',
    PORT
)
API_VERSION = 'v1.9'

url = f'{HOST_URL}/API/{API_VERSION}/{PROJECT_ID}/subProject/{SUBPROJECT_ID}'
headers= {
    'token': TOKEN,
    'content-type': 'application/json'
}
r = requests.get(url, headers=headers)
if r.status_code != 200:
    print(r.text)
    sys.exit(1)
response = r.json()

for object_type in ["stagedAssets", "connections", "wells", "layers"]:
    objects = response.get(object_type, {})
    for id in objects:
        object = objects[id]
        metadata_list = object.get("metaData", [])
        change_list = []
        for metadata in metadata_list:
            vendor_id = metadata.get("vendorId", "")
            metadata_type = metadata.get("type", "string")
            if vendor_id == VENDOR_ID:
                change_list.append({
                    "metaDatumId": metadata["metaDatumId"],
                    "value": valueForType(NEW_VALUE, metadata_type)
                })
        if len(change_list) > 0:
            object_singular = object_type[:-1]
            print('Updating {} on {} {}'.format(VENDOR_ID, object_singular, id))
            url = f'{HOST_URL}/API/{API_VERSION}/{PROJECT_ID}/subProject/{SUBPROJECT_ID}/{object_singular}/{id}'
            payload = {
                "metaData": change_list
            }
            r = requests.patch(url, data=json.dumps(payload), headers=headers)
            if r.status_code != 200:
                print(r.text)
                sys.exit(1)

print('Done')
