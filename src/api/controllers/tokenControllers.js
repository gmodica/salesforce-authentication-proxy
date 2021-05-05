var salesforce = require('../../salesforce');

exports.getToken = async function(req, res) {
	const accessToken = salesforce.salesforceAuthentication()
		.then(accessToken => {
			res.json({
				access_token: accessToken
			});

			res.status(200).end();
		})
		.catch(err => {
			console.error(err);
			res.status(500).send("Error " + err);
		});
};