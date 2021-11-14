'use strict';

module.exports = function(app) {
	var tokenController = require('../controllers/tokenControllers');
	var tokenStatisticsController = require('../controllers/tokenStatisticsControllers');

	// account routes
	app.route('/api/salesforce/token')
		.get(tokenController.getToken);

	// stats routes
	app.route('/api/salesforce/token/statistics')
		.get(tokenStatisticsController.getStatistics);
	app.route('/api/salesforce/token/statistics/reset')
		.get(tokenStatisticsController.resetStatistics);
};