#! /bin/bash
#
# build and Deploy this app on now.sh

rm -rfv vue-frontend/dist/*
rm -rfv backend/app/public/*
rm -rfv backend/views/*
cd vue-frontend
pwd
if ! npm run build ; then
  echo "#############"
  echo "Build Failed"
  rm -rfv dist/*
  exit 1
fi
cp -vr dist/* ../backend/app/public/
cp -v dist/index.html ../backend/views/index.hbs
cd ../backend
pwd 
now --public
now alias -A now.json
