const request = require('request');
const DatabaseLinks = require('docker-links').parseLinks(process.env);

const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';


if(DatabaseLinks.hasOwnProperty('navcom') && isDeveloping) {
	var NAVCOM = 'http://' + DatabaseLinks.navcom.hostname + ':' + DatabaseLinks.navcom.port;
} else if (isProduction) {
	var NAVCOM = 'http://172.31.77.226:80';
}

const MongoController = require('../controllers/mongo-async-controller.js');

class HyperSpaceJumpRouterService {
  constructor() {
  	this.shortestJumpPath = '/api/hyperspace-jump/calc-shortest';
  	this.multipleJumpsPath = '/api/hyperspace-jump/calc-many';
  	console.log("Hyperspace Jump Service Loading...");
  }
	calculateShortestJump(req, res, next) {
		console.log("calculate hyperspace jump: ", req.body);
		const JumpData = req.body;
		const options = {
		  method: 'post',
		  body: JumpData,
		  json: true,
		  url: NAVCOM + '/hyperspace-jump/calc-shortest'
		}
		request(options, function (error, response, body) {
			if(error) {
				console.log("error getting data from navi computer: ", error);
				res.sendStatus(500);
			} else {
				console.log("Found hyperspace jump, sending!!");
				res.json(body);
			}
		});    
	}
	calculateMultipleJumps(req, res, next) {
		console.log("calculate hyperspace jump: ", req.body);
		const JumpData = req.body;
		const options = {
		  method: 'post',
		  body: JumpData,
		  json: true,
		  url: NAVCOM + '/hyperspace-jump/calc-many'
		}
		request(options, function (error, response, body) {
			if(error) {
				console.log("error getting data from navi computer: ", error);
				res.sendStatus(500);
			} else {
				console.log("Found hyperspace jump, sending!!");
				res.json(body);
			}
		});
	}
};

module.exports = new HyperSpaceJumpRouterService();