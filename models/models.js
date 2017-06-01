
const mongoose = require('mongoose');
const DatabaseLinks = require('docker-links').parseLinks(process.env);



console.log("DatabaseLinks: ", DatabaseLinks);




mongoose.connect('mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port);

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
	console.error.bind(console, 'connection error:');
});
db.once('open', function() {
  	console.log("connected to mongo database ");
	PlanetModel.count({}, function(err, count) {

		console.log("Total Planets in Database: ", count);

	});
});
