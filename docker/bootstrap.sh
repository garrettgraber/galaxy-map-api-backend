#!/bin/bash

echo "Bootstrap is running..."
echo "Link in preinstalled packages...";
rm -rf /root/app/node_modules
ln -s /root/node_modules /root/app/node_modules
echo "npm start the app...";

echo "Current directory 1: $PWD"
ls

cd /root/app
npm ls --depth=0

echo "Current directory 2: $PWD"
ls

which npm
which node
which bash

# npm install


npm ls --depth=0


#/usr/local/bin/npm start > /root/app/app.log 2>&1 &
# echo "Launch the SSHD server...";
# /usr/sbin/sshd -D &
chmod -R 0777 /tmp
echo "Tailing the service..."
# tail -f /root/app/app.log
echo "Current directory 3: $PWD"
ls

cd images
echo "Current directory 4: $PWD"
ls;

echo "bootstrap.sh end."
echo "Entering bash shell..."
# bash

npm ls --depth=0;

npm ls -g --depth=0;

webpack --version

webpack-dev-server --version


# webpack-dev-server --hot --inline

nodemon server.js
