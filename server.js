const express = require('express'),
				 cors = require('cors'),
					 ip = require('ip'),
	 bodyParser = require('body-parser'),
DatabaseLinks = require('docker-links').parseLinks(process.env),
			request = require('request');

const Point = require('./data-classes/classes.js').Point;
const HyperSpaceNode = require('./data-classes/classes.js').HyperSpaceNode;

// console.log("DatabaseLinks: ", DatabaseLinks);
console.log("NODE_ENV: ", process.env.NODE_ENV);
const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';
console.log("isProduction: ", isProduction);

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

// const isDeveloping = (process.env.NODE_ENV !== ‘production’)? true : false;

// if (isDeveloping) {
//   let webpack = require('webpack');
//   let webpackMiddleware = require('webpack-dev-middleware');
//   let webpackHotMiddleware = require('webpack-hot-middleware');
//   let config = require('./webpack.config.js');
//   ...
//   // serve the content using webpack
//   app.use(middleware);
//   app.use(webpackHotMiddleware(compiler));
//   ...
// } else {
//   // serve the content using static directory
//   app.use(express.static(staticPath));
// }

// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});


// app.use(cors());
// const corsOptions = {
//   origin: api
// }
// app.use(cors(corsOptions))

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


// app.get(HyperspaceJumpService.shortestJumpPath, HyperspaceJumpService.calculateShortestJump);

// app.get(HyperspaceJumpService.multipleJumpsPath, HyperspaceJumpService.calculateMultipleJumps);

app.post('/api/hyperspace-jump/calc-shortest', function(req, res) {
	console.log("calculate hyperspace jump: ", req.body);
	const JumpData = req.body;
	const options = {
	  method: 'post',
	  body: JumpData,
	  json: true,
	  url: NAVCOM + '/hyperspace-jump/calc-shortest'
	}

	request(options, function (error, response, body) {
		if(error) {
			console.log("error getting data from navi computer: ", error);
			res.sendStatus(500);
		} else {
			console.log("Found hyperspace jump, sending!!");
			res.json(body);
		}
	});    
});

app.post('/api/hyperspace-jump/calc-many', function(req, res) {
	console.log("calculate hyperspace jump: ", req.body);
	const JumpData = req.body;
	const options = {
	  method: 'post',
	  body: JumpData,
	  json: true,
	  url: NAVCOM + '/hyperspace-jump/calc-many'
	}

	request(options, function (error, response, body) {
		if(error) {
			console.log("error getting data from navi computer: ", error);
			res.sendStatus(500);
		} else {
			console.log("Found hyperspace jump, sending!!");
			res.json(body);
		}
	});    
});

app.get('/api/tile-server-url', function(req, res) {
  console.log("tile server url: ", TILES);
  res.json({tileServerUrl: TILES});
});

app.listen(serverPort, ip.address(), function () {
	console.log('Galaxy API listening on port http://' + ip.address() + ':' +  serverPort + '!');
});