const express = require('express');
const cors = require('cors');
const ip = require('ip');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const DatabaseLinks = require('docker-links').parseLinks(process.env);
const mongoose = require('mongoose');
const urlencode = require('urlencode');
const request = require('request');
const distance = require('euclidean-distance');
const _ = require('lodash');
const Promise = require('bluebird');



class Point {
  constructor(
    lat,
    lng
  ) {
    this.lat = lat;
    this.lng = lng;
  }

  normalizeLng() {
    return this.lng / 2.0;
  }

  coordinatesNormalized() {
  	// console.log("coordinates has fired!");
  	const normalizedCoordinates = [this.lat, this.normalizeLng()];
    return normalizedCoordinates;
  }
  coordinates() {
	const coordinatesLatLng = [this.lat, this.lng];
	return coordinatesLatLng;
  }
};


class HyperspaceNode {
	constructor(
		lng,
  		lat,
		hyperspaceLanes,
		nodeId,
		loc,
		system,
		distanceFromPoint,
		distanceFromPointNormalized,
		xGalacticLong,
		yGalacticLong
	) {
		this.lng = lng,
  		this.lat = lat,
		this.hyperspaceLanes = hyperspaceLanes,
		this.nodeId = nodeId,
		this.loc = loc,
		this.system = system;
		this.distanceFromPoint = distanceFromPoint;
		this.distanceFromPointNormalized = distanceFromPointNormalized;
		this.xGalacticLong = xGalacticLong;
		this.yGalacticLong = yGalacticLong;
	}
}

function distanceBetweenNodesAndPoints(SearchPoint, nodesArray) {
	const searchPointCoordinates = SearchPoint.coordinatesNormalized();
	const nodesArraySorted = [];
	for(let Node of nodesArray) {
		const NodePoint = new Point(Node.lat, Node.lng);
		const nodeCoordinatesNormalized = NodePoint.coordinatesNormalized();
		const nodeCoordinates = NodePoint.coordinates();

		console.log("\nnodeCoordinatesNormalized: ", nodeCoordinatesNormalized);
		console.log("nodeCoordinates: ", nodeCoordinates);

		const distanceBetweenNormalized = distance(searchPointCoordinates, nodeCoordinatesNormalized);
		const distanceBetween = distance(searchPointCoordinates, nodeCoordinates);

		const NodeToSend = new HyperspaceNode(
			Node.lng,
			Node.lat,
			Node.hyperspaceLanes,
			Node.nodeId,
			Node.loc,
			Node.system,
			distanceBetween,
			distanceBetweenNormalized,
			Node.xGalacticLong,
			Node.yGalacticLong
		);

		// console.log("NodeToSend: ", NodeToSend);
		
		// let NodeClone = _.cloneDeep(Node);
		// _.set(NodeClone, 'distance', distanceBetween);
		// NodeClone._doc['distanceFromPoint'] = parseFloat(distanceBetween.toFixed(8));
		// console.log("NodeClone: ", NodeClone);

		const outputText = "Distance from " + NodeToSend.system + " : " + NodeToSend.distanceFromPoint;
		console.log(outputText);
		const outputTextNormalized = "Distance from " + NodeToSend.system + " : " + NodeToSend.distanceFromPointNormalized + " normalized";
		console.log(outputTextNormalized);
		nodesArraySorted.push(NodeToSend);

	}


	nodesArraySorted.sort(function(a, b) {
	    return parseFloat(a.distanceFromPointNormalized) - parseFloat(b.distanceFromPointNormalized);
	});

	// const sortedArray = _.sortBy(nodesArraySorted, 'distanceFromPoint');
	console.log("nodesArraySorted: ", nodesArraySorted);

	// console.log("\nSearchPoint: ", SearchPoint);
	// console.log("searchPointCoordinates: ", searchPointCoordinates);
	return nodesArraySorted;
}


function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}



// const MongoDatabase = require('./models/models.js');

// console.log("MongoDatabase: ", MongoDatabase);


console.log("DatabaseLinks: ", DatabaseLinks);
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


console.log("MONGO: ", MONGO);
console.log("NAVCOM: ", NAVCOM);
console.log("TILES: ", TILES);

mongoose.connect(MONGO);

var db = mongoose.connection;
var Schema = mongoose.Schema;



