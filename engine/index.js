//get root folder
const enginePath = require("path").join(__dirname, "");
import engineImport  from "./engineHelper";

const initRouteAndSchema = async (app) => {
	await engineImport(app, enginePath);
};

export default initRouteAndSchema;