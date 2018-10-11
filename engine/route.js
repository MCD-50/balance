const routePath = require("path").join(__dirname, "../route");
import engineImport from "./engineHelper";

const route = async (app) => {
	await engineImport(app, routePath, true);
};

export default route;