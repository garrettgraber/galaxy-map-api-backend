const MongoController = require('../controllers/mongo-async-controller.js');

class SectorRouterService {
  constructor() {
  	this.allSectorsPath = '/api/sectors/';
  	console.log("Sectors Service Loading...");
  }

	allSectors(req, res, next) {
		MongoController.allSectors().then(docs => {
			console.log("Total Sectors in Database: ", docs.length);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}
};


module.exports = new SectorRouterService();