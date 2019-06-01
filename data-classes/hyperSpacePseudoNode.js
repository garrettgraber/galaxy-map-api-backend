
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

module.exports = HyperSpacePseudoNode;