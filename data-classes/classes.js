const _ = require('lodash'),
	uuidv1 = require('uuid/v1'),
  uuidv4 = require('uuid/v4'),
  Geohash = require('latlon-geohash'),
	distance = require('euclidean-distance'),
  hash = require('string-hash');

class Planet {
	constructor(
		systemValue,
		sectorValue,
		regionValue,
		coordinatesValue,
		xGalactic = 0,
		yGalactic = 0,
		xGalacticLong = 0,
		yGalacticLong = 0,
		hasLocation = false,
		LngLat = [],
		lat = null,
		lng = null,
		zoom = 5,
		link = '',
		textWidth = 0
	) {
		this.system = systemValue;
		this.sector = sectorValue;
		this.region = regionValue;
		this.coordinates = coordinatesValue;
		this.xGalactic = xGalactic;
		this.yGalactic = yGalactic;
		this.xGalacticLong = xGalacticLong;
		this.yGalacticLong = yGalacticLong;
		this.hasLocation = hasLocation;
		this.LngLat = LngLat;
		this.lng = (LngLat.length)? LngLat[0] : null;
		this.lat = (LngLat.length)? LngLat[1] : null;
		this.zoom = zoom;
		this.link = link;
		this.textWidth = textWidth;
	}

	starInMapView(mapWidth, mapHeight, MapBoundaries) {
	    const mapOffSetLng = 0;
	    const mapOffSetLat = 0;
	    const inNorthSouthRange = (MapBoundaries.south < this.lat && this.lat < MapBoundaries.north) ? true : false;
	    const inEastWestRange = (MapBoundaries.west< this.lng && this.lng < MapBoundaries.east) ? true : false;
	    const objectInvView = (inNorthSouthRange && inEastWestRange) ? true : false;
	    return objectInvView;
	}

	starIsVisible(currentZoom) {
		let starIsViewableAtZoom = false;
    if(this.zoom === 0) {
			starIsViewableAtZoom = true;
    } else if(this.zoom === 1 && currentZoom >= 3) {
    	starIsViewableAtZoom = true;
    } else if(this.zoom === 2 && currentZoom >= 5) {
    	starIsViewableAtZoom = true;
    } else if(this.zoom === 3 && currentZoom >= 6) {
    	starIsViewableAtZoom = true;
    } else {
    	starIsViewableAtZoom = false;
    }
      return starIsViewableAtZoom;
  }

	galaticXYtoMapPoints(xGalactic, yGalactic) {
    const galacticOffset = 19500;
    const galacticDivisor = 39.0;
    let yPoint;
    if(yGalactic > 0 && xGalactic > 0) {
      yPoint = -(yGalactic - galacticOffset) / galacticDivisor;
    } else if (yGalactic < 0) {
      yPoint = ((-yGalactic) + galacticOffset) /  galacticDivisor;
    } else if(yGalactic > 0 && xGalactic < 0) {
      yPoint = (galacticOffset - yGalactic) / galacticDivisor;
    }
    if(yGalactic === 0) {
      yPoint = 0;
    }
    const xPoint = (xGalactic + galacticOffset) / galacticDivisor;
    return {
      xPoint: xPoint,
      yPoint: yPoint
    };
	}

	planetIsAtZoomLevel(currentZoom) {
		let atZoomLevel = false;
		switch(this.zoom) {
			case 0:
				atZoomLevel = true;
				break;
			case (this.zoom === 1 && currentZoom >= 3): 
				atZoomLevel = true;
				break;
			case (this.zoom === 2 && currentZoom >= 5): 
				atZoomLevel = true;
				break;
			case (this.zoom === 3 && currentZoom >= 6): 
				atZoomLevel = true;
				break;
			default:
				atZoomLevel = false;
		}
		return atZoomLevel;
	}
};

module.exports.Planet = Planet;

class HyperSpaceLane {
	constructor(
		name,
		hyperspaceHash,
		start,
		end,
		startCoordsLngLat,
		endCoordsLngLat,
		length,
		link,
		_start,
		_end,
		coordinates
		) {
		this.name = name || "No Name";
		this.hyperspaceHash = hyperspaceHash;
		this.start = start;
		this.end = end;
		this.startCoordsLngLat = coordinateStringToArray(startCoordsLngLat);
		this.endCoordsLngLat = coordinateStringToArray(endCoordsLngLat);
		this.length = length;
		this.link = link || "No Link";
		this._start = _start;
		this._end = _end;
		this.coordinates = coordinateStringToArray(coordinates);
	}

