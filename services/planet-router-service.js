const MongoController = require('../controllers/mongo-async-controller.js');

class PlanetRouterService {
  constructor() {
  	this.planetsWithALocationPath = '/api/has-location';
  	this.allPlanetsPath = '/api/all';
  	this.searchPlanetsPath = '/api/search';
  	this.planetsWithNoLocationPath = '/api/no-location';
  	this.distanceBetweenSystemsPath = '/api/distance-between';
  	this.searchPlanetsForLinkPath = '/api/has-link';
  	console.log("Planets Service Loading...");
  }

	planetsWithALocation(req, res, next) {
		console.log("get all planets with a location");
		MongoController.findAllPlanetsWithALocation().then(docs => {
			console.log("Get All Planets with a location: ", docs.doc.length);
			if(docs.status) {
				res.json(docs.doc);
			} else {
				res.sendStatus(404);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	allPlanets(req, res, next) {
		MongoController.findAllPlanets().then(docs => {
			console.log("Get All Planets: ", docs.doc.length);
			if(docs.status) {
				res.json(docs.doc);
			} else {
				res.sendStatus(404);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	searchPlanets(req, res, next) {
		console.log("Search for planets with: ", req.query);
		MongoController.findOnePlanet(req.query).then(docs => {
			if(docs.status) {
				// console.log("Search: ", docs.doc);
				res.json(docs.doc);
			} else {
				res.sendStatus(404);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	searchPlanetsForLink(req, res, next) {
		console.log("Search for planets with: ", req.body);
		MongoController.findOnePlanet(req.body).then(docs => {
			if(docs.status) {
				// console.log("Search: ", docs.doc);
				res.send(true);
			} else {
				res.send(false);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	planetsWithNoLocation(req, res, next) {
		MongoController.findAllPlanetsWithNoLocation().then(docs => {
			if(docs.status) {
				console.log("Planets with no exact location: ", docs.doc.length);
				res.json(docs.doc);
			} else {
				res.sendStatus(404);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	distanceBetweenSystems(req, res, next) {
		MongoController.distanceBetweenPlanets(req.query).then(docs => {
			if(docs.status) {
				res.json({distance: docs.distance});
			} else {
				res.sendStatus(404);
			}
		}).catch(err => {
			res.sendStatus(404);
		});
	}

};



module.exports = new PlanetRouterService();