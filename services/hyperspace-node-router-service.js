const request = require('request');
const rp = require('request-promise');
const DatabaseLinks = require('docker-links').parseLinks(process.env);

const MongoController = require('../controllers/mongo-async-controller.js');

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

  	console.log("Hyperspace Node Service Loading...");
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
		placesAreConnected(req.body).then(docs => {
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

};



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


module.exports = new HyperSpaceNodeRouterService();