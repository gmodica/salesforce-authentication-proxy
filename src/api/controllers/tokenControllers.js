var salesforce = require('../../salesforce');

exports.getToken = async function(req, res) {
	let refresh = req.query.refresh;
	refresh = refresh == "true" ? true : false;

	const accessToken = salesforce.salesforceAuthentication(refresh)
		.then(tokenInfo => {
			res.json({
				access_token: tokenInfo.accessToken,
				instance_url: tokenInfo.instanceUrl
			});

			res.status(200).end();
		})
		.catch(err => {
			console.error(err);
			res.status(500).send("Error " + err);
		});
};