const PlanetSchema = new Schema({
    system         : String,
    sector         : { type : Array , "default" : [] },
    region         : String,
    coordinates    : String,
    xGalactic      : Number,
    yGalactic      : Number,
    xGalacticLong  : Number,
    yGalacticLong  : Number,
    hasLocation    : { type : Boolean, "default": false },
    LngLat         : { type : Array , "default" : [] },
    lng            : { type : Number , "default" : null },
    lat            : { type : Number , "default" : null },
    zoom           : Number,
    link           : String
});
PlanetSchema.set('autoIndex', true);
const PlanetModel = mongoose.model('PlanetModel', PlanetSchema);

const HyperspaceNodeSchema = new Schema({
    system         : String,
    lng            : { type : Number , "default" : null },
    lat            : { type : Number , "default" : null },
    yGalacticLong  : { type : Number , "default" : null },
    xGalacticLong  : { type : Number , "default" : null },
    hyperspaceLanes: { type : Array , "default" : [] },
    nodeId         : { type : Number, "default" : null },
    loc            : { type : Array, "default" : [] }
});
HyperspaceNodeSchema.set('autoIndex', true);
HyperspaceNodeSchema.index({ loc: '2d' });
const HyperspaceNodeModel = mongoose.model('HyperspaceNodeModel', HyperspaceNodeSchema);

const CoordinateSchema = new Schema({
    coordinates: String,
});
CoordinateSchema.set('autoIndex', true);
const CoordinateModel = mongoose.model('CoordinateModel', CoordinateSchema);

const SectorSchema = new Schema({
    name: String,
});
SectorSchema.set('autoIndex', true);
const SectorModel = mongoose.model('SectorModel', SectorSchema);


const HyperLaneSchema = new Schema({
    name: String,
    hyperspaceHash: String,
    start: String,
    end: String,
    startCoordsLngLat: { type : Array , "default" : [] },
    endCoordsLngLat: { type : Array , "default" : [] },
    length: Number,
    link: String,
    startNodeId: { type : Object, "default" : {} },
    endNodeId: { type : Object, "default" : {} },
    coordinates: [
			[Number, Number]
		]
});
HyperLaneSchema.set('autoIndex', true);
const HyperLaneModel = mongoose.model('HyperLaneModel', HyperLaneSchema);



const emptyCollections = async () => {
	console.log("emptyCollections has fired..");
	const databasePromiseArray = [
		await PlanetModel.remove({}).exec(),
		await CoordinateModel.remove({}).exec(),
		await HyperLaneModel.remove({}).exec(),
		await SectorModel.remove({}).exec(),
		await HyperspaceNodeModel.remove({}).exec()
	];
	Promise.all(databasePromiseArray).then(() => {
  	console.log("all the collections were cleared");
  	// return {collectionsCleared: true};
	}).catch(error => {
	  console.log("error clearing all the collections");
	});	
};


db.on('error', function(error) {
	console.log("Error connecting: ", error);
});

db.once('open', function() {
  	console.log("connection to mongo database open");
	PlanetModel.count({}, function(err, count) {

		console.log("Total Planets in Database: ", count);

	});
});

db.on('connected', function () {
	console.log("Connected to mongo database");
  //   db.listCollections().toArray(function (err, names) {
		// if (err) {
		// 	console.log("err: ", err);
		// } else {
		// 	console.log("names: ", names);
		// }
		// // mongoose.connection.close();
  //   });

	// db.collectionNames(function(error, collections) {
	//     if (error) {
	//       throw new Error(error);
	//     } else {
	//       collections.map(function(collection) {
	//         console.log('found collection %s', collection.name);
	//       });
	//     }
	// });

	mongoose.connection.db.listCollections().toArray(function (err, names) {
      if (err) {
        console.log(err);
      } else {
        console.log(names);
      }



      // mongoose.connection.close();
    });

});

var serverPort = 8103;
var app = express();

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
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/images'));


var utcTimeZoneOffset = -7;

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

	console.log("app.get fired...");
	       
	res.sendFile('index.html');

});




app.get('/api/empty-collections', function(req, res) {
	emptyCollections().then(data => {
		// res.json(data);
		res.sendStatus(200);
	}).catch(error => {
		res.sendStatus(404);
	});
});