	reverseLatLng(coordinatesData) {
		const latBefore = coordinatesData[0][1];
		for(let k of coordinatesData) {
			k.reverse();
		}
		const latAfter = coordinatesData[0][0];
		// console.log("Before and after the same: ", (latBefore === latAfter)? true : false);
		return coordinatesData;
	}
};

function coordinateStringToArray(coordinates) {
	if(Array.isArray(coordinates)) {
		return coordinates;
	} else {
		let jsonJumpCoordinates = JSON.parse("[" + coordinates + "]");
		return jsonJumpCoordinates[0];			
	}
};

module.exports.HyperSpaceLane = HyperSpaceLane;


class HyperSpaceNode {
	constructor(Options) {
		this.lng = Options.lng,
  	this.lat = Options.lat,
		this.hyperspaceLanes = Options.hyperspaceLanes,
		this.nodeId = Options.nodeId,
		this.loc = Options.loc,
		this.system = Options.system;
		this.distanceFromPoint = Options.distanceFromPoint;
		this.distanceFromPointNormalized = Options.distanceFromPointNormalized;
		this.xGalacticLong = Options.xGalacticLong;
		this.yGalacticLong = Options.yGalacticLong;
    this.xGalactic = Options.xGalactic;
    this.yGalactic = Options.yGalactic;

		this.geoHash = Options.geoHash;
		this.zoom = Options.zoom;
		this.emptySpace = Options.emptySpace;
	}
};


module.exports.HyperSpaceNode = HyperSpaceNode;




class HyperSpacePseudoNode {
  constructor(Options) {
    this.lng = Options.lng,
    this.lat = Options.lat,
    this.hyperspaceLanes = Options.hyperspaceLanes,
    this.nodeId = Options.nodeId,
    this.system = Options.system;

    this.xGalacticLong = Options.xGalacticLong;
    this.yGalacticLong = Options.yGalacticLong;
    this.xGalactic = Options.xGalactic;
    this.yGalactic = Options.yGalactic;

    this.zoom = Options.zoom;
    this.emptySpace = Options.emptySpace;
  }
};


module.exports.HyperSpacePseudoNode = HyperSpacePseudoNode;


class Point {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }

  normalizeLng() {
  	const normalizedLng = (this.lng / 2.0);
    return normalizedLng;
  }

  coordinatesNormalized() {
  	return [this.lat, this.normalizeLng()];
  }
  coordinates() {
  	const pointCoordinates = [this.lat, this.lng];
		return pointCoordinates;
  }

  distanceBetweenPointAndNodes(nodesArray) {
  	return distanceBetweenPointAndNodes(this.coordinatesNormalized(), nodesArray);
	}
};


function distanceBetweenPointAndNodes(normalizedCoordinates, nodesArray) {
	const searchPointCoordinates = normalizedCoordinates;
	const nodesArraySorted = [];
	for(let Node of nodesArray) {
		const NodePoint = new Point(Node.lat, Node.lng);
		const nodeCoordinatesNormalized = NodePoint.coordinatesNormalized();
		const nodeCoordinates = NodePoint.coordinates();
		const distanceBetweenNormalized = distance(searchPointCoordinates, nodeCoordinatesNormalized);
		const distanceBetween = distance(searchPointCoordinates, nodeCoordinates);
		const NodeOptions = _.merge(Node, {
			distanceFromPoint: distanceBetween,
			distanceFromPointNormalized: distanceBetweenNormalized
		});
		const NodeToSend = new HyperSpaceNode(NodeOptions);
		const outputText = "Distance from " + NodeToSend.system + " : " + NodeToSend.distanceFromPoint;
		// console.log(outputText);
		const outputTextNormalized = "Distance from " + NodeToSend.system + " : " + NodeToSend.distanceFromPointNormalized + " normalized";
		// console.log(outputTextNormalized);
		nodesArraySorted.push(NodeToSend);
	}

	nodesArraySorted.sort(function(a, b) {
	    return parseFloat(a.distanceFromPointNormalized) - parseFloat(b.distanceFromPointNormalized);
	});
	return nodesArraySorted;
}


module.exports.Point = Point;


class HyperspaceRoute {
  constructor(Options) {
    this.lanes = Options.lanes;
    this.name = this.lanes[0].name;
    this.link = this.lanes[0].link;
  }

  routeLength() {
    let routeDistance = 0;
    for(let lane of this.lanes) {
      routeDistance += lane.length;
    }
    const distanceRounded = parseFloat(routeDistance.toFixed(2));
    return distanceRounded;
  }

  nodesAreTheSame(node1, node2) {
    return node1[0] === node2[0] && node1[1] === node2[1];
  }

  getNodesForRoute() {
    const nodesArray = [];
    for(let lane of this.lanes) {
      nodesArray.push(lane.startCoordsLngLat);
      nodesArray.push(lane.endCoordsLngLat);
    }
    return nodesArray;
  }

