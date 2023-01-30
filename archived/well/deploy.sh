#! /bin/bash
#
# build and Deploy this app on now.sh

rm -rfv frontend/dist/*
rm -rfv backend/app/public/*
rm -rfv backend/views/*
cd frontend || exit 1
pwd
if ! npm run build ; then
  echo "#############"
  echo "Build Failed"
  rm -rfv dist/*
  exit 1
fi
cp -vr dist/* ../backend/app/public/
cp -v dist/index.html ../backend/views/index.hbs
cd ../backend || exit 1
pwd 
now --public
now alias -A now.json
