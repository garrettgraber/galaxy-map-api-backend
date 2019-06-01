const request = require('request');
const rp = require('request-promise');
const _ = require('lodash');
const Geohash = require('latlon-geohash');
const DatabaseLinks = require('docker-links').parseLinks(process.env);
const L = require('leaflet-headless');
L.GeometryUtil = require('leaflet-geometryutil');

const map = L.map(document.createElement('div')).setView([0, 0], 2);
map.setSize(1000, 1000);

console.log("L.GeometryUtil: ", L.GeometryUtil);

const MongoController = require('../controllers/mongo-async-controller.js');
const HyperSpacePseudoNode = require('../data-classes/hyperSpacePseudoNode.js');


const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

if(DatabaseLinks.hasOwnProperty('navcom') && isDeveloping) {
	var NAVCOM = 'http://' + DatabaseLinks.navcom.hostname + ':' + DatabaseLinks.navcom.port;
} else if (isProduction) {
	var NAVCOM = 'http://172.31.66.51:80';
}

class HyperSpaceNodeRouterService {
  constructor() {
  	this.allNodesPath = '/api/hyperspacenode/';
  	this.closetNodePath = '/api/hyperspacenode/closet';
  	this.searchNodesPath = '/api/hyperspacenode/search';
  	this.closetNodeToSystemPath = '/api/hyperspacenode/closet-to-system';
  	this.placesAreConnectedPath = '/api/hyperspacenode/places-connected';
  	this.connectedToCoruscantPath = '/api/hyperspacenode/connected-to-coruscant';
  	this.connectedToCsillaPath = '/api/hyperspacenode/connected-to-csilla';
  	this.systemsConnectedQueryPath = '/api/hyperspacenode/systems-connected-query';
  	this.systemsUnConnectedQueryPath = '/api/hyperspacenode/systems-un-connected-query';
  	this.pointConnectedToCoruscantPath = '/api/hyperspacenode/point-connected-to-coruscant';
  	this.pointConnectedToCsillaPath = '/api/hyperspacenode/point-connected-to-csilla';
  	this.findNearestNodeOfPointOrSystemPath = '/api/hyperspacenode/nearest-node-to-point';
  	this.nearestHyperspaceNodePseudoPointPath = '/api/hyperspacenode/nearest-pseudo-node'

  	console.log("Hyperspace Node Service Loading...");
  }

	nearestHyperspaceNodePseudoPoint(req, res, next) {
		const lat = req.query.lat;
		const lng = req.query.lng;

		findNearestPseudoNode(req.query).then(PseudoNode => {

			if(PseudoNode) {
				res.json(PseudoNode);
			} else {
				res.sendStatus(404);
			}

		});
	}

