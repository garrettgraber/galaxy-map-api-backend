const MongoController = require('../controllers/mongo-async-controller.js');

class HyperSpaceNodeRouterService {
  constructor() {
  	this.allNodesPath = '/api/hyperspacenode/';
  	this.closetNodePath = '/api/hyperspacenode/closet';
  	this.searchNodesPath = '/api/hyperspacenode/search';
  	this.closetNodeToSystemPath = '/api/hyperspacenode/closet-to-system';
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
};


module.exports = new HyperSpaceNodeRouterService();