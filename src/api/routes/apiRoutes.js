'use strict';

module.exports = function(app) {
	var tokenController = require('../controllers/tokenControllers');
	var statsController = require('../controllers/statsControllers');

	// account routes
	app.route('/api/salesforce/token')
		.get(tokenController.getToken);

	// stats routes
	app.route('/api/statistics')
		.get(statsController.getStatistics);
	app.route('/api/statistics/reset')
		.get(statsController.resetStatistics);
};