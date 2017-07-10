const mongoose = require('mongoose');
const DatabaseLinks = require('docker-links').parseLinks(process.env);

console.log("DatabaseLinks: ", DatabaseLinks);

mongoose.connect('mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port);

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
module.exports.Planet = PlanetModel;

const HyperspaceNodeSchema = new Schema({
    system         : String,
    lng            : { type : Number , "default" : null },
    lat            : { type : Number , "default" : null },
    hyperspaceLanes: { type : Array , "default" : [] },
    nodeId         : { type : Number, "default" : null }
});
HyperspaceNodeSchema.set('autoIndex', true);
const HyperspaceNodeModel = mongoose.model('HyperspaceNodeModel', HyperspaceNodeSchema);
module.exports.HyperspaceNodeModel = HyperspaceNodeModel;

const CoordinateSchema = new Schema({
    coordinates: String,
});
CoordinateSchema.set('autoIndex', true);
const CoordinateModel = mongoose.model('CoordinateModel', CoordinateSchema);
module.exports.CoordinateModel = CoordinateModel;

const SectorSchema = new Schema({
    name: String,
});
SectorSchema.set('autoIndex', true);
const SectorModel = mongoose.model('SectorModel', SectorSchema);
module.exports.SectorModel = SectorModel;

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
    endNodeId: { type : Object, "default" : {} }
});
HyperLaneSchema.set('autoIndex', true);
const HyperLaneModel = mongoose.model('HyperLaneModel', HyperLaneSchema);
module.exports.HyperLaneModel = HyperLaneModel;

db.on('error', function(error) {
	console.error.bind(console, 'connection error:');
});
db.once('open', function() {
  	console.log("connected to mongo database ");
	PlanetModel.count({}, function(err, count) {
		console.log("Total Planets in Database: ", count);
	});
});

module.exports.db = db;