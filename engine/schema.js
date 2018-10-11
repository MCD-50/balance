const routePath = require("path").join(__dirname, "../schema");
import engineImport from "./engineHelper";
import relationshipLib from "../app/lib/relationshipLib";
import logMessage from "../app/helper/loggerHelper";

const route = async (app) => {
	await engineImport(app, routePath, false);
	relationshipLib();
	logMessage("SCHEMA", "Schema loaded and relation triggered.");
};

export default route;