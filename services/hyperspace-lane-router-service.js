const MongoController = require('../controllers/mongo-async-controller.js');

class HyperSpaceLaneRouterService {
  constructor() {
  	this.allLanesPath = '/api/hyperspacelane/';
  	this.searchLanesPath = '/api/hyperspacelane/search';
  	console.log("Hyperspace Lane Service Loading...");
  }

	allLanes(req, res, next) {
		MongoController.getAllHyperspaceLanes().then(docs => {
			console.log("Total Hyper Lanes in Database: ", docs.length);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(err);
		});
	}

	searchLanes(req, res, next) {
		console.log("Hyperspace Lanes Search: ", req.query);
		MongoController.searchHyperspaceLanes(req.query).then(docs => {
			if(docs.length === 0) {
				res.sendStatus(404);
			} else {
				res.json(docs);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}
};


module.exports = new HyperSpaceLaneRouterService();