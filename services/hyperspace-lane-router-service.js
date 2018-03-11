const _ = require('lodash');

const MongoController = require('../controllers/mongo-async-controller.js');
const HyperspaceRoute = require('../data-classes/classes.js').HyperspaceRoute;


class HyperSpaceLaneRouterService {
  constructor() {
  	this.allLanesPath = '/api/hyperspacelane/';
  	this.searchLanesPath = '/api/hyperspacelane/search';
  	this.allLaneNamesPath = '/api/hyperspacelane/names';
  	this.searchAndBuildRoutePath = '/api/hyperspacelane/build-route';
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

	allLaneNames(req, res, next) {
		console.log("Hyperspace Lanes Search: ", req.query);
		MongoController.getHyperspaceLanesNames().then(docs => {
			if(docs.length === 0) {
				res.sendStatus(404);
			} else {

				const allLanesArrayForDropdown = _.map(docs, doc => {
					return {
						value: doc,
						label: doc
					}
				});

				console.log("allLanesArrayForDropdown: ", allLanesArrayForDropdown);

				res.json(allLanesArrayForDropdown);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	searchAndBuildRoute(req, res, next) {
		console.log("Hyperspace Lanes Search and build: ", req.query);
		MongoController.searchHyperspaceLanes(req.query).then(docs => {
			if(docs.length === 0) {
				res.sendStatus(404);
			} else {
				const Route = new HyperspaceRoute({lanes: docs});
				const coordinateArray = Route.buildCoordinatesArray();
				res.json({
					name: Route.name,
					link: Route.link,
					coordinates: coordinateArray
				});
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}
};


module.exports = new HyperSpaceLaneRouterService();