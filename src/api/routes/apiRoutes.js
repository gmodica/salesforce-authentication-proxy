'use strict';

module.exports = function(app) {
	var tokenController = require('../controllers/tokenControllers');

	// account routes
	app.route('/api/salesforce/token')
    .get(tokenController.getToken)
};