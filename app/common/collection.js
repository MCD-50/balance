import uuid from "uuid/v1";
import deleteKey from "key-del";
import logMessage from "../helper/loggerHelper";
import sequelize from "sequelize";
import { BigNumber } from "bignumber.js";
import * as constant from "../helper/constant";

export const Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) { var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) { n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64; } else if (isNaN(i)) { a = 64; } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a); } return t; }, decode: function (e) { var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/[^A-Za-z0-9+/=]/g, ""); while (f < e.length) { s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) { t = t + String.fromCharCode(r); } if (a != 64) { t = t + String.fromCharCode(i); } } t = Base64._utf8_decode(t); return t; }, _utf8_encode: function (e) { e = e.replace(/rn/g, "n"); var t = ""; for (var n = 0; n < e.length; n++) { var r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); } else if (r > 127 && r < 2048) { t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128); } else { t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128); } } return t; }, _utf8_decode: function (e) { var t = ""; var n = 0; var r = 0; var c2 = 0; var c3 = 0; while (n < e.length) { r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); n++; } else if (r > 191 && r < 224) { c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2; } else { c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3; } } return t; } };
export const getUUID = () => {
	return uuid();
};

export const convertFromPrecision = (amount, precision = 18) => {
	return new BigNumber(amount).div((new BigNumber(10)).pow(precision)).toString();
};

export const getJsonResponse = (res, retainKeys = []) => {
	res = dirtyConvertToPlainData(res);
	let validDeleteKeys = constant.DEFAULT_SKIP_KEYS;
	for (let i = 0; i < retainKeys.length; i++) {
		validDeleteKeys = validDeleteKeys.filter(key => key != retainKeys[i]);
	}

	res = deleteKey(res, validDeleteKeys);
	return res;
};

// preparing the error
export const getJsonError = (errors) => {
	if (Array.isArray(errors)) {
		return { errors: errors };
	} else if (errors && errors.isJoi && errors.details && errors.details.length > 0) {
		errors = errors.details.map(error => error.message);
		logMessage("JOI ERROR", errors.toString());

		// In case of production return this kind of error and report via any reporting client
		//return { errors: ["Something went wrong while validating the payload. Please try again."] };
		return { errors: errors };
	} else if (typeof errors == "object" && errors && !errors.response) {
		return { errors: [errors] };
	} else if (typeof errors == "object" && errors && errors.response) {
		const data = errors.response.data || "Something went wrong";
		return { errors: [data] };
	} else if (typeof errors == "string") {
		return { errors: [errors] };
	} else if (errors) {
		return { errors: errors };
	} else {
		return { errors: ["Something went wrong"] };
	}
};

export const getSanitizedItem = (item, retainKeys) => {
	// delete keys
	item = Object.assign({}, item);
	const defaultKeys = constant.DEFAULT_SKIP_KEYS;
	defaultKeys.map(key => {
		if (item[key] != null && retainKeys.filter(rkey => rkey == key).length < 1) {
			delete item[key];
		}
	});

	return item;
};

export const logRequest = (req, res, next) => {
	let ip = "Unknown";
	try {
		ip = req.headers && req.headers["x-forwarded-for"] && req.headers["x-forwarded-for"].split(",").pop() || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || req.connection && req.connection.socket && req.connection.socket.remoteAddress;
	} catch (exe) {
		// fail silently
	}

	req.headers["ip-address"] = ip || "Unknown";
	if (!req.originalUrl.includes("/kue-api")) {
		logMessage("REQUEST", `${req.method} from ${req.originalUrl} where ip is ${ip}`);
		res.on("finish", () => {
			logMessage("REQUEST_FINISH", `${res.statusCode} ${res.statusMessage}; ${res.get("Content-Length") || 0}b sent`);
		});
	}
	next();
};

export const safeParseFloat = (value, defaultValue = 0) => {
	if ((value == null || value == undefined) || isNaN(value) || (typeof (value) == "string" && value.length < 1)) {
		return defaultValue;
	} else {
		try {
			const parsedValue = Number(Number(value).toFixed(8));
			if (parsedValue < 0 || isNaN(parsedValue)) {
				return 0;
			}
			return parsedValue;
		} catch (exe) {
			logMessage("PARSE FLOAT", "Something went wrong", exe);
			return 0;
		}
	}
};

export const safeAdd = (value1, value2, defaultValue = 0) => {
	if ((value1 == null || value1 == undefined) || isNaN(value1) || (typeof (value1) == "string" && value1.length < 1)
		|| (value2 == null || value2 == undefined) || isNaN(value2) || (typeof (value2) == "string" && value2.length < 1)) {
		throw new Error({ error: "Invalid values..." });
	} else {
		try {
			const parsedValue1 = Number(Number(value1).toFixed(8));
			const parsedValue2 = Number(Number(value2).toFixed(8));
			if (parsedValue1 < 0 || isNaN(parsedValue1) || parsedValue2 < 0 || isNaN(parsedValue2)) {
				throw new Error({ error: "Invalid values..." });
			}
			const resultantValue = parseFloat(parsedValue1 + parsedValue2).toFixed(8);
			return parseFloat(resultantValue);
		} catch (exe) {
			logMessage("PARSE FLOAT", "Something went wrong", exe);
			throw new Error({ error: "Invalid values..." });
		}
	}
};

