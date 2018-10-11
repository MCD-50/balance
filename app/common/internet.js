import axios from "axios";
import * as collection from "./collection";
import * as constant from "../helper/constant";
import logMessage from "../helper/loggerHelper";

export const makeRequest = (endpoint, base = null, method = "GET", token = null, data = null) => {
	return new Promise((resolve, reject) => {
		let url = endpoint;
		if (base) {
			url = base + endpoint;
		}

		const options = collection.getOptions(url, method, token, data);
		axios(options)
			.then((res) => {
				console.log(options);
				if (res && res.data && res.data.result && res.data.message == "OK" && res.data.status == "1") {
					return resolve(res.data.result);
				} else if (res && res.data && res.data.result && res.data.message == "No transactions found" && res.data.status == "0"){
					return resolve([]);
				}
				resolve(null);
			})
			.catch((err) => {
				const _err = { config: err.config || null, data: err.response && err.response.data || null };
				logMessage("INTERNET", constant.INTERNET_ERROR, _err);
				resolve(null);
			});
	});
};