var express = require('express');
var cors = require('cors');
var ip = require('ip');
var bodyParser = require('body-parser');
var moment = require('moment-timezone');
var DatabaseLinks = require('docker-links').parseLinks(process.env);
var mongoose = require('mongoose');
var urlencode = require('urlencode');


console.log("DatabaseLinks: ", DatabaseLinks);



console.log("NODE_ENV: ", process.env.NODE_ENV);


const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';


console.log("isProduction: ", isProduction);


if(DatabaseLinks.hasOwnProperty('tiles') && DatabaseLinks.hasOwnProperty('mongo') && isDeveloping) {
  	var TILES = 'http://' + DatabaseLinks.tiles.hostname + ':' + DatabaseLinks.tiles.port + '/tiles-leaflet-new/{z}/{x}/{y}.png';
  	var MONGO = 'mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port;
} else if (isProduction) {
	var TILES = '';
	var MONGO = 'mongodb://API:GetAHummer@ec2-54-210-169-231.compute-1.amazonaws.com:27017/test';
} else {
  var TILES = 'http://localhost:8110/tiles-leaflet-new/{z}/{x}/{y}.png';
}


console.log("MONGO: ", MONGO);

mongoose.connect(MONGO);

var db = mongoose.connection;
var Schema = mongoose.Schema;




const PlanetSchema = new Schema({
    system        : String,
    sector        : { type : Array , "default" : [] },
    region        : String,
    coordinates   : String,
    xGalactic     : Number,
    yGalactic     : Number,
    xGalacticLong : Number,
    yGalacticLong : Number,
    hasLocation   : { type : Boolean, "default": false },
    LngLat        : { type : Array , "default" : [] },
    lng           : { type : Number , "default" : null },
    lat           : { type : Number , "default" : null },
    zoom		  : Number,
    link          : String
});

PlanetSchema.set('autoIndex', true);

const PlanetModel = mongoose.model('PlanetModel', PlanetSchema);


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
	hyperspace: String,
	start: String,
	end: String,
	startCoords: { type : Array , "default" : [] },
	endCoords: { type : Array , "default" : [] },
	length: Number,
	link: String
});

HyperLaneSchema.set('autoIndex', true);

const HyperLaneModel = mongoose.model('HyperLaneModel', HyperLaneSchema);





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
    // db.db.collectionNames(function (err, names) {
    //     if (err) console.log(err);
    //     else console.log(names);
    // });
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


app.get('/api/has-location', function(req, res) {

	PlanetModel.find({hasLocation: true}, function (err, docs) {
	 	console.log(docs);
	 	console.log("All Planets");
	 	res.json(docs);
	});

});


app.get('/api/all', function(req, res) {


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
	// var coordinates = req.params('coordinates');

	PlanetModel.find(req.query, function(err, docs) {
	 	console.log("docs: ", docs);

	 	if(err || docs.length === 0) {

	 		res.sendStatus(404);

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


app.get('/api/hyperspace', function(req, res) {

	HyperLaneModel.find({}, function(err, result) {

		console.log("Total Hyperlanes in Database: ", result.length);
		res.json(result);

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

  res.send(TILES);

});


app.listen(serverPort, ip.address(), function () {

	console.log('Example app listening on port http://' + ip.address() + ':' +  serverPort + '!');

});

