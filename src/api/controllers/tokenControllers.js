var salesforce = require('../../salesforce');

exports.getToken = async function(req, res) {
	let refresh = req.query.refresh;
	refresh = refresh == "true" ? true : false;

	const accessToken = salesforce.salesforceAuthentication(refresh)
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