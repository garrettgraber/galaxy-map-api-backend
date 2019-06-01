
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

module.exports = HyperSpaceNode;