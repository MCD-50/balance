//import target resolver path
export const routePath = require("path").join(__dirname, "../app/controllers/balanceController");

export const routes = [
	// endPoint: 'methodName:endpointName'
	{ method: "post", endPoint: "createBalance@createBalance", skipMiddleware: true },
	{ method: "get", endPoint: "getBalance@getBalance/:accountAddress/:currencyType", skipMiddleware: true },
	{ method: "post", endPoint: "filterBalance@filterBalance", skipMiddleware: true },
];