export const safeMultiply = (value1, value2, defaultValue = 0) => {
	if ((value1 == null || value1 == undefined) || isNaN(value1) || (typeof (value1) == "string" && value1.length < 1)
		|| (value2 == null || value2 == undefined) || isNaN(value2) || (typeof (value2) == "string" && value2.length < 1)) {
		throw new Error({ error: "Invalid values..." });
	} else {
		try {
			const parsedValue1 = Number(Number(value1).toFixed(8));
			const parsedValue2 = Number(Number(value2).toFixed(8));
			if (parsedValue1 < 0 || isNaN(parsedValue1) || parsedValue2 < 0 || isNaN(parsedValue2)) {
				throw new Error({ error: "Invalid values..." });
			}
			const resultantValue = parseFloat(parsedValue1 * parsedValue2).toFixed(8);
			return parseFloat(resultantValue);
		} catch (exe) {
			logMessage("PARSE FLOAT", "Something went wrong", exe);
			throw new Error({ error: "Invalid values..." });
		}
	}
};

export const safeSubtract = (value1, value2, defaultValue = 0) => {
	if ((value1 == null || value1 == undefined) || isNaN(value1) || (typeof (value1) == "string" && value1.length < 1)
		|| (value2 == null || value2 == undefined) || isNaN(value2) || (typeof (value2) == "string" && value2.length < 1)) {
		throw new Error({ error: "Invalid values..." });
	} else {
		try {
			const parsedValue1 = Number(Number(value1).toFixed(8));
			const parsedValue2 = Number(Number(value2).toFixed(8));
			if (parsedValue1 < 0 || isNaN(parsedValue1) || parsedValue2 < 0 || isNaN(parsedValue2)) {
				throw new Error({ error: "Invalid values..." });
			}

			if (parsedValue1 > parsedValue2) {
				return parseFloat(parseFloat(parsedValue1 - parsedValue2).toFixed(8));
			} else {
				return parseFloat(parseFloat(parsedValue2 - parsedValue1).toFixed(8));
			}
		} catch (exe) {
			logMessage("PARSE FLOAT", "Something went wrong", exe);
			throw new Error({ error: "Invalid values..." });
		}
	}
};

export const safeDivide = (value1, value2, defaultValue = 0) => {
	if ((value1 == null || value1 == undefined) || isNaN(value1) || (typeof (value1) == "string" && value1.length < 1)
		|| (value2 == null || value2 == undefined) || isNaN(value2) || (typeof (value2) == "string" && value2.length < 1)) {
		throw new Error({ error: "Invalid values..." });
	} else {
		try {
			const parsedValue1 = Number(Number(value1).toFixed(8));
			const parsedValue2 = Number(Number(value2).toFixed(8));
			if (parsedValue1 < 0 || isNaN(parsedValue1) || parsedValue2 < 0 || isNaN(parsedValue2)) {
				throw new Error({ error: "Invalid values..." });
			}

			if (parsedValue2 > 0) {
				return parseFloat(parseFloat(parsedValue1 / parsedValue2).toFixed(8));
			} else {
				throw new Error({ error: "Invalid values..." });
			}
		} catch (exe) {
			logMessage("PARSE FLOAT", "Something went wrong", exe);
			throw new Error({ error: "Invalid values..." });
		}
	}
};

export const removeSpecialCharacters = (data) => {
	if (data) {
		return data.replace(/[^\w\s]/gi, "");
	}
	return "";
};


// routing utils
export const getFileUrl = (...args) => {
	return args.length > 1 ? args.join("/") : "./" + args;
};

export const getJsonFromString = (jsonString) => {
	try {
		jsonString = passJsonCheck(jsonString);
		return JSON.parse(jsonString);
	} catch (exe) {
		logMessage("JSON PARSE", exe);
	}
	return jsonString;
};

export const passJsonCheck = (jsonString) => {
	try {
		jsonString = jsonString.replace(/(^')|('$)/g, "");
		jsonString = jsonString.replace(/(^")|("$)/g, "");
		return jsonString;
	}
	catch (exe) {
		return jsonString;
	}
};

export const getStringFromJson = (json) => {
	if (typeof json == "string") {
		return json;
	}
	return JSON.stringify(json);
};


export const getOptions = (url, method, token, data) => {
	let options = {
		method: method || "GET",
		url: url,
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
		}
	};

	if (token) {
		options.headers["Authorization"] = token;
	}

	if (data) {
		options["method"] = method || "POST";
		options["data"] = data;
	}

	return options;
};

export const validateEthereumAddress = (address) => {
	if (!address) {
		return false;
	}

	// or use the web3 client
	if (/^(0x){1}[0-9a-fA-F]{40}$/i.test(address)) {
		return true;
	}

	return false;
};


