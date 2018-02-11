const MongoController = require('../controllers/mongo-async-controller.js');

class GridCoordinatesRouterService {
  constructor() {
  	this.allCoordinatesPath = '/api/populated-areas/';
  	console.log("Grid Coordinates Service Loading...");
  }

	allCoordinates(req, res, next) {
		MongoController.allPopulatedCoordinates().then(docs => {
			console.log("Total Coordinates in Database: ", docs.length);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}
};

module.exports = new GridCoordinatesRouterService();