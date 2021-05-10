const NodeCache = require( "node-cache" );
const cache = new NodeCache();

var statistics = require('../../statistics');

exports.getStatistics = async function(req, res) {
	try {
		let stats = statistics.getStatistics();

		stats.averageTime = stats.requests > 0 ? stats.totalTime / stats.requests : 0;
		stats.averageCacheTime = stats.cacheHits > 0 ? stats.totalCacheTime / stats.cacheHits : 0;
		stats.averageSalesforceTime = stats.salesforceCalls > 0 ? stats.totalSalesforceTime / stats.salesforceCalls : 0;

		res.json({
			totalRequests: stats.requests,
			totalCacheHits: stats.cacheHits,
			totalSalesforceCalls: stats.salesforceCalls,
			averageTime: stats.averageTime,
			averageCacheTime: stats.averageCacheTime,
			averageSalesforceTime: stats.averageSalesforceTime,
			totalErrors: stats.errors
		});

		res.status(200).end();
	}
	catch(err) {
		console.error(err);
		res.status(500).send("Error " + err);
	}
};

exports.resetStatistics = async function(req, res) {
	try {
		statistics.resetStatistics();

		res.status(200).end();
	}
	catch(err) {
		console.error(err);
		res.status(500).send("Error " + err);
	}
};

