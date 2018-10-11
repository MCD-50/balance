//import target resolver path
export const routePath = require("path").join(__dirname, "../app/controllers/transactionController");

export const routes = [
	// endPoint: 'methodName:endpointName'
	{ method: "get", endPoint: "getTransaction@getTransaction/:transactionHash", skipMiddleware: true },
	{ method: "post", endPoint: "filterTransaction@filterTransaction", skipMiddleware: true },
];
