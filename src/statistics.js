const NodeCache = require( "node-cache" );
const cache = new NodeCache();

function getEmptyStatistics() {
	return {
		requests: 0,
		cacheHits: 0,
		salesforceCalls: 0,
		totalCacheTime: 0,
		totalSalesforceTime: 0,
		totalTime: 0,
		errors: 0
	};
}

exports.resetStatistics = function() {
	let stats = getEmptyStatistics();

	cache.set("stats", stats);

	return stats;
}


exports.getStatistics = function() {
	let stats = cache.get("stats");
	if(!stats) stats = getEmptyStatistics();

	return stats;
}

exports.setStatistics = function(stats) {
	cache.set("stats", stats);

	return stats;
}