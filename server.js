const express = require('express'),
				 cors = require('cors'),
					 ip = require('ip'),
	 bodyParser = require('body-parser'),
DatabaseLinks = require('docker-links').parseLinks(process.env),
			request = require('request');


console.log("NODE_ENV: ", process.env.NODE_ENV);
const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';
console.log("Is Production: ", isProduction);

if(DatabaseLinks.hasOwnProperty('tiles') && DatabaseLinks.hasOwnProperty('mongo') && isDeveloping) {
	var TILES = 'http://' + DatabaseLinks.tiles.hostname + ':' + DatabaseLinks.tiles.port + '/tiles-leaflet-new/{z}/{x}/{y}.png';
	var MONGO = 'mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port;
	var NAVCOM = 'http://' + DatabaseLinks.navcom.hostname + ':' + DatabaseLinks.navcom.port;
} else if (isProduction) {
	var TILES = '';
	var MONGO = 'mongodb://172.31.79.220:27017/test';
	var NAVCOM = 'http://172.31.77.226:80';
} else {
  var TILES = 'http://localhost:8110/tiles-leaflet-new/{z}/{x}/{y}.png';
}

const MongoController = require('./controllers/mongo-async-controller.js');
const PlanetService = require('./services/planet-router-service.js');
const HyperspaceNodeService = require('./services/hyperspace-node-router-service.js');
const HyperspaceLaneService = require('./services/hyperspace-lane-router-service.js');
const SectorsService = require('./services/sector-router-service.js');
const CoordinatesService = require('./services/grid-coordinates-router-service.js');
const HyperspaceJumpService = require('./services/hyperspace-jump-router-service.js');


console.log("\nMONGO: ", MONGO);
console.log("NAVCOM: ", NAVCOM);
console.log("TILES: ", TILES);
console.log("\n");

console.time("Connect to Mongo");
MongoController.connectToMongo().then(mongoConnectionResult => {
	console.timeEnd("Connect to Mongo");
}).catch(mongoConnectionError => {
	console.log("Error connecting to mongo database: ", mongoConnectionError);
});

const serverPort = 8103;
const app = express();

// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.get('/', function(req, res) {
	console.log("Loading index");
	res.sendFile('index.html');
});

app.get('/api/empty-collections', function(req, res) {
	MongoController.emptyCollections().then(data => {
		res.sendStatus(200);
	}).catch(error => {
		res.sendStatus(404);
	});
});

app.get(PlanetService.planetsWithALocationPath, PlanetService.planetsWithALocation);

app.get(PlanetService.allPlanetsPath, PlanetService.allPlanets);

app.get(PlanetService.searchPlanetsPath, PlanetService.searchPlanets);

app.get(PlanetService.planetsWithNoLocationPath, PlanetService.planetsWithNoLocation);

app.get(CoordinatesService.allCoordinatesPath, CoordinatesService.allCoordinates);

app.get(SectorsService.allSectorsPath, SectorsService.allSectors);

app.get(HyperspaceLaneService.allLanesPath, HyperspaceLaneService.allLanes);

app.get(HyperspaceLaneService.searchLanesPath, HyperspaceLaneService.searchLanes);

app.get(HyperspaceNodeService.allNodesPath, HyperspaceNodeService.allNodes);

app.get(HyperspaceNodeService.closetNodePath, HyperspaceNodeService.closetNode);

app.get(HyperspaceNodeService.searchNodesPath, HyperspaceNodeService.searchNodes);

app.get(HyperspaceNodeService.closetNodeToSystemPath, HyperspaceNodeService.closetNodeToSystem);

app.get(HyperspaceNodeService.connectedToCoruscantPath, HyperspaceNodeService.connectedToCoruscant);

app.get(HyperspaceNodeService.connectedToCsillaPath, HyperspaceNodeService.connectedToCsilla);

app.get(HyperspaceNodeService.systemsConnectedQueryPath, HyperspaceNodeService.systemsConnectedQuery);

app.get(HyperspaceNodeService.systemsUnConnectedQueryPath, HyperspaceNodeService.systemsUnConnectedQuery);

app.get(HyperspaceNodeService.pointConnectedToCoruscantPath, HyperspaceNodeService.pointConnectedToCoruscant);

app.get(HyperspaceNodeService.pointConnectedToCsillaPath, HyperspaceNodeService.pointConnectedToCsilla);


app.post(HyperspaceJumpService.shortestJumpPath, HyperspaceJumpService.calculateShortestJump);

app.post(HyperspaceJumpService.multipleJumpsPath, HyperspaceJumpService.calculateMultipleJumps);

app.post(HyperspaceJumpService.minimumJumpPath, HyperspaceJumpService.calculateMinimumJumps);

app.get('/api/tile-server-url', function(req, res) {
  console.log("tile server url: ", TILES);
  res.json({tileServerUrl: TILES});
});

app.listen(serverPort, ip.address(), function () {
	console.log('Galaxy API listening on port http://' + ip.address() + ':' +  serverPort + '!');
});