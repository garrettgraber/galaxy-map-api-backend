const _ = require('lodash');

const MongoController = require('../controllers/mongo-async-controller.js');
const HyperspaceRoute = require('../data-classes/classes.js').HyperspaceRoute;

const SanctuaryPipeline = {
	name: "Sanctuary Pipeline",
  link: "http://starwars.wikia.com/wiki/Sanctuary_Pipeline",
  coordinates: [
  	[-71.906346, 21.024221],
  	[-67.311466, -46.247859]
  ],
  length: 7632.42
};



class HyperSpaceLaneRouterService {
  constructor() {
  	this.allLanesPath = '/api/hyperspacelane/';
  	this.searchLanesPath = '/api/hyperspacelane/search';
  	this.searchLanesByIdPath = '/api/hyperspacelane/search-lane-id';
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

	searchLanesById(req, res, next) {
		console.log("Hyperspace Lanes Search: ", req.query);
		const laneId = parseInt(req.query.id);
		MongoController.searchHyperspaceLanes({laneId: laneId}).then(docs => {
			if(docs.length === 0) {
				res.sendStatus(404);
			} else {
				res.json(docs[0].name);
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
				allLanesArrayForDropdown.push({
					value: "Sanctuary Pipeline",
					label: "Sanctuary Pipeline"
				});
				res.json(allLanesArrayForDropdown);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	searchAndBuildRoute(req, res, next) {
		console.log("Hyperspace Lanes Search and build: ", req.query);
		if(req.query.name === SanctuaryPipeline.name) {
			res.json(SanctuaryPipeline);
		} else {

			MongoController.searchHyperspaceLanes(req.query).then(docs => {
				if(docs.length === 0) {
					res.sendStatus(404);
				} else {
					const Route = new HyperspaceRoute({lanes: docs});
					const routeDistance = Route.routeLength();
					const coordinateArray = Route.buildCoordinatesArray();
					res.json({
						name: Route.name,
						link: Route.link,
						coordinates: coordinateArray,
						length: routeDistance
					});
				}
			}).catch(err => {
				console.log("error finding hyperspace route: ", err);
				res.sendStatus(404);
			});
		}
		
	}
};



module.exports = new HyperSpaceLaneRouterService();