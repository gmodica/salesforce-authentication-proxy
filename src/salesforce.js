var nforce = require('nforce');
const NodeCache = require( "node-cache" );
const cache = new NodeCache();

var statistics = require('./statistics');

exports.salesforceAuthentication = function(refresh) {
	return new Promise((resolve, reject) => {
		let start = performance.now();
		let cacheHit = false;

		let stats = statistics.getStatistics();

		try {
			stats.requests += 1;

			if(!refresh) {
				let accessToken = cache.get("access_token");
				if(accessToken) {
					console.log('Retrieving token from cache: ' + accessToken);
					resolve(accessToken);

					stats.cacheHits += 1;
					let totalTime = performance.now() - start;
					stats.totalTime += totalTime;
					stats.totalCacheTime += totalTime;
					statistics.setStatistics(stats);

					return;
				}
			}

			var org = nforce.createConnection({
				clientId: process.env.SALESFORCE_CLIENT_ID,
				clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
				redirectUri: process.env.SALESFORCE_CALLBACK_URL,
				environment: process.env.SALESFORCE_ENVIRONMENT,  // optional, salesforce 'sandbox' or 'production', production default
				mode: 'single' // optional, 'single' or 'multi' user mode, multi default
			});

			console.log('Retrieving salesforce token for username ' + process.env.SALESFORCE_USERNAME);
			org.authenticate({ username: process.env.SALESFORCE_USERNAME, password: process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN},
				function(err, resp) {
					if(err) {
						stats.errors += 1;
						console.error(err);
						reject(err);
					}
					else {
						accessToken = org.oauth.access_token;
						console.log('Retrieved token from salesforce: ' + accessToken);
						cache.set("access_token", accessToken, process.env.CACHE_TTL_SECONDS);
						resolve(accessToken);
					}

					stats.salesforceCalls += 1;
					let totalTime = performance.now() - start;
					stats.totalTime += totalTime;
					stats.totalSalesforceTime += totalTime;
					statistics.setStatistics(stats);
				}
			);
		}
		catch(err) {
			stats.errors += 1;
			let totalTime = performance.now() - start;
			stats.totalTime += totalTime;
			statistics.setStatistics(stats);

			reject(err);
		}
	});
}