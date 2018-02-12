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
		this.geoHash = Options.geoHash;
	}
};


module.exports.HyperSpaceNode = HyperSpaceNode;


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


function getGalacticYFromLatitude(latitude) {
  return  (-3.07e-19*(latitude**12)) + (-1.823e-18*(latitude**11)) + (4.871543e-15*(latitude**10)) + (4.1565807e-14*(latitude**9)) + (-2.900986202e-11 * (latitude**8)) + (-1.40444283864e-10*(latitude**7)) + (7.9614373223054e-8*(latitude**6)) + (7.32976568692443e-7*(latitude**5)) + (-0.00009825374539548058*(latitude**4)) + (0.005511093818675318*(latitude**3)) + (0.04346753629461727 * (latitude**2)) + (111.30155374684914 * latitude);
}

function getGalacticXFromLongitude(longitude) {
  return (111.3194866138503 * longitude);
}


