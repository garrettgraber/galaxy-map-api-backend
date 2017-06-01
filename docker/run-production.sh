#!/bin/bash


./build.sh
# echo "Deleting "
docker rm -f galaxy-map-server
echo "Running galaxy-map-server.."

docker run --name galaxy-map-server --env NODE_ENV=production  -v /${PWD}/../://root/app  -p 80:8103 galaxy-map-server

