#!/bin/bash

NODE_SERVER="map-express-server";
APP="ionic-base";


./build.sh
# echo "Deleting "
docker rm -f galaxy-map-server
echo "Running galaxy-map-server.."

docker run --name galaxy-map-server --link data-planet:mongo  -v /${PWD}/../://root/app  -p 8103:8103 galaxy-map-server