  validateHyperspaceRoute() {

    const extremityNodes = this.findExtremityNodes();
    const allNodes = this.getNodesForRoute();
    console.log("\nExtremityNodes: ", extremityNodes);
    console.log("Nodes: ", allNodes.length);
    console.log("Nodes no duplicates: ", removeDuplicateNodes(allNodes).length);
    console.log("Lanes length: ", this.lanes.length);
    const invalidNumberOfNodesByLanes = removeDuplicateNodes(allNodes).length !== this.lanes.length + 1;
    const invalidNumberOfExtremityNodes = extremityNodes.length !== 2;
    if(invalidNumberOfNodesByLanes || invalidNumberOfExtremityNodes) {
      console.log("Invalid hyperspace route: ", this.lanes[0].name);
      return false;
    } else {
      console.log("Valid hyperspace route: ", this.lanes[0].name);
      return true;
    }
  }

  findExtremityNodes() {
    const extremityNodes = [];
    for(let currentNode of this.getNodesForRoute()) {
      const nodesFound = _.filter(this.getNodesForRoute(), node => {
        return this.nodesAreTheSame(node, currentNode);
      });
      if(nodesFound.length === 1) {
        extremityNodes.push(currentNode);
      }
    }
    return extremityNodes;
  }

  findInternalNodes() {
    const extremityNodes = this.findExtremityNodes();
    const firstNode = extremityNodes[0];
    const secondNode = extremityNodes[1];
    let rawInternalArray = []
    for(let node of this.getNodesForRoute()) {
      const sameAsFirstNode = this.nodesAreTheSame(node, firstNode);
      const sameAsSecondNode = this.nodesAreTheSame(node, secondNode);
      if(!sameAsFirstNode && !sameAsSecondNode) {
        rawInternalArray.push(node);
      }
    }
    const internalNodes = [];
    for(let currentNode of rawInternalArray) {
      const nodesFound = _.filter(rawInternalArray, node => {
        return this.nodesAreTheSame(node, currentNode);
      });
      const nodesFoundInInternal = _.filter(internalNodes, node => {
        return this.nodesAreTheSame(node, currentNode);
      });
      if(nodesFoundInInternal.length === 0 && nodesFound.length > 1) {
        internalNodes.push(currentNode);
      }
    }
    return internalNodes;
  }

  buildCoordinatesArray() {
    let currentTick = 0;
    let orderedCoordinates = [];
    const extremityNodes = this.findExtremityNodes();
    let internalNodes = this.findInternalNodes();
    const startNode = extremityNodes[0];
    const endNode = extremityNodes[1];
    let nextNode = startNode;
    let previousNode = [null, null];
    while (!this.nodesAreTheSame(nextNode, endNode)) {
      currentTick++;
      console.log("\nCurrent tick: ", currentTick);
      console.log("nextNode: ", nextNode);
      console.log("orderedCoordinates: ", orderedCoordinates.length);
      const CompletedTick = this.findNextNode(nextNode, previousNode, orderedCoordinates);
      previousNode = nextNode;
      nextNode = CompletedTick.nextNode;
      orderedCoordinates = CompletedTick.orderedCoordinates;
    }
    console.log("End of Build. Total coordinates: ", orderedCoordinates.length);
    console.log("Extremity Nodes: ", this.findExtremityNodes());
    console.log("Internal Nodes: ", this.findInternalNodes());
    console.log("Valid number of coordinates: ", countNumberOfCoordinates(this.lanes) === orderedCoordinates.length);
    const orderedCoordinatesLatLng = reverseToLatLng(orderedCoordinates);
    return orderedCoordinatesLatLng;
  }

