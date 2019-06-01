const _ = require('lodash');


class HyperSpaceRoute {
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

  nodesAreTheSame(node1, node2) { return nodesAreTheSame(node1, node2) }

  circleStatus() {
    const arr = this.getNodesForRoute();
    const nodes = [];
    for(let tickNode of arr) {
      const nodesFound = arr.filter(n => tickNode[0] === n[0] && tickNode[1] === n[1]);
      if(nodesFound.length === 2) { nodes.push(nodesFound); }
    }
    return nodes.length === arr.length;
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
    const routeNodes = this.getNodesForRoute();
    for(let currentNode of routeNodes) {
      const nodesFound = _.filter(routeNodes, node => {
        return this.nodesAreTheSame(node, currentNode);
      });
      if(nodesFound.length === 1) { extremityNodes.push(currentNode); }
    }
    return extremityNodes;
  }

  buildCoordinatesArray() {
    if(this.circleStatus()) {
      return zipCircleLaneUp(this.lanes);
    }
    let currentTick = 0;
    let orderedCoordinates = [];
    const extremityNodes = this.findExtremityNodes();
    const startNode = extremityNodes[0];
    const endNode = extremityNodes[1];
    let nextNode = startNode;
    let previousNode = [null, null];
    while (!this.nodesAreTheSame(nextNode, endNode) || currentTick === 0) {
      currentTick++;
      const CompletedTick = this.findNextNode(nextNode, previousNode, orderedCoordinates);
      previousNode = nextNode;
      nextNode = CompletedTick.nextNode;
      orderedCoordinates = CompletedTick.orderedCoordinates;
      // console.log("\nCurrent tick: ", currentTick);
      // console.log("previousNode: ", previousNode);
      // console.log("nextNode: ", nextNode);
      // console.log("orderedCoordinates: ", orderedCoordinates.length);
    }
    console.log("\nEnd of Build. Total coordinates: ", orderedCoordinates.length);
    // console.log("Last previous Node: ", previousNode);
    // console.log("Last next Node: ", nextNode);
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
};

function removeDulplicates(arr) {
  const nodes = [];
  for(let tickNode of arr) {
    const nodesFound = arr.filter(n => tickNode[0] === n[0] && tickNode[1] === n[1]);
    const nodeFoundIndex = nodes.indexOf(nodesFound[0]);
    const tickNodeIndex = arr.indexOf(tickNode);
    if(nodesFound.length >= 1 && (nodeFoundIndex < 0 || tickNodeIndex === arr.length - 1)) {
      nodes.push(nodesFound[0]);
    }
  }
  return nodes;
};

function flattenedData(arr) {
  return arr.map(n => {
    return {
      coordinates: n.coordinates,
      start: n.startCoordsLngLat,
      end: n.endCoordsLngLat
    };
  });
};

function zipCircleLaneUp(laneArrayRaw) {
  const laneArray = flattenedData(laneArrayRaw);
  const orderedLanes = [];
  let SelectedLane = laneArray[0];
  orderedLanes.push(SelectedLane);
  laneArray.shift();
  let currentTick = 0;
  while (laneArray.length >= 1) {
    currentTick++;
    const NextLane = findNextLane(SelectedLane, laneArray);
    const nextLaneIndex = laneArray.indexOf(NextLane);
    laneArray.splice(nextLaneIndex, 1);
    const selectedEndEqualsNextEnd = (SelectedLane.end[0] === NextLane.end[0] && SelectedLane.end[1] === NextLane.end[1]);
    const NextLaneAdjusted = (selectedEndEqualsNextEnd)? reverseLane(NextLane) : NextLane;
    orderedLanes.push(NextLaneAdjusted);
    SelectedLane = NextLaneAdjusted;
  }  
  const orderedCoordinates = createOrderedCoordinatesArray(orderedLanes);
  console.log("Ordered Coordinates: ", orderedCoordinates.length);
	console.log("Valid number of coordinates: ", orderedCoordinates.length === countNumberOfCoordinatesRaw(laneArrayRaw) - 1);
  return reverseToLatLng(orderedCoordinates);
};

function createOrderedCoordinatesArray(laneArray) {
  let orderedCoordinates = [];
  for(let CurrentLane of laneArray) {
    const coordinates = CurrentLane.coordinates;
    orderedCoordinates = orderedCoordinates.concat(coordinates);
  }
  // return removeDulplicates(orderedCoordinates);
  return orderedCoordinates;
};

function findNextLane(Lane, arr) {
  const linkedLanes = arr.filter((CurrentEnd, currentIndex) => {
    const laneEndLng = Lane.end[0];
    const laneEndLat = Lane.end[1];
    const startEndEqualsCurrentEnd = (laneEndLng === CurrentEnd.end[0] && laneEndLat === CurrentEnd.end[1]);
    const startEndEqualsCurrentStart = (laneEndLng === CurrentEnd.start[0] && laneEndLat === CurrentEnd.start[1]);
    return ((startEndEqualsCurrentStart || startEndEqualsCurrentEnd));
  });
  let LinkedLane = linkedLanes[0];
  return LinkedLane;
};

function reverseLane(Lane) {
  const oldStartLng = Lane.start[0];
  const oldStartLat = Lane.start[1];
  const oldEndLng = Lane.end[0];
  const oldEndLat = Lane.end[1];
  const reversedCoordinates = Lane.coordinates.map(n => n.slice()).reverse();
  return {
    start: [oldEndLng, oldEndLat],
    end: [oldStartLng, oldStartLat],
    coordinates: reversedCoordinates
  };
};

function copyCoordinatesArray(coordinatesArray) {
  const copyiedArray = [];
  for(let coordinate of coordinatesArray) {
    const lng = coordinate[0];
    const lat = coordinate[1];
    copyiedArray.push([lng, lat]);
  }
  return copyiedArray;
};

function nodesAreTheSame(node1, node2) { return node1[0] === node2[0] && node1[1] === node2[1] };

function countNumberOfCoordinates(lanesArray) {
  let numberOfCoordinates = 1;
  for(let lane of lanesArray) {
    numberOfCoordinates += lane.coordinates.length - 1;
  }
  return numberOfCoordinates;
};

function countNumberOfCoordinatesRaw(lanesArray) {
  let numberOfCoordinates = 1;
  for(let lane of lanesArray) {
    numberOfCoordinates += lane.coordinates.length;
  }
  return numberOfCoordinates;
};

function reverseToLatLng(lanesArray) {
	const latLngArray = [];
	for(let lane of lanesArray) {
		lane.reverse();
		latLngArray.push(lane);
	}
	return latLngArray;
};

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
};

function generateHyperspaceRoute(lanes) {
  const B =  new HyperSpaceRoute({lanes: lanes});
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
};


module.exports = HyperSpaceRoute;