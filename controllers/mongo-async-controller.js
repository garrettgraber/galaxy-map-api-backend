const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;
const distance = require('euclidean-distance');
const DatabaseLinks = require('docker-links').parseLinks(process.env);
const Planet = require('../data-classes/classes.js').Planet;
const Point = require('../data-classes/classes.js').Point;
const Alphabets = require('../data-classes/alphabets.js');
const Schema = mongoose.Schema;

console.log("NODE_ENV: ", process.env.NODE_ENV);
const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';
console.log("isProduction: ", isProduction);


if(DatabaseLinks.hasOwnProperty('mongo') && isDeveloping) {
  var MONGO = 'mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port;
} else if (isProduction) {
	var MONGO = 'mongodb://172.31.79.220:27017/test';
} else {
	console.log("mongo failure!!!!");
}


function connectToDatabase(cb) {
	mongoose.connect(MONGO);
	const db = mongoose.connection;
	db.on('error', function(error) {
		console.log('connection error:', error);
		cb(error, {status: false, database:{}});
	});
	db.once('open', function() {
	  	console.log("connected to mongo database ");
	  	cb(null, {
	  		status: true,
	  		database: db,
	  	});
	});
};

const connectToMongo = Promise.promisify(connectToDatabase);

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
  zoom		   		 : Number,
  link           : String
});
PlanetSchema.set('autoIndex', true);
const PlanetModel = mongoose.model('PlanetModel', PlanetSchema);

const HyperspaceNodeSchema = new Schema({
  system         : String,
  lng            : { type : Number , "default" : null },
  lat            : { type : Number , "default" : null },
	xGalactic      : { type : Number , "default" : null },
	yGalactic      : { type : Number , "default" : null },
  yGalacticLong  : { type : Number , "default" : null },
  xGalacticLong  : { type : Number , "default" : null },
  hyperspaceLanes: { type : Array , "default" : [] },
  nodeId         : { type : Number, "default" : null },
  loc            : { type : Array, "default" : [] },
  geoHash        : String,
  zoom					 : Number,
  emptySpace     : Boolean
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
	coordinates: { type : Array , "default" : [] },
	link: { type : String , "default" : '' }
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
	],
	laneId: Number
});
HyperLaneSchema.set('autoIndex', true);
const HyperLaneModel = mongoose.model('HyperLaneModel', HyperLaneSchema);

const createHyperspaceNode = (HyperspaceNodeCurrent, cb) => {
	HyperspaceNodeModel.find({lat: HyperspaceNodeCurrent.lat, lng: HyperspaceNodeCurrent.lng}).exec()
		.then(hyperspaceNodeData => {
			if(hyperspaceNodeData.length == 0) {
				HyperspaceNodeModel.create(HyperspaceNodeCurrent)
					.then(hyperspaceNodeCreationResult => {
						cb(null, null);
					}).catch(errorCreatingNode => {
						console.log("error adding hyperspace node to database: ", errorCreatingNode);
						cb(error, null);
					});
			} else {
				const result = hyperspaceNodeData[0];
				const foundHyperspaceLane = HyperspaceNodeCurrent.hyperspaceLanes[0];
				let updatedHyperlanes = [];
				if(!result.hyperspaceLanes.includes(foundHyperspaceLane)) {
					updatedHyperlanes = HyperspaceNodeCurrent.hyperspaceLanes.concat(result.hyperspaceLanes);
					HyperspaceNodeModel.findOneAndUpdate({system: result.system}, {hyperspaceLanes: updatedHyperlanes}, {new: true}).exec().then(nodeAddedData => {
							console.log("Hyperspace Node has added hyperspace lane: ", nodeAddedData);
							cb(null, null);
					}).catch(errNodeAdd => {
							console.log("error adding node: ", errNodeAdd);
							cb(errNodeAdd, null);
					});
				} else {
					if(result.system !== HyperspaceNodeCurrent.system) {
						console.log("\nresult.system: ", result.system);
						console.log("HyperspaceNodeCurrent.system: ", HyperspaceNodeCurrent.system);
						cb(null, result.system);
					} else {
						cb(null, null);
					}
				}
			}
		}).catch(hyperspaceNodeError => {
			cb(err, null);
		});
};