  findNextNode(currentNode, previousNode, orderedCoordinates) {
    const laneFound = _.filter(this.lanes, lane => this.nodesAreTheSame(currentNode, lane.startCoordsLngLat) && !this.nodesAreTheSame(previousNode, lane.endCoordsLngLat));
    const laneFoundReversed = _.filter(this.lanes, lane => this.nodesAreTheSame(currentNode, lane.endCoordsLngLat) && !this.nodesAreTheSame(previousNode, lane.startCoordsLngLat));
    const currentNodeAndStartEqual = (laneFound.length > 0)? true : false;
    const currentNodeAndEndEqual = (laneFoundReversed.length > 0)? true : false;
    let nextNode = [];
    if(currentNodeAndStartEqual) {
      const LaneFound = laneFound[0];
      let coordinatesCopy = copyCoordinatesArray(LaneFound.coordinates);
      if(orderedCoordinates.length > 0) {
	      const lastInOrdered = orderedCoordinates[ orderedCoordinates.length - 1 ];
	      const firstInLane = coordinatesCopy[0];
	      if(this.nodesAreTheSame(lastInOrdered, firstInLane)) { orderedCoordinates.splice(-1,1) }
      }
      orderedCoordinates = orderedCoordinates.concat(coordinatesCopy);
      nextNode = LaneFound.endCoordsLngLat;
    }
    if(currentNodeAndEndEqual) {
      const LaneFound = laneFoundReversed[0];
      const start = LaneFound.startCoordsLngLat;;
      let coordinatesCopy = copyCoordinatesArray(LaneFound.coordinates);
      coordinatesCopy.reverse();
      if(orderedCoordinates.length > 0) {
	      const lastInOrdered = orderedCoordinates[ orderedCoordinates.length - 1 ];
	      const firstInLane = coordinatesCopy[0];
	      if(this.nodesAreTheSame(lastInOrdered, firstInLane)) { orderedCoordinates.splice(-1,1) }
      }
      orderedCoordinates = orderedCoordinates.concat(coordinatesCopy);
      nextNode = LaneFound.startCoordsLngLat;
    }
    return {
      nextNode: nextNode,
      orderedCoordinates: orderedCoordinates
    };
  }
}


module.exports.HyperspaceRoute = HyperspaceRoute;


function copyCoordinatesArray(coordinatesArray) {
  const copyiedArray = [];
  for(let coordinate of coordinatesArray) {
    const lng = coordinate[0];
    const lat = coordinate[1];
    copyiedArray.push([lng, lat]);
  }
  return copyiedArray;
}

function nodesAreTheSame(node1, node2) { return node1[0] === node2[0] && node1[1] === node2[1] }

function findNodeInCoordinatesArray(currentNode, coordinatesArray) {
	for(let coordinate of coordinatesArray) {
		if(nodesAreTheSame(coordinate, currentNode)) { return true }
	}
	return false;	
}

function countNumberOfCoordinates(lanesArray) {
  let numberOfCoordinates = 1;
  for(let lane of lanesArray) {
    numberOfCoordinates += lane.coordinates.length - 1;
  }
  return numberOfCoordinates;
}

function reverseToLatLng(lanesArray) {
	const latLngArray = [];
	for(let lane of lanesArray) {
		lane.reverse();
		latLngArray.push(lane);
	}
	return latLngArray;
}

function removeDuplicateNodes(nodesArray) {
  const distinctNodesArray = [];
  for(let currentNode of nodesArray) {
    const nodesFoundInArray = _.filter(nodesArray, node => {
      return nodesAreTheSame(node, currentNode);
    });
    const nodesFoundInDuplicatesArray = _.filter(distinctNodesArray, node => {
      return nodesAreTheSame(node, currentNode);
    });
    if(nodesFoundInArray.length > 0 && nodesFoundInDuplicatesArray.length === 0) {
      distinctNodesArray.push(currentNode);
    }
  }
  return distinctNodesArray;
}

function validateHyperspaceRoute(lanes) {
  const B =  new HyperspaceRoute({lanes: lanes});
  const BExtremityNodes = B.findExtremityNodes();
  const BNodes = B.getNodesForRoute();
  console.log("\nExtremityNodes: ", BExtremityNodes);
  console.log("Nodes: ", BNodes.length);
  console.log("Nodes no duplicates: ", removeDuplicateNodes(BNodes).length);
  console.log("Lanes length: ", lanes.length);
  const invalidNumberOfNodesByLanes = removeDuplicateNodes(BNodes).length !== lanes.length + 1;
  const invalidNumberOfExtremityNodes = BExtremityNodes.length !== 2;
  if(invalidNumberOfNodesByLanes || invalidNumberOfExtremityNodes) {
    console.log("Invalid hyperspace route: ", lanes[0].name);
    return false;
  } else {
    console.log("Valid hyperspace route: ", lanes[0].name);
    return true;
  }
}

function getGalacticYFromLatitude(latitude) {
  return  (-3.07e-19*(latitude**12)) + (-1.823e-18*(latitude**11)) + (4.871543e-15*(latitude**10)) + (4.1565807e-14*(latitude**9)) + (-2.900986202e-11 * (latitude**8)) + (-1.40444283864e-10*(latitude**7)) + (7.9614373223054e-8*(latitude**6)) + (7.32976568692443e-7*(latitude**5)) + (-0.00009825374539548058*(latitude**4)) + (0.005511093818675318*(latitude**3)) + (0.04346753629461727 * (latitude**2)) + (111.30155374684914 * latitude);
}

function getGalacticXFromLongitude(longitude) {
  return (111.3194866138503 * longitude);
}


