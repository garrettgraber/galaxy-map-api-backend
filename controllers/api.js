
const express = require('express');
const router = express.Router();


router.get('/has-location', function(req, res) {

	PlanetModel.find({hasLocation: true}, function (err, docs) {
	 	console.log(docs);
	 	console.log("All Planets");
	 	res.json(docs);
	});

});


router.get('/all', function(req, res) {


	PlanetModel.find({}, function (err, docs) {
	 	console.log(docs);
	 	console.log("All Planets");
	 	res.json(docs);
	});
});


router.get('/search', function(req, res) {

	console.log("req.query: ", req.query);

	// var system = req.params('system');
	// var region = req.params('region');
	// var sector = req.params('sector');
	// var coordinates = req.params('coordinates');

	PlanetModel.find(req.query, function(err, docs) {
	 	console.log("docs: ", docs);

	 	if(err || docs.length === 0) {

	 		res.sendStatus(404);

	 	} else {

	 		res.json(docs);		

	 	}
	});

});


router.get('/populated-areas', function(req, res) {

	CoordinateModel.find({}, function(err, result) {

		console.log("Total Coordinates in Database: ", result.length);
		res.json(result);

	});

});


router.get('/sectors', function(req, res) {

	SectorModel.find({}, function(err, result) {

		console.log("Total Sectors in Database: ", result.length);
		res.json(result);

	});

});


router.get('/hyperspace', function(req, res) {

	HyperLaneModel.find({}, function(err, result) {

		console.log("Total Hyperlanes in Database: ", result.length);
		res.json(result);

	});

});


router.get('/no-location', function(req, res) {

	PlanetModel.find({hasLocation: false}, function(err, result) {

		console.log("Planets with no exact location: ", result);
		res.json(result);

	});

});
