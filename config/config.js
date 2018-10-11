const config = require("../configServer");

// postgres credentials and 

module.exports = {
	development: {
		username: config.postgresConfig.username,
		password: config.postgresConfig.password,
		database: config.postgresConfig.database,
		host: config.postgresConfig.host,
		dialect: "postgres",
	},
	test: {
		username: config.postgresConfig.username,
		password: config.postgresConfig.password,
		database: config.postgresConfig.database,
		host: config.postgresConfig.host,
		dialect: "postgres",
	},
	production: {
		username: config.postgresConfig.username,
		password: config.postgresConfig.password,
		database: config.postgresConfig.database,
		host: config.postgresConfig.host,
		dialect: "postgres",
		dialectOptions: config.postgresConfig.dialectOptions
	}
};