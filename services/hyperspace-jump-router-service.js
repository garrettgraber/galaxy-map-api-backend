const request = require('request');
const rp = require('request-promise');
const DatabaseLinks = require('docker-links').parseLinks(process.env);
const _ = require('lodash');

const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';


if(DatabaseLinks.hasOwnProperty('navcom') && isDeveloping) {
	var NAVCOM = 'http://' + DatabaseLinks.navcom.hostname + ':' + DatabaseLinks.navcom.port;
} else if (isProduction) {
	var NAVCOM = 'http://172.31.66.51:80';
}

const MongoController = require('../controllers/mongo-async-controller.js');

class HyperSpaceJumpRouterService {
  constructor() {
  	this.shortestJumpPath = '/api/hyperspace-jump/calc-shortest';
  	this.multipleJumpsPath = '/api/hyperspace-jump/calc-many';
  	this.minimumJumpPath = '/api/hyperspace-jump/minimum-paths';
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
				console.log("Body options: ", Object.keys(body));
				console.log("body.paths: ", body.paths);
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

	calculateMinimumJumps(req, res, next) {
		let JumpData = req.body;
		if(JumpData.limit > 10) {
			JumpData.limit = 10;
		}

		minimumJumpPaths(JumpData).then(JumpStatus => {
			if(!JumpStatus.validJump && JumpStatus.jumps > 40) {
				res.sendStatus(404);
			} else {
				const options = {
				  method: 'post',
				  body: JumpData,
				  json: true,
				  url: NAVCOM + '/hyperspace-jump/calc-many'
				};
				request(options, function (error, response, body) {
					if(error) {
						console.log("error getting data from navi computer: ", error);
						res.sendStatus(500);
					} else {
						console.log("Found hyperspace jump, sending!!");
						const totalPaths = body.paths.length;
						const pathJumpTotals = _.map(body.paths, (currentPath) => { return currentPath.jumps.length; });
						const pathWithTheMostJumps = Math.max.apply(Math, pathJumpTotals);
						console.log("pathWithTheMostJumps: ", pathWithTheMostJumps);
						console.log("totalPaths: ", totalPaths);
						res.json(body);
					}
				});
			}
		}).catch(err => {
			res.sendStatus(500);
		});
	}
};




async function minimumJumpPaths(JumpData) {
	try {
		let JumpDataMinimum = _.cloneDeep(JumpData);
		JumpDataMinimum.limit = 1;
		const options = {
			method: 'post',
			body: JumpDataMinimum,
			json: true,
			url: NAVCOM + '/hyperspace-jump/calc-minimum-jumps'
		};
		const CalculatedJump = await rp(options);
		console.log("Shortest Number of Jumps: ", CalculatedJump);
		const ShortestJump = CalculatedJump.paths[0];
		const numberOfJumps = ShortestJump.numberOfJumps;
		return {
			validJump: true,
			jumps: numberOfJumps
		};
	} catch(err) {
		return {
			validJump: false,
			jumps: 0
		};
	}
}


module.exports = new HyperSpaceJumpRouterService();