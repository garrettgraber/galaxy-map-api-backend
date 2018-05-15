const MongoController = require('../controllers/mongo-async-controller.js');

class SectorRouterService {
  constructor() {
  	this.allSectorsPath = '/api/sectors/';
  	this.findSectorPath = '/api/sector';
  	this.allSectorsWithLinksPath = '/api/sectors-with-links';
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

	findSector(req, res, next) {
		MongoController.findSector(req.query).then(docs => {
			console.log("Sectors found in Database: ", docs);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}

	allSectorsWithLinks(req, res, next) {
		MongoController.allSectorsWithLinks().then(docs => {
			console.log("All sectors with links found in Database: ", docs.length);
			res.json(docs);
		}).catch(err => {
			res.sendStatus(404);
		});
	}
};


module.exports = new SectorRouterService();