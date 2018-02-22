const request = require('request');
const rp = require('request-promise');
const DatabaseLinks = require('docker-links').parseLinks(process.env);
const _ = require('lodash');

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

		const JumpData = req.body;
		minimumJumpPaths(JumpData).then(shortestNumberOfJumps => {
			// res.json(shortestNumberOfJumps);

			if(shortestNumberOfJumps && shortestNumberOfJumps > 45) {
				res.json(false);
			} else {
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
		}).catch(err => {
			res.sendStatus(500);
		});




		// console.log("calculate hyperspace jump: ", req.body);
		// const JumpData = req.body;
		// let JumpDataMinimum = _.cloneDeep(JumpData);
		// JumpDataMinimum.limit = 1;
		// const options = {
		//   method: 'post',
		//   body: JumpDataMinimum,
		//   json: true,
		//   url: NAVCOM + '/hyperspace-jump/calc-shortest'
		// }
		// request(options, function (error, response, body) {
		// 	if(error) {
		// 		console.log("error getting data from navi computer: ", error);
		// 		res.sendStatus(500);
		// 	} else {
		// 		console.log("Found hyperspace jump, sending!!");

		// 		// console.log("data: ", body);
		// 		const ShortestJump = body.paths[0];
		// 		const numberOfJumps = ShortestJump.numberOfJumps;

		// 		console.log("Number of Jumps: ", numberOfJumps);

		// 		res.json(body);
		// 	}
		// });


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

		return numberOfJumps;

		// console.log("NodeData: ", NodeData);
		// const options = {
		//   method: 'post',
		//   body: NodeData,
		//   json: true,
		//   url: NAVCOM + '/hyperspace-connection/coruscant'
		// }

		// const connectionStatus = await rp(options);
		// console.log("Point connected to Coruscant: ", connectionStatus);
		// return connectionStatus;


	} catch(err) {
		return null;
	}
}


module.exports = new HyperSpaceJumpRouterService();