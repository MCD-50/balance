const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const kue = require("kue");
const kueUI = require("kue-ui-express");
const redis = require("redis");
const sequelize = require("sequelize");
const injectionCheckLib = require("./app/lib/injectionCheckLib");

import * as constant from "./app/helper/constant";
import * as collection from "./app/common/collection";
import redisHelper from "./app/helper/redisHelper";
import logMessage from "./app/helper/loggerHelper";
import workers from "./app/worker/initWorker";


const app = express();
const server = require("http").createServer(app);

app.redisClient = null;
app.postgresClient = null;
app.jwtData = null;

// middleware
app.use(collection.logRequest); // show all traffic at the server
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(injectionCheckLib);


const postgresClient = new sequelize(constant.config.postgresConfig.database, constant.config.postgresConfig.username, constant.config.postgresConfig.password, {
	host: constant.config.postgresConfig.host,
	dialect: "postgres",
	logging: false,
	define: constant.config.postgresConfig.define,
});

//setup postgres
postgresClient.authenticate().then(() => {
	app.postgresClient = postgresClient;
	logMessage("POSTGRES", "Postgres is up and running on server");

	//setup redis
	const redisClient = redis.createClient(constant.config.redisConfig);
	redisClient.on("error", err => console.error.bind(console, err));
	redisClient.on("ready", async () => {
		app.redisClient = redisClient;
		app.redisHelper = redisHelper(redisClient);
	});

	// setup route
	require("./engine").default(app);

	// setup kue
	const kueClient = kue.createQueue(constant.config.kue);
	kueClient.setMaxListeners(90);
	app.kueClient = kueClient;

	kueUI(app, "/kue/", "/kue-api");
	app.use("/kue-api/", kue.app);

	// init workers
	workers(app);

	// start server
	server.listen(constant.config.port, constant.config.host, async () => {
		logMessage("APP", `Server running on port ${constant.config.port} and on host ${constant.config.host}.....`);
		
		// handle unhandled exception
		process.on("unhandledRejection", (reason, promise) => {
			logMessage("APP_ERROR", reason, promise);
		});
	});
}).catch(err => console.log(err));