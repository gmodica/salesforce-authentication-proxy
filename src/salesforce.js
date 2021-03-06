var nforce = require('nforce');
const { getToken } = require('sf-jwt-token');
const NodeCache = require( "node-cache" );
const cache = new NodeCache();

const statistics = require('./statistics');
const { performance } = require('perf_hooks');

exports.salesforceAuthentication = function(refresh) {
	return new Promise(async (resolve, reject) => {
		let start = performance.now();
		let cacheHit = false;

		let stats = statistics.getStatistics();

		try {
			stats.requests += 1;

			if(!refresh) {
				let accessToken = cache.get("access_token");
				let instanceUrl = cache.get("instance_url");
				if(accessToken && instanceUrl) {
					console.log('Retrieving token from cache: ' + accessToken);
					resolve({accessToken, instanceUrl});

					stats.cacheHits += 1;
					let totalTime = performance.now() - start;
					stats.totalTime += totalTime;
					stats.totalCacheTime += totalTime;
					statistics.setStatistics(stats);

					return;
				}
			}

			console.log('Retrieving salesforce token for username ' + process.env.SALESFORCE_USERNAME);

			if(process.env.SALESFORCE_AUTHENTICATION_MODE === 'jwt') {
				const token = await getToken({
					iss: process.env.SALESFORCE_CLIENT_ID,
					sub: process.env.SALESFORCE_USERNAME,
					aud: process.env.SALESFORCE_AUDIENCE,
					privateKey: process.env.SALESFORCE_JWT_PRIVATE_KEY
				});

				console.log(token);

				accessToken = token.access_token;
				instanceUrl = token.instance_url;
				console.log('Retrieved token from salesforce: ' + accessToken);
				cache.set("access_token", accessToken, process.env.CACHE_TTL_SECONDS);
				cache.set("instance_url", instanceUrl);
				resolve({accessToken,instanceUrl});
			}
			else {

				var org = nforce.createConnection({
					clientId: process.env.SALESFORCE_CLIENT_ID,
					clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
					redirectUri: process.env.SALESFORCE_CALLBACK_URL,
					environment: process.env.SALESFORCE_ENVIRONMENT,  // optional, salesforce 'sandbox' or 'production', production default
					mode: 'single' // optional, 'single' or 'multi' user mode, multi default
				});

				org.authenticate({ username: process.env.SALESFORCE_USERNAME, password: process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_TOKEN},
					function(err, resp) {
						if(err) {
							stats.errors += 1;
							console.error(err);
							reject(err);
						}
						else {
							accessToken = org.oauth.access_token;
							instanceUrl = org.oauth.instance_url;
							console.log('Retrieved token from salesforce: ' + accessToken);
							cache.set("access_token", accessToken, process.env.CACHE_TTL_SECONDS);
							cache.set("instance_url", instanceUrl);
							resolve({accessToken,instanceUrl});
						}
					}
				);
			}

			stats.salesforceCalls += 1;
			let totalTime = performance.now() - start;
			stats.totalTime += totalTime;
			stats.totalSalesforceTime += totalTime;
			statistics.setStatistics(stats);
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