app.get('/api/has-location', function(req, res) {

	console.log("get all planets with a location");

	PlanetModel.find({hasLocation: true}, function (err, docs) {
	 	console.log("All Planets Total: ", docs.length);
	 	res.json(docs);
	});

});


app.get('/api/all', function(req, res) {

	console.log("get all planets");

	PlanetModel.find({}, function (err, docs) {
	 	console.log(docs);
	 	console.log("All Planets");
	 	res.json(docs);
	});
});


app.get('/api/search', function(req, res) {

	console.log("req.query: ", req.query);

	// var system = req.params('system');
	// var region = req.params('region');
	// var sector = req.params('sector');
	// var hyperlane = req.query.hyperspace;

	// console.log("hyperlane: ", hyperlane);
	// var coordinates = req.params('coordinates');

	PlanetModel.find(req.query, function(err, docs) {
	 	console.log("planets found: ", docs);
	 	console.log("planets err: ", err);
	 	if(err) {
	 		res.json(err);
	 	} else {
	 		res.json(docs);		
	 	}
	});
});


app.get('/api/populated-areas', function(req, res) {
	CoordinateModel.find({}, function(err, result) {
		console.log("Total Coordinates in Database: ", result.length);
		res.json(result);
	});
});


app.get('/api/sectors', function(req, res) {

	SectorModel.find({}, function(err, result) {

		console.log("Total Sectors in Database: ", result.length);
		res.json(result);

	});

});


app.get('/api/hyperspacelane/', function(req, res) {

	HyperLaneModel.find({}, function(err, result) {

		console.log("Total Hyper Lanes in Database: ", result);
		res.json(result);

	});

});



app.get('/api/hyperspacelane/search', function(req, res) {

	console.log("req.query: ", req.query);

	// var system = req.params('system');
	// var region = req.params('region');
	// var sector = req.params('sector');
	// var hyperlane = req.query.hyperspace;

	// console.log("hyperlane: ", hyperlane);
	// var coordinates = req.params('coordinates');

	HyperLaneModel.find(req.query, function(err, docs) {
	 	console.log("hyperspace lanes found: ", docs);

	 	if(err || docs.length === 0) {

	 		res.sendStatus(404);

	 	} else {

	 		res.json(docs);		

	 	}

	 	
	});

});


app.get('/api/hyperspacenode/', function(req, res) {

	HyperspaceNodeModel.find({}, function(err, result) {

		console.log("Total Hyperspace Nodes in Database: ", result);
		res.json(result);

	});

});


// var lng = -74;
// var lat = 40.74;
// var d = 100;
// var point = {
//     type: "Point",
//     coordinates: [lng, lat]
// };