const createHyperspaceNodeAsync = async (HyperspaceNodeCurrent) => {
	try {
		return await HyperspaceNodeModel.create(HyperspaceNodeCurrent);
	} catch(err) {
		// console.log("error creating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findHyperspaceNodeAndUpdate = async (SearchItem, UpdateItem) => {
	try {
		return await HyperspaceNodeModel.findOneAndUpdate(SearchItem, UpdateItem, {new: true}).exec();
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findHyperspaceLaneAndUpdateAsync = async (SearchItem, UpdateItem) => {
	try {
		return await HyperLaneModel.findOneAndUpdate(SearchItem, UpdateItem, {new: true}).exec();
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};


const findHyperspaceLaneByPoints = async (Point1, Point2) => {
	try {
		const firstPointLat = Point1[0];
		const firstPointLng = Point1[1];
		const secondPointLat = Point2[0];
		const secondPointLng = Point2[1];



		const FirstPointAsStart = await HyperLaneModel.findOne({
			startCoordsLngLat: [firstPointLng, firstPointLat],
			endCoordsLngLat: [secondPointLng, secondPointLat]
		}).exec();

		if(FirstPointAsStart) {
			return FirstPointAsStart;
		} else {
			const SecondPointAsStart = await HyperLaneModel.findOne({
				startCoordsLngLat: [secondPointLng, secondPointLat],
				endCoordsLngLat: [firstPointLng, firstPointLat]
			}).exec();
			if(SecondPointAsStart) {
				return SecondPointAsStart;
			} else {
				return null;
			}
		}
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findOneHyperspaceNodeAsync = async (SearchItem) => {
	try {
		return await HyperspaceNodeModel.findOne(SearchItem).exec();
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findNearestNodeOfPointOrSystem = async (SearchItem) => {
	try {
		const NodeFound = await HyperspaceNodeModel.findOne(SearchItem).exec();
		if(NodeFound !== null) {
			return NodeFound;
		} else {
			const PlanetFound = await PlanetModel.findOne(SearchItem).exec();
			const SearchData = (PlanetFound !== null)? PlanetFound : SearchItem;
			const nearestNodesArray = await findNearestHyperspaceNodes(SearchData.lat, SearchData.lng);
			const NearestNode = nearestNodesArray[0];
			return NearestNode;
		}
	} catch(err) {
		console.log("error finding nearest node of Point or System: ", err);
		throw new Error(400);
	}
};

const findNearestHyperspaceNodes = async (latQuery, lngQuery) => {
	try {
		const maxDistance = 100.0;
		const lng = parseFloat(lngQuery);
		const lat = parseFloat(latQuery);
		if(!isNaN(lat) && !isNaN(lng)) {
			const searchCoordinates = [lng, lat];
			const nearestNodes = await HyperspaceNodeModel.find({
	      loc: {
	        $near: searchCoordinates,
	        $maxDistance: maxDistance
	      }
	    })
	    .limit(30)
			.exec();

	  	const SearchPoint = new Point(lat, lng);
	  	const nodesSortedByDistance = SearchPoint.distanceBetweenPointAndNodes(nearestNodes);
	  	const NearestNode = nodesSortedByDistance[0];
	  	return [ NearestNode ];
		} else {
			return [];
		}
	} catch(err) {
		console.log("error finding the nearest hyperspace node: ", err);
		throw new Error(err);
	}
};

const closetNodeToSystem = async (SearchItem) => {
	try {
		const PlanetFound = await PlanetModel.findOne(SearchItem).exec();
		return await findNearestHyperspaceNodes(PlanetFound.lat, PlanetFound.lng);
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findHyperspaceNodeOfPlanetAsync = async (SearchItem) => {
	try {
		const NodeResults = await HyperspaceNodeModel.findOne(SearchItem).exec();
		if(NodeResults === null) {
			return [];
		} else {
			return [NodeResults];
		}
	} catch(err) {
		console.log("error finding hyperspace node: ", err);
		throw new Error(400);
	}
};

const findAllPlanets = async () => {
	try {
		const planetData = await PlanetModel.find({}).exec();
		if(planetData === null) {
			return {status: false, doc: null};
		} else {
			return {status: true, doc: planetData};
		}
	} catch(err) {
		console.log("error updating planet: ", err);
		throw new Error(400);
	}
};

const findAllPlanetsWithALocation = async () => {
	try {
		const planetData = await PlanetModel.find({hasLocation: true}).exec();
		if(planetData === null) {
			return {status: false, doc: null};
		} else {
			return {status: true, doc: planetData};
		}
	} catch(err) {
		console.log("error getting all planets with a location: ", err);
		throw new Error(400);
	}
};

const findAllPlanetsWithNoLocation = async () => {
	try {
		const planetData = await PlanetModel.find({hasLocation: false}).exec();
		console.log("planetData with no location: ", planetData.length);
		if(planetData === null) {
			return {status: false, doc: null};
		} else {
			return {status: true, doc: planetData};
		}
	} catch(err) {
		console.log("error getting all planets with a location: ", err);
		throw new Error(400);
	}
};

const findOnePlanet = async (SearchItem) => {
	try {
		const planetData = await PlanetModel.findOne(SearchItem).exec();
		if(planetData === null) {
			return {status: false, doc: null};
		} else {
			return {status: true, doc: planetData};
		}
	} catch(err) {
		console.log("error updating planet: ", err);
		throw new Error(400);
	}
};

const distanceBetweenPlanets = async (SearchItem) => {
	try {
		const PlanetAData = await findOnePlanet({system: SearchItem.planetA});
		const PlanetBData = await findOnePlanet({system: SearchItem.planetB});

		if(PlanetAData.status && PlanetBData.status) {
			const planetALocation = [PlanetAData.doc.xGalactic, PlanetAData.doc.yGalactic];
			const planetBLocation = [PlanetBData.doc.xGalactic, PlanetBData.doc.yGalactic];
			const distanceBetween = parseFloat(distance(planetALocation, planetBLocation).toFixed(2));
			return {
				status: true,
				distance: distanceBetween
			}
		} else {
			return {
				status: false,
				distance: null
			}
		}

	} catch(err) {
		console.log("error getting distance between planets: ", err);
		throw new Error(400);
	}
}

const emptyCollections = async () => {
	try {
		console.log("emptyCollections has fired..");
		const databasePromiseArray = [
			await PlanetModel.remove({}).exec(),
			await CoordinateModel.remove({}).exec(),
			await HyperLaneModel.remove({}).exec(),
			await SectorModel.remove({}).exec(),
			await HyperspaceNodeModel.remove({}).exec()
		];
		return await Promise.all(databasePromiseArray);
	} catch(err) {
	  console.log("error clearing all the collections: ", err);
	}
};

const getAllHyperspaceNodes = async () => {
	try {
		return await HyperspaceNodeModel.find({}).exec();
	} catch(err) {
		console.log("error getting all hyperspace nodes: ", err);
		throw new Error(err);
	}
};

const getAllPlanets = async () => {
	try {
		return await PlanetModel.find({}).exec();
	} catch(err) {
		console.log("error getting all planets: ", err);
	}
};

const findPlanetAndUpdate = async (SearchItem, UpdateItem) => {
	try {
		return await PlanetModel.findOneAndUpdate(SearchItem, UpdateItem, {new: true}).exec();
	} catch(err) {
		console.log("error updating planet: ", SearchItem.system);
		console.log("error: ", err);
	}
};

const createHyperspaceLane = async (HyperSpaceLaneCurrent) => {
	try {
		return await HyperLaneModel.create(HyperSpaceLaneCurrent);
	} catch(err) {
		console.log("error uploading hyperspace: ", err);
	}
};

const searchHyperspaceLanes = async (HyperSpaceLaneSearchOptions) => {
	try {
		return await HyperLaneModel.find(HyperSpaceLaneSearchOptions).exec();
	} catch(err) {
		console.log("error finding hyperspace lane: ", err);
	}
};

const getAllHyperspaceLanes = async () => {
	try {
		return await HyperLaneModel.find({}).exec();
	} catch(err) {
		console.log("error getting all hyperspace lanes: ", err);
	}
};

const getHyperspaceLanesNames = async () => {
	try {
		return await HyperLaneModel.find().distinct('name').exec();
	} catch(err) {
		console.log("error getting all hyperspace lane names: ", err);
	}
};

const totalHyperspaceNodes = async () => {
	try {
		return await HyperspaceNodeModel.count({}).exec();
	} catch(err) {
		console.log("error getting total hyperspace nodes: ", err);
	}
};

const totalPlanets = async () => {
	try {
		return await PlanetModel.count({}).exec();
	} catch(err) {
		console.log("error getting total planets: ", err);
	}
};

const totalPlanetsHasLocation = async () => {
	try {
		return await PlanetModel.count({hasLocation: true}).exec();
	} catch(err) {
		console.log("error getting total planets with a location: ", err);
	}
};

const createPlanet = async (PlanetCurrent) => {
	try {
		return await PlanetModel.create(PlanetCurrent);
	} catch(err) {
		console.log("error adding planet to database: ", err);
	}
};

const totalHyperspaceLanes = async () => {
	try {
		return await HyperLaneModel.count({}).exec();
	} catch(err) {
		console.log("error getting total hyperspace lanes: ", err);
	}
};

const createSector = async (sector) => {
	try {
		return await SectorModel.create({name: sector});
	} catch(err) {
		console.log("error adding sector to database: ", err);
	}
};

const totalSectors = async () => {
	try {
		return await SectorModel.count({}).exec();
	} catch(err) {
		console.log("error getting total sectors from the database: ", err);
	}
};

const allSectors = async () => {
	try {
		return await SectorModel.find({}).exec();
	} catch(err) {
		throw new Error(404);
	}
};

const allSectorsWithLinks = async () => {
	try {
		return await SectorModel.find({ link: { $ne: "" } }).exec();
	} catch(err) {
		throw new Error(404);
	}
};

const findSector = async (SearchItem) => {
	try {
		return await SectorModel.find(SearchItem).exec();
	} catch(err) {
		throw new Error(404);
	}
};

const createCoordinate = async (coordinateValue) => {
	try {
		return await CoordinateModel.create({coordinates: coordinateValue});
	} catch(err) {
		console.log("error adding coordinates to database: ", err);
	}
};

const totalCoordinates = async () => {
	try {
		return await CoordinateModel.count({}).exec();
	} catch(err) {
		console.log("error getting total coordinates: ", err);
	}
};

const searchCoordinate = async (currentCoordinates) => {
	try {
		return await PlanetModel.find({coordinates: currentCoordinates}).exec();
	} catch(err) {
		console.log("error searching coordinates: ", err);
	}
};

const allPopulatedCoordinates = async () => {
	try {
		return await CoordinateModel.find({}).exec();
	} catch(err) {
		throw new Error(404);
	}
};


module.exports = {
	connectToDatabase: connectToDatabase,
	connectToMongo: connectToMongo,
	createHyperspaceNode: createHyperspaceNode,
	createHyperspaceNodeAsync: createHyperspaceNodeAsync,
	totalHyperspaceNodes: totalHyperspaceNodes,
	findHyperspaceNodeAndUpdate: findHyperspaceNodeAndUpdate,
	findOneHyperspaceNodeAsync: findOneHyperspaceNodeAsync,
	findHyperspaceNodeOfPlanetAsync: findHyperspaceNodeOfPlanetAsync,
	closetNodeToSystem: closetNodeToSystem,
	emptyCollections: emptyCollections,
	totalPlanets: totalPlanets,
	totalCoordinates: totalCoordinates,
	totalSectors: totalSectors,
	allPopulatedCoordinates: allPopulatedCoordinates,
	allSectors: allSectors,
	allSectorsWithLinks: allSectorsWithLinks,
	getAllPlanets: getAllPlanets,
	getAllHyperspaceNodes: getAllHyperspaceNodes,
	searchCoordinate: searchCoordinate,
	searchHyperspaceLanes: searchHyperspaceLanes,
	findPlanetAndUpdate: findPlanetAndUpdate,
	findOnePlanet: findOnePlanet,
	distanceBetweenPlanets: distanceBetweenPlanets,
	findAllPlanets: findAllPlanets,
	findAllPlanetsWithALocation: findAllPlanetsWithALocation,
	findAllPlanetsWithNoLocation: findAllPlanetsWithNoLocation,
	totalPlanetsHasLocation: totalPlanetsHasLocation,
	createPlanet: createPlanet,
	createHyperspaceLane: createHyperspaceLane,
	totalHyperspaceLanes: totalHyperspaceLanes,
	getAllHyperspaceLanes: getAllHyperspaceLanes,
	getHyperspaceLanesNames: getHyperspaceLanesNames,
	createSector: createSector,
	createCoordinate: createCoordinate,
	findHyperspaceLaneAndUpdateAsync: findHyperspaceLaneAndUpdateAsync,
	findHyperspaceLaneByPoints: findHyperspaceLaneByPoints,
	findNearestHyperspaceNodes: findNearestHyperspaceNodes,
	findNearestNodeOfPointOrSystem: findNearestNodeOfPointOrSystem,
	findSector: findSector
};

