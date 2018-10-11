const fs = require("fs");
import * as collection from "../app/common/collection";
import * as constant from "../app/helper/constant";
import * as authenticate from "../middleware/authenticate";
import * as lockHelper from "../app/helper/lockHelper";
import logMessage from "../app/helper/loggerHelper";


const sequelize = require("sequelize");

//import all .js files in current folder and ignores index.js and any folder
const engineImport = (app, folder_path, isRoute = false) => {
	return new Promise(async (resolve, reject) => {
		const promisify = fs.readdirSync(folder_path)
			.filter(x => !x.includes("index.js") && !x.includes("engineHelper.js"))
			.filter(x => x.includes(".js"))
			.map(async (file, index) => {
				return new Promise(async (resolve, reject) => {
					const file_path = collection.getFileUrl(folder_path, file);
					if (!require("fs").statSync(file_path).isDirectory()) {
						if (isRoute) {
							const routes = require(file_path).routes;
							const basePath = require(require(file_path).routePath);
							if (routes && routes.length > 0) {
								routes.map(x => {
									const parts = x.endPoint.split("@");
									logMessage("ROUTES", `${x.method} => ${constant.config.utils.apiPrefix}/${parts[1]}`);

									if (x.middleware) {
										app[x.method](`${constant.config.utils.apiPrefix}/${parts[1]}`, x.middleware, basePath[parts[0]]);
									} else if (x.skipMiddleware) {
										app[x.method](`${constant.config.utils.apiPrefix}/${parts[1]}`, basePath[parts[0]]);
									} else {
										app[x.method](`${constant.config.utils.apiPrefix}/${parts[1]}`, authenticate.authenticateRequest, basePath[parts[0]]);
									}
								});
							}
						} else {
							// lets just sleep and init schema one by one
							await lockHelper.sleep(100 * index);
							require(file_path).default(app);
						}
						resolve(1);
					}
				});
			});
		Promise.all(promisify).then(values => {
			resolve(values);
		});
	});
};

export default engineImport;