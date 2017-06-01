#!/bin/bash


./build.sh
# echo "Deleting "
docker rm -f galaxy-map-server
echo "Running galaxy-map-server.."

docker run --name galaxy-map-server --link data-planet:mongo  --link map-tile-server:tiles  --env NODE_ENV=development  -v /${PWD}/../://root/app  -p 8103:8103 galaxy-map-server