export const getSortBy = (sortPayload) => {
	if (sortPayload && sortPayload.sortBy) {
		const sort = {};
		sort[sortPayload.sortBy.key] = parseInt(sortPayload.sortBy.value);
		return { ...sort, "createdAt": parseInt("-1") };
	}
	return { "createdAt": parseInt("-1") };
};

export const getArrayFromObject = (params, defaultValue) => {
	if (params == null || params == undefined) {
		return defaultValue;
	}
	return Object.keys(params).map(x => x);
};


export const removeDuplicates = (keyFn, array) => {
	let set = new Set();
	return array.filter((x) => {
		let key = keyFn(x), isNew = !set.has(key);
		if (isNew) set.add(key);
		return isNew;
	});
};

export const cleanUpdatePayload = (payload, skipKeys = []) => {
	const removeKeys = constant.DEFAULT_PAYLOAD_UPDATE_KEYS.filter(x => !skipKeys.includes(x));
	if (payload) {
		removeKeys.map(key => {
			if (payload[key]) {
				delete payload[key];
			}
		});
		return payload;
	}
	return {};
};

export const dirtyConvertToPlainData = (response) => {
	const jsonString = JSON.stringify(response); //convert to string to remove the sequelize specific meta data
	return getJsonFromString(jsonString); //to make plain json
};

export const parseSequalizeErrorMessage = (error) => {
	if (error && error.name == "SequelizeDatabaseError") {
		if (error.parent) {
			return "Unable to process data at the moment.";
		}
	} else if (error && error.name == "SequelizeValidationError") {
		if (error.errors && error.errors.length > 0) {
			return error.errors.map(e => e.message + "\t" || constant.DB_ERROR);
		}
	} else if (error && error.name == "SequelizeUniqueConstraintError") {
		if (error.errors && error.errors.length > 0) {
			return error.errors.map(e => e.message + "\n" || constant.DB_ERROR);
		}
	}
	return constant.DB_ERROR;
};

export const dbCallback = (payload, resolve) => {
	let { error, value, action, dbName } = payload;
	if (error) {
		const parsedError = parseSequalizeErrorMessage(error);
		logMessage(dbName, `${constant.DB_ERROR} ${action}`, error);
		resolve({ error: parsedError });
	} else if (!value) {
		resolve({ error: "Invalid information provided." });
	} else if (action == "list" && value && value.rows) {
		const result = value;
		value = {};
		value["data"] = result["rows"].slice() || [];
		value["count"] = result["count"];
		resolve({ value });
	} else if (value) {
		resolve({ value });
	} else {
		resolve({ error: "Something went wrong." });
	}
};

export const beautifyFilter = (filter) => {
	if (filter) {
		filter = Object.keys(filter).map(key => {
			if (typeof filter[key] == "boolean" || typeof filter[key] == "string" || typeof filter[key] == "number") {
				if (typeof filter[key] == "string" && filter[key].includes(">")) {
					return { [key]: { [sequelize.Op.gt]: removeSpecialCharacters(filter[key]) } };
				} else if (typeof filter[key] == "string" && filter[key].includes("<")) {
					return { [key]: { [sequelize.Op.lt]: removeSpecialCharacters(filter[key]) } };
				} else if (typeof filter[key] == "string" && filter[key].includes("!")) {
					return { [key]: { [sequelize.Op.ne]: removeSpecialCharacters(filter[key]) } };
				} else if (typeof filter[key] == "string" && filter[key].includes("%")) {
					return { [key]: { [sequelize.Op.regexp]: `^${removeSpecialCharacters(filter[key])}` } };
				}
				return { [key]: removeSpecialCharacters(filter[key]) };
			} else if (Array.isArray(filter[key])) {
				//sanitize all items
				const items = filter[key].map(x => removeSpecialCharacters(x));
				return { [key]: { [sequelize.Op.or]: items } };
			}
			return null;
		}).filter(item => item != null)
			.reduce((result, item) => {
				const key = Object.keys(item)[0];
				result[key] = item[key];
				return result;
			}, {});

		console.log(filter.accountAddress);
		return filter;
	} else {
		return Object.assign({}, {});
	}
};

export const beautifyPaging = (paging) => {
	const pagingObject = {};
	if (paging && paging.page && paging.limit) {
		pagingObject.offset = (parseInt(paging.page) - 1) * parseInt(paging.limit) || 0;
		pagingObject.limit = paging.limit || 10;
	}

	pagingObject.order = [];
	if (paging && paging.sortBy && paging.sortBy.key && paging.sortBy.value && (paging.sortBy.value.toUpperCase() == "DESC" || paging.sortBy.value.toUpperCase() == "ASC") && paging.sortBy.key != "createdAt") {
		pagingObject.order.push([paging.sortBy.key, paging.sortBy.value.toUpperCase()]);
	}


	// this is very default
	pagingObject.order.push(["createdAt", "DESC"]);

	return Object.assign({}, { ...pagingObject });
};