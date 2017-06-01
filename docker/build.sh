#!/bin/bash

FILE="package.json"
if [ -f $FILE ];
then
   echo "File $FILE exists."
else
   echo "File $FILE does not exist, copying..."

	 cp ../$FILE $FILE
	 echo "after package.json has copied.."
fi
#copy in package json if it is different
cmp -s package.json ../package.json > /dev/null
if [ $? -eq 1 ]; then
	echo "package.json has updated... copying...";
    cp ../package.json .
else
    echo "package.json is unchanged.";
fi
echo "Building galaxy-map-server..."

docker build -t galaxy-map-server . 
# docker build --no-cache -t galaxy-map-server .

echo "Build Done!"