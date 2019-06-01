const _ = require('lodash'),
	distance = require('euclidean-distance');

const HyperSpaceNode = require('./hyperSpaceNode.js');


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
		const outputTextNormalized = "Distance from " + NodeToSend.system + " : " + NodeToSend.distanceFromPointNormalized + " normalized";
		nodesArraySorted.push(NodeToSend);
	}
	nodesArraySorted.sort(function(a, b) {
	    return parseFloat(a.distanceFromPointNormalized) - parseFloat(b.distanceFromPointNormalized);
	});
	return nodesArraySorted;
};

module.exports = Point;