app.get('/api/hyperspacenode/closet', function(req, res) {

	const maxDistance = 100.0;

	// console.log("req.query: ", req.query);
	const lng = parseFloat(req.query.lng);
	const lat = parseFloat(req.query.lat);
	console.log("longitude: ", lng);
	console.log("latitude: ", lat);

	if(!isNaN(lat) && !isNaN(lng)) {

		const searchCoordinates = [lng, lat];

		HyperspaceNodeModel.find({
	      loc: {
	        $near: searchCoordinates,
	        $maxDistance: maxDistance
	      }
	    })
	    .limit(30)
		.exec(function(err, results) {
		     // `posts` will be of length 20
		    console.log("nearest hyperspace node error: ", err);
	    	console.log("nearest hyperspace node result: ", results);
	    	console.log("searchCoordinates: ", searchCoordinates);
	    	// const firstNode = results[0];
	    	// const nodeCoordinates = [firstNode.lat, firstNode.lng];
	    	const SearchPoint = new Point(lat, lng);
	    	// const distanceBetweenLocationAndNode = distance(SearchPoint, nodeCoordinates);
	    	// console.log("distance between points: ", distanceBetweenLocationAndNode);

	    	console.log("SearchPoint: ", SearchPoint);
	    	// console.log("nodeCoordinates: ", nodeCoordinates);
	    	const nodesSortedByDistance = distanceBetweenNodesAndPoints(SearchPoint, results);
	    	const firstNode = nodesSortedByDistance[0];
	    	console.log("nodesSortedByDistance: ", nodesSortedByDistance);
	    	res.json([firstNode]);
		});

	
	} else {

		res.sendStatus(400);

	}

	// HyperspaceNodeModel.geoNear(
	//     searchCoordinates, 																				
	//     { maxDistance: maxDistance, spherical: false },
	//     function(err, results, stats) {
	//         // results is an array of result objects like:
	//         // {dis: distance, obj: doc}

	//         console.log("nearest hyperspace node error: ", err);
	//     	console.log("nearest hyperspace node results: ", results);
	//     	console.log("nearest hyperspace node stats: ", stats);
	//     	res.json(results);
	//     }
	// );


	// db.runCommand({
	// 	geoNear: "hyperspacenodemodels",
	// 	near: [ -74, 40.74 ], //req.query.latlng
	// 	spherical: false,
 //   });

 	// const lon = -74,
 	// const lat = 40.74;

	// HyperspaceNodeModel.hyperspacenodemodels.geoNear(lon, lat, {spherical: false, maxDistance: d}, function(err, docs) {

	// 	if(error) {
	// 		console.log("error: ", error);
	// 	} else {
	// 		console.log("nodes near: ", docs);
	// 	}

	// 	if (docs.results.length == 1) {
	// 		var distance = docs.results[0].dis;
	// 		var match = docs.results[0].obj;

	// 	}
// 	// });

// 	console.log("Looking for nearest distance!");

// 	// HyperspaceNodeModel.geoNear(point, {spherical: false, maxDistance: d}, function(err, docs, stats) {
//  //        console.log('Geo Results', docs);
//  //        console.log('Geo stats', stats);
//  //        if (err) {
//  //            console.log('geoNear error:', err);
//  //            res.json(res, 404, err);
//  //        } else {
//  //            res.json(res, 200, docs);
//  //        }
//  //    });

//  //    HyperspaceNodeModel.find({
// 	//     "$nearSphere": {
// 	//         "$geometry": {
// 	//             "type": "Point",
// 	//             "coordinates": [parseFloat(req.params.lng), parseFloat(req.params.lat)] 
// 	//         },
// 	//         "$maxDistance": distanceInMeters
// 	//     },
// 	//     "loc.type": "Point"
// 	// },function(err,docs) {

// 	//    // The documents are also mongoose document objects as well
// 	// });

// 	HyperspaceNodeModel.aggregate(
//     [
//         { "$geoNear": {
//             "near": {
//                 "type": "Point",
//                 // "coordinates": [parseFloat(req.params.lng), parseFloat(req.params.lat)]
//                 "coordinates": [parseFloat(lng), parseFloat(lat)]

//             },
//             "distanceField": "distance",
//             "maxDistance": d,
//             "spherical": false,
//             "query": { "loc.type": "Point" }
//         }},
//         { "$sort": { "distance": -1 } } // Sort nearest first
//     ],
//     function(err,docs) {
//        // These are not mongoose documents, but you can always cast them
// 		console.log('Geo Results', docs);
//         if (err) {
//             console.log('geoNear error:', err);
//             res.json(res, 404, err);
//         } else {
//             res.json(res, 200, docs);
//         }
//     }
// );

});





app.get('/api/hyperspacenode/search', function(req, res) {

	console.log("req.query: ", req.query);

	// var system = req.params('system');
	// var region = req.params('region');
	// var sector = req.params('sector');
	// var hyperlane = req.query.hyperspace;

	// console.log("hyperlane: ", hyperlane);
	// var coordinates = req.params('coordinates');

	if(req.query.hasOwnProperty('nodeId')) {

		req.query.nodeId = parseInt(req.query.nodeId);
	}

	HyperspaceNodeModel.find(req.query, function(err, docs) {
	 	console.log("hyperspace nodes found: ", docs);

	 	if(err) {
	 		res.json(err);
	 	} else {

	 		res.json(docs);		

	 	}

	});

});



app.get('/api/no-location', function(req, res) {

	PlanetModel.find({hasLocation: false}, function(err, result) {

		console.log("Planets with no exact location: ", result);
		res.json(result);

	});

});


app.get('/api/tile-server-url', function(req, res) {

  console.log("tile server url: ", TILES);

  res.json({tileServerUrl: TILES});

});



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
			console.log("Found hyperspace jump, sending!!: ", response.body);
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



app.listen(serverPort, ip.address(), function () {

	console.log('Example app listening on port http://' + ip.address() + ':' +  serverPort + '!');

});


