import joi from "joi";
import * as collection from "../common/collection";
import * as constant from "../helper/constant";
import statusType from "../enum/statusType";

// repository
import transactionRepositoryInstance from "../repository/transactionRepository";
const transactionRepository = new transactionRepositoryInstance();

export const getTransaction = async (req, res, next) => {
	const payload = req.params || null;
	const { error, value } = payload && joi.validate(payload, constant.GET_TRANSACTION_PAYLOAD) || constant.DEFAULT_JOI_RESPONSE;
	if (error || !value || (!error && !value)) return res.status(statusType.BAD_REQUEST).json(collection.getJsonError(error));
	const data = await transactionRepository._getItem(payload.transactionHash);
	if (data && data.value) {
		return res.status(statusType.SUCCESS).json(collection.getJsonResponse({ result: data.value }));
	} else {
		return res.status(statusType.DB_ERROR).json(collection.getJsonError(data.error || "Something went wrong"));
	}
};

export const filterTransaction = async (req, res, next) => {
	const payload = req.body && req.body.payload || {};
	if (!payload.filter) {
		payload.filter = {};
	}

	// allowed filters

	const data = await transactionRepository._filterItem(payload.filter, payload.paging || null);
	if (data && data.value) {
		return res.status(statusType.SUCCESS).json(collection.getJsonResponse({ result: data.value }));
	} else {
		return res.status(statusType.DB_ERROR).json(collection.getJsonError(data.error || "Something went wrong"));
	}
};

