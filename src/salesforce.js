var nforce = require('nforce');
const NodeCache = require( "node-cache" );
const cache = new NodeCache();

exports.salesforceAuthentication = function() {
	return new Promise((resolve, reject) => {
		try {
			let accessToken = cache.get("access_token");
			if(accessToken) {
				console.log('Retrieving token from cache: ' + accessToken);
				resolve(accessToken);
				return;
			}

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
						console.error(err);
						reject(err);
					}
					else {
						accessToken = org.oauth.access_token;
						console.log('Retrieving token from salesforce: ' + accessToken);
						cache.set("access_token", accessToken, process.env.CACHE_TTL_SECONDS);
						resolve(accessToken);
					}
				}
			);
		}
		catch(err) {
			reject(err);
		}
	});
}