	allNodes(req, res, next) {
		MongoController.getAllHyperspaceNodes().then(docs => {
			console.log("Total Hyperspace Nodes in Database: ", docs.length);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	searchNodes(req, res, next) {
		console.log("Search for Hyperspace Nodes: ", req.query);
		if(req.query.hasOwnProperty('nodeId')) {
			req.query.nodeId = parseInt(req.query.nodeId);
		}
		MongoController.findHyperspaceNodeOfPlanetAsync(req.query).then(docs => {
		 	console.log("hyperspace nodes found: ", docs);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	closetNode(req, res, next) {
		MongoController.findNearestHyperspaceNodes(req.query.lat, req.query.lng).then(docs => {
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	closetNodeToSystem(req, res, next) {
		MongoController.closetNodeToSystem(req.query).then(docs => {
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	findNearestNodeOfPointOrSystem(req, res, next) {
		MongoController.findNearestNodeOfPointOrSystem(req.query).then(docs => {
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	connectedToCoruscant(req, res, next) {
		MongoController.closetNodeToSystem(req.query).then(docs => {
			const NearestNode = docs[0];
			console.log("Closet Node to system: ", NearestNode);
			console.log("Connected to Coruscant: ", req.query);
			const NodeData = {
				system: req.query.system,
				nodeSystem: NearestNode.system,
				nodeId: NearestNode.nodeId
			};

			console.log("NodeData: ", NodeData);
			const options = {
			  method: 'post',
			  body: NodeData,
			  json: true,
			  url: NAVCOM + '/hyperspace-connection/coruscant'
			}
			request(options, function (error, response, body) {
				if(error) {
					console.log("error getting getting coruscant connection: ", error);
					res.sendStatus(500);
				} else {
					console.log("Point connected to Coruscant: ", body);
					res.json(body);
				}
			});  
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	connectedToCsilla(req, res, next) {
		MongoController.closetNodeToSystem(req.query).then(docs => {
			const NearestNode = docs[0];
			console.log("Closet Node to system: ", NearestNode);
			console.log("Connected to Csilla: ", req.query);
			const NodeData = {
				system: req.query.system,
				nodeSystem: NearestNode.system,
				nodeId: NearestNode.nodeId
			};

			console.log("NodeData: ", NodeData);
			const options = {
			  method: 'post',
			  body: NodeData,
			  json: true,
			  url: NAVCOM + '/hyperspace-connection/csilla'
			}
			request(options, function (error, response, body) {
				if(error) {
					console.log("error getting getting coruscant connection: ", error);
					res.sendStatus(500);
				} else {
					console.log("Point connected to Csilla: ", body);
					res.json(body);
				}
			});  
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	systemsConnectedQuery(req, res, next) {
		systemsConnected(req.query.systems).then(docs => {
			console.log("connected docs: ", docs);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	systemsUnConnectedQuery(req, res, next) {
		systemsUnConnected(req.query.systems).then(docs => {
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	pointConnectedToCoruscant(req, res, next) {
		locationConnectedToCoruscantAsync(req.query).then(docs => {
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	pointConnectedToCsilla(req, res, next) {
		locationConnectedToCsillaAsync(req.query).then(docs => {
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	placesAreConnected(req, res, next) {
		console.log("\nPlaces are connected query: ", req.body);

		if(locationsEqualCheck(req.body)) {
			console.log("Places are the same");
			res.json({connected: true});
		} else {
			placesAreConnected(req.body).then(docs => {
				res.json(docs);
			}).catch(err => {
				res.sendStatus(404);
			});
		}
	}
};





async function findNearestPseudoNode(NodeSearch) {

	try {

		const NodeFound = await MongoController.findOneHyperspaceNodeAsync(NodeSearch);

		if(NodeFound) {

			// return {
		 //    lng: NodeFound.lng,
		 //    lat: NodeFound.lat,
		 //    hyperspaceLanes: NodeFound.hyperspaceLanes,
		 //    nodeId: NodeFound.nodeId,
		 //    system: NodeFound.system,
		 //    xGalacticLong: NodeFound.xGalactic,
		 //    yGalacticLong: NodeFound.yGalacticLong,
		 //    xGalactic: NodeFound.xGalactic,
		 //    yGalactic: NodeFound.yGalactic,
		 //    zoom: NodeFound.zoom,
		 //    emptySpace: NodeFound.emptySpace
			// }

			return NodeFound;
		}

		const NodeSearchData = await nodeSearchOrLatLng(NodeSearch);

		console.log("NodeSearchData: ", NodeSearchData);

		const lat = NodeSearchData.lat;
		const lng = NodeSearchData.lng;

		const docs = await MongoController.getAllHyperspaceLanes();
		console.log("Total Hyper Lanes in Database: ", docs.length);

		const lanesCoordinatesArray = [];
		for(let lane of docs) {
			const currentlaneCoordinates = reverseCoordinatesLatLng(lane.coordinates);
			lanesCoordinatesArray.push(currentlaneCoordinates);
		}

		console.log("lanesCoordinatesArray length: ", lanesCoordinatesArray.length);

		const ClosestPseudoNode = L.GeometryUtil.closest(map, lanesCoordinatesArray, [lat, lng]);

		const NearestNodeFound = await MongoController.findNearestNodeOfPointOrSystem({
			lat: ClosestPseudoNode.lat,
			lng: ClosestPseudoNode.lng
		});

		console.log("Closest Pseudo Node: ", ClosestPseudoNode);
		console.log("Nearest Node Found: ", NearestNodeFound.loc);
		console.log("NearestNodeFound: ", NearestNodeFound);

		const closestPseudoNodeLongitude = parseFloat(ClosestPseudoNode.lng.toFixed(6));
		const closestPseudoNodeLatitude = parseFloat(ClosestPseudoNode.lat.toFixed(6));

		const nearestNodeLongitude = parseFloat(NearestNodeFound.lng.toFixed(6));
		const nearestNodeLatitude = parseFloat(NearestNodeFound.lat.toFixed(6));



		const nearestNodeInLongitude = closestPseudoNodeLongitude + 0.5 > nearestNodeLongitude && closestPseudoNodeLongitude - 0.5 < nearestNodeLongitude;


		const nearestNodeInLatitude = closestPseudoNodeLatitude + 0.5 > nearestNodeLatitude && closestPseudoNodeLatitude - 0.5 < nearestNodeLatitude;




		if(nearestNodeInLongitude && nearestNodeInLatitude) {
			return NearestNodeFound;
		}


		const pseudoNodeXGalactic = getGalacticXFromLongitude(ClosestPseudoNode.lng);
		const pseudoNodeYGalactic = getGalacticYFromLatitude(ClosestPseudoNode.lat);

		const closestLane = L.GeometryUtil.closestLayer(map, lanesCoordinatesArray, [lat, lng]);

		console.log("Closest Lane: ", closestLane);

		console.log("Pseudo Node X Galactic: ", pseudoNodeXGalactic);
		console.log("Pseudo Node Y Galactic: ", pseudoNodeYGalactic);

		const closestLaneCoordinates = closestLane.layer;

		const segementsCoordinates = getCoordinatesSegementsArray(closestLaneCoordinates);

		const pseudoNodeLatEightFigures = numberToEightSignificantFigures(ClosestPseudoNode.lat);
		const pseudoNodeLngEightFigures = numberToEightSignificantFigures(ClosestPseudoNode.lng);

		const pseudoNodeIndex = checkIfPseudoNodeIsCoordinate(ClosestPseudoNode, closestLaneCoordinates);
		console.log("pseudoNodeIndex: ", pseudoNodeIndex);

		const closestTwoSegementOfLane = L.GeometryUtil.closestLayer(map, segementsCoordinates, [pseudoNodeLatEightFigures, pseudoNodeLngEightFigures]);

		console.log("closestTwoSegementOfLane: ", closestTwoSegementOfLane);

		const cutCoordinate = closestTwoSegementOfLane.layer[0];

		const indexToCutCoordinatesAt = getIndexOfCoordinate(cutCoordinate, closestLaneCoordinates);
		console.log("indexToCutCoordinatesAt: ", indexToCutCoordinatesAt);

		const laneStartLatLng = closestLaneCoordinates[0];
		const laneEndLatLng = closestLaneCoordinates[closestLaneCoordinates.length - 1];

		console.log("Lane Start: ", laneStartLatLng);
		console.log("Lane End: ", laneEndLatLng);

		const LaneData = await MongoController.findHyperspaceLaneByPoints(laneStartLatLng, laneEndLatLng);
		const LaneDataReversed = await MongoController.findHyperspaceLaneByPoints(laneEndLatLng, laneStartLatLng);
		console.log("Lane Data: ", LaneData);
		console.log("Lane Data Reversed: ", LaneDataReversed);


		const startGeoHash = Geohash.encode(laneStartLatLng[0], laneStartLatLng[1], 22);
		const endGeoHash = Geohash.encode(laneEndLatLng[0], laneEndLatLng[1], 22);
		const pseudoNodeGeoHash = Geohash.encode(ClosestPseudoNode.lat, ClosestPseudoNode.lng, 22);

		const startLat = laneStartLatLng[0];
		const startLng = laneStartLatLng[1];
		const endLat = laneEndLatLng[0];
		const endLng = laneEndLatLng[1];

		const StartNodeData = await MongoController.findOneHyperspaceNodeAsync({
			lat: startLat,
			lng: startLng
		});

		console.log("StartNodeData: ", StartNodeData);

		const startNodeId = StartNodeData.nodeId;

		const EndNodeData = await MongoController.findOneHyperspaceNodeAsync({
			lat: endLat,
			lng: endLng
		});

		console.log("EndNodeData: ", EndNodeData);

		const endNodeId = EndNodeData.nodeId;
		const usedIndexToCut = (pseudoNodeIndex !== null)? pseudoNodeIndex : indexToCutCoordinatesAt;

		const pseudoNodeId = 'PN-' + startNodeId + '-' + endNodeId + '-' + pseudoNodeGeoHash + '-' + usedIndexToCut + '-' + LaneData.laneId;


		const PseudoNodeFound = new HyperSpacePseudoNode({
			lat: ClosestPseudoNode.lat,
			lng: ClosestPseudoNode.lng,
			hyperspaceLanes: [LaneData.name],
			xGalactic: pseudoNodeXGalactic,
			yGalactic: pseudoNodeYGalactic,
			xGalacticLong: pseudoNodeXGalactic,
			yGalacticLong: pseudoNodeYGalactic,
			zoom: 5,
			emptySpace: true,
			system: pseudoNodeId,
			nodeId: pseudoNodeId
		});

		return PseudoNodeFound;

	} catch(err) {
		console.log("error: ", err);
		throw new Error(err);
	}
};


function closetIndexByCoordinateSegment(Optioins) {

	 	const closestLane = Options.closestLane;
	 	const ClosestPseudoNode = Options.ClosestPseudoNode;
	 	const map = Options.map;

		const closestLaneCoordinates = closestLane.layer;

		const segementsCoordinates = getCoordinatesSegementsArray(closestLaneCoordinates);

		const pseudoNodeLatEightFigures = numberToEightSignificantFigures(ClosestPseudoNode.lat);
		const pseudoNodeLngEightFigures = numberToEightSignificantFigures(ClosestPseudoNode.lng);

		const closestTwoSegementOfLane = L.GeometryUtil.closestLayer(map, segementsCoordinates, [pseudoNodeLatEightFigures, pseudoNodeLngEightFigures]);

		console.log("closestTwoSegementOfLane: ", closestTwoSegementOfLane);

		const cutCoordinate = closestTwoSegementOfLane.layer[0];
		return cutCoordinate;
}


function checkIfPseudoNodeIsCoordinate(PseduoNodeLoction, coordinatesArray) {
	const pseudoNodeLatitude = numberToEightSignificantFigures(PseduoNodeLoction.lat);
	const pseudoNodeLongitude = numberToEightSignificantFigures(PseduoNodeLoction.lng);

	for(let i=0; i < coordinatesArray.length; i++) {
		const currentCoordinate = coordinatesArray[i];
		const currentLatitude = currentCoordinate[0];
		const currentLongitude = currentCoordinate[1];
		const pseudoNodeLatitudeMatchesCoordinate = currentLatitude === pseudoNodeLatitude;
		const pseudoNodeLongitudeMatchesCoordinate = currentLongitude === pseudoNodeLongitude;
		if(pseudoNodeLongitudeMatchesCoordinate && pseudoNodeLatitudeMatchesCoordinate) {
			// return i - 1;
			return i + 1;
		}
	}
	return null;
}


function numberToEightSignificantFigures(floatingCoordinate) {
	const precisionValue = (floatingCoordinate >= 100.0)? 9 : 8;
	return parseFloat(Number.parseFloat(floatingCoordinate).toPrecision(precisionValue));
};

function getIndexOfCoordinate(coordinate, lanesCoordinatesArray) {
	for(let i=0; i < lanesCoordinatesArray.length; i++) {
		const currentCoordinate = lanesCoordinatesArray[i];
		if(currentCoordinate[0] === coordinate[0] && currentCoordinate[1] === coordinate[1]) {
			return i + 1;
		}
	}
}


function getCoordinatesSegementsArray(lanesCoordinatesArray) {
	const segementsArrays = [];
	for(let i=0; i < lanesCoordinatesArray.length - 1; i++) {
		const currentCoordinates = lanesCoordinatesArray[i];
		const nextCoordinates = lanesCoordinatesArray[i + 1];
		segementsArrays.push([ currentCoordinates, nextCoordinates ]);
	}
	return segementsArrays;
}


async function nodeSearchOrLatLng(NodeSearch) {
	try {

		if(NodeSearch.hasOwnProperty('lat') && NodeSearch.hasOwnProperty('lng')) {
			console.log("has lat and lng");
			return NodeSearch;
		} else if(NodeSearch.hasOwnProperty('system')) {

			const SystemFound = await MongoController.findOnePlanet(NodeSearch);

			console.log("System Found: ", SystemFound);


			if(SystemFound.status) {
				return SystemFound.doc;
			} else {
				return null;
			}

		} else {
			console.log("NodeSearch: ", NodeSearch);
			return NodeSearch;
		}

	} catch(err) {
		console.log("error: ", error);
		throw new Error(err);
	}
};



function reverseCoordinatesLatLng(coordinatesArray) {
  return _.map(coordinatesArray, (coordinate) => {
    return coordinate.slice().reverse();
  });
};


function locationsEqualCheck(locationsArray) {
	if(allLocationsPoints(locationsArray)) {
		return pointsEqual(locationsArray);
	} else if(allLocationsSystems(locationsArray)) {
		return systemsEqual(locationsArray);
	} else {
		return false;
	}
}

function pointsEqual(pointsArray) {
  const StartingPoint = pointsArray[0];
  for(let i=1;i < pointsArray.length;i++) {
    const CurrentPoint = pointsArray[i];
    const latitudeMisMatch = CurrentPoint.lat !== StartingPoint.lat;
    const longitudeMisMatch = CurrentPoint.lng !== StartingPoint.lng;
    if(latitudeMisMatch || longitudeMisMatch) {
      return false;
    }
  }
  return true;
}

function systemsEqual(systemsArray) {
  const StartingSystem = systemsArray[0];
  for(let i=1;i < systemsArray.length;i++) {
    const CurrentSystem = systemsArray[i];
    if(StartingSystem.system !== CurrentSystem.system) {
      return false;
    }
  }
  return true;
}

function allLocationsPoints(locationsArray) {
  for(let CurrentLocation of locationsArray) {
    if(!_.has(CurrentLocation, 'lat') || !_.has(CurrentLocation, 'lng')) {
      return false;
    }
  }
  return true;
}

function allLocationsSystems(locationsArray) {
  for(let CurrentLocation of locationsArray) {
    if(!_.has(CurrentLocation, 'system')) {
      return false;
    }
  }
  return true;
}



async function placesAreConnected(PlacesToCompare) {
	try {
		const placesConnectedToCoruscant = await placesConnectedToCoruscantCheck(PlacesToCompare);
		const placesConnectedToCsilla = await placesConnectedToCsillaCheck(PlacesToCompare);
		const placesConnectedStatus = (placesConnectedToCoruscant || placesConnectedToCsilla)? true : false;
		return {
			connected: placesConnectedStatus
		};
	} catch(err) {
		console.log("error: ", error);
		throw new Error(err);
	}
}

async function placesConnectedToCoruscantCheck(PlacesToCompare) {
	try {
		const placeAConnectedToCoruscant = await placeConnectedToCoruscantAsync(PlacesToCompare[0]);
		const placeBConnectedToCoruscant = await placeConnectedToCoruscantAsync(PlacesToCompare[1]);
		console.log('Place A Coruscant: ', placeAConnectedToCoruscant);
		console.log('Place B Coruscant: ', placeBConnectedToCoruscant);
		return placeAConnectedToCoruscant && placeBConnectedToCoruscant;
	} catch(err) {
		console.log("error: ", error);
		throw new Error(err);	
	}
}

async function placesConnectedToCsillaCheck(PlacesToCompare) {
	try {
		const placeAConnectedToCsilla = await placeConnectedToCsillaAsync(PlacesToCompare[0]);
		const placeBConnectedToCsilla = await placeConnectedToCsillaAsync(PlacesToCompare[1]);
		console.log('Place A Csilla: ', placeAConnectedToCsilla);
		console.log('Place B Csilla: ', placeBConnectedToCsilla);
		return placeAConnectedToCsilla && placeBConnectedToCsilla;
	} catch(err) {
		console.log("error: ", error);
		throw new Error(err);	
	}
}

async function placeConnectedToCoruscantAsync(CurrentPlace) {
	try {
		const NearestNode = await MongoController.findNearestNodeOfPointOrSystem(CurrentPlace);
		console.log("Nearest Node: ", NearestNode);
		const NodeData = {
			system: NearestNode.system,
			nodeSystem: NearestNode.system,
			nodeId: NearestNode.nodeId
		};
		const options = {
		  method: 'post',
		  body: NodeData,
		  json: true,
		  url: NAVCOM + '/hyperspace-connection/coruscant'
		};
		const connectionStatus = await rp(options);
		return connectionStatus;
	} catch(err) {
		return false;
	}
}

async function placeConnectedToCsillaAsync(CurrentPlace) {
	try {
		const NearestNode = await MongoController.findNearestNodeOfPointOrSystem(CurrentPlace);
		console.log("Nearest Node: ", NearestNode);
		const NodeData = {
			system: NearestNode.system,
			nodeSystem: NearestNode.system,
			nodeId: NearestNode.nodeId
		};
		const options = {
		  method: 'post',
		  body: NodeData,
		  json: true,
		  url: NAVCOM + '/hyperspace-connection/csilla'
		};
		const connectionStatus = await rp(options);
		return connectionStatus;
	} catch(err) {
		return false;
	}
}







async function locationConnectedToCsillaAsync(LatLngLocation) {
	try {

		const NodeDataFound = await MongoController.findNearestHyperspaceNodes(LatLngLocation.lat, LatLngLocation.lng);

		const systemName = 'Empty Space'; 

		const NearestNode = NodeDataFound[0];
		console.log("Closet Node to system: ", NodeDataFound);
		console.log("Connected to Csilla: ", systemName);
		const NodeData = {
			system: systemName,
			nodeSystem: NearestNode.system,
			nodeId: NearestNode.nodeId
		};

		console.log("NodeData: ", NodeData);
		const options = {
		  method: 'post',
		  body: NodeData,
		  json: true,
		  url: NAVCOM + '/hyperspace-connection/csilla'
		}

		const connectionStatus = await rp(options);
		console.log("Point connected to Csilla: ", connectionStatus);
		return connectionStatus;
	} catch(err) {
		return false;
	}
}

async function locationConnectedToCoruscantAsync(LatLngLocation) {
	try {

		const NodeDataFound = await MongoController.findNearestHyperspaceNodes(LatLngLocation.lat, LatLngLocation.lng);

		const systemName = 'Empty Space'; 

		const NearestNode = NodeDataFound[0];
		console.log("Closet Node to system: ", NodeDataFound);
		console.log("Connected to Coruscant: ", systemName);
		const NodeData = {
			system: systemName,
			nodeSystem: NearestNode.system,
			nodeId: NearestNode.nodeId
		};

		console.log("NodeData: ", NodeData);
		const options = {
		  method: 'post',
		  body: NodeData,
		  json: true,
		  url: NAVCOM + '/hyperspace-connection/coruscant'
		}

		const connectionStatus = await rp(options);
		console.log("Point connected to Coruscant: ", connectionStatus);
		return connectionStatus;
	} catch(err) {
		return false;
	}
}

async function connectedToCoruscantAsync(systemName) {
	try {
		const NodeDataFound = await MongoController.closetNodeToSystem({system: systemName});
		const NearestNode = NodeDataFound[0];
		console.log("Closet Node to system: ", NodeDataFound);
		console.log("Connected to Coruscant: ", systemName);
		const NodeData = {
			system: systemName,
			nodeSystem: NearestNode.system,
			nodeId: NearestNode.nodeId
		};

		console.log("NodeData: ", NodeData);
		const options = {
		  method: 'post',
		  body: NodeData,
		  json: true,
		  url: NAVCOM + '/hyperspace-connection/coruscant'
		}

		const connectionStatus = await rp(options);
		console.log("Point connected to Coruscant: ", connectionStatus);
		return connectionStatus;
	} catch(err) {
		return false;
	}
}

async function connectedToCsillaAsync(systemName) {
	try {
		const NodeDataFound = await MongoController.closetNodeToSystem({system: systemName});
		const NearestNode = NodeDataFound[0];
		console.log("Closet Node to system: ", NodeDataFound);
		console.log("Connected to Csilla: ", systemName);
		const NodeData = {
			system: systemName,
			nodeSystem: NearestNode.system,
			nodeId: NearestNode.nodeId
		};

		console.log("NodeData: ", NodeData);
		const options = {
		  method: 'post',
		  body: NodeData,
		  json: true,
		  url: NAVCOM + '/hyperspace-connection/csilla'
		}

		const connectionStatus = await rp(options);
		console.log("Point connected to Csilla: ", connectionStatus);
		return connectionStatus;
	} catch(err) {
		return false;
	}
}

async function systemsConnected(systems) {
	try {
		const systemA = systems[0];
		const systemB = systems[1];

		const systemAConnectedToCoruscant = await connectedToCoruscantAsync(systemA);
		const systemBConnectedToCoruscant = await connectedToCoruscantAsync(systemB);
		const systemAConnectedToCsilla = await connectedToCsillaAsync(systemA);
		const systemBConnectedToCsilla = await connectedToCsillaAsync(systemB);

		console.log('System A Coruscant: ', systemAConnectedToCoruscant);
		console.log('System B Coruscant: ', systemBConnectedToCoruscant);

		console.log('System A Csilla: ', systemAConnectedToCsilla);
		console.log('System B Csilla: ', systemBConnectedToCsilla);

		const systemsConnectedToCoruscant = systemAConnectedToCoruscant && systemBConnectedToCoruscant;
		const systemsConnectedToCsilla = systemAConnectedToCsilla && systemBConnectedToCsilla;
		const systemsConnectedStatus = (systemsConnectedToCoruscant || systemsConnectedToCsilla)? true : false;

		return {
			connected: systemsConnectedStatus
		};
	} catch(err) {
		throw new Error(err);
	}
}

async function systemsUnConnected(systems) {
	try {
		const systemA = systems[0];
		const systemB = systems[1];

		const systemAConnectedToCoruscant = await connectedToCoruscantAsync(systemA);
		const systemBConnectedToCoruscant = await connectedToCoruscantAsync(systemB);
		const systemAConnectedToCsilla = await connectedToCsillaAsync(systemA);
		const systemBConnectedToCsilla = await connectedToCsillaAsync(systemB);

		console.log('System A Coruscant: ', systemAConnectedToCoruscant);
		console.log('System B Coruscant: ', systemBConnectedToCoruscant);

		console.log('System A Csilla: ', systemAConnectedToCsilla);
		console.log('System B Csilla: ', systemBConnectedToCsilla);

		const systemAToCoruscantSystemBToCsilla = systemAConnectedToCoruscant && systemBConnectedToCsilla;
		const systemAToCsillaSystemBToCoruscant = systemAConnectedToCsilla && systemBConnectedToCoruscant;
		return (systemAToCoruscantSystemBToCsilla || systemAToCsillaSystemBToCoruscant)? true : false;
	} catch(err) {
		throw new Error(err);
	}
}



function getGalacticYFromLatitude(latitude) {
  return  (-3.07e-19*(latitude**12)) + (-1.823e-18*(latitude**11)) + (4.871543e-15*(latitude**10)) + (4.1565807e-14*(latitude**9)) + (-2.900986202e-11 * (latitude**8)) + (-1.40444283864e-10*(latitude**7)) + (7.9614373223054e-8*(latitude**6)) + (7.32976568692443e-7*(latitude**5)) + (-0.00009825374539548058*(latitude**4)) + (0.005511093818675318*(latitude**3)) + (0.04346753629461727 * (latitude**2)) + (111.30155374684914 * latitude);
}

function getGalacticXFromLongitude(longitude) {
  return (111.3194866138503 * longitude);
}




module.exports = new HyperSpaceNodeRouterService();