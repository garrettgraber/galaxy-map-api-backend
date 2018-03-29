const fs = require('fs');
const path = require('path');

const GridData = require('../data/grid.json');
const HyperspaceData = require('../data/hyperspace.json');
const RegionData = require('../data/region.json');
const SectorData = require('../data/sector.json');


class GeoJsonDataService {
  constructor() {
  	this.gridDataPath = '/api/data/grid/';
  	this.hyperspaceDataPath = '/api/data/hyperspace/';
  	this.regionDataPath = '/api/data/region/';
  	this.sectorDataPath = '/api/data/sector/';
  	console.log("Geo Json Service Loading...");
  }

  gridData(req, res, next) {
  	console.log("GridData: ", GridData.features.length);
  	res.json(GridData);
  }

  hyperspaceData(req, res, next) {
  	console.log("HyperspaceData: ", HyperspaceData.features.length);
  	res.json(HyperspaceData);
  }

  regionData(req, res, next) {
  	console.log("RegionData: ", RegionData.features.length);
  	res.json(RegionData);
  }

  sectorData(req, res, next) {
  	console.log("SectorData: ", SectorData.features.length);
  	res.json(SectorData);
  }
};


module.exports = new GeoJsonDataService();

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
