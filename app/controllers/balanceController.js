import joi from "joi";
import * as collection from "../common/collection";
import * as constant from "../helper/constant";
import statusType from "../enum/statusType";

// repository
import balanceRepositoryInstance from "../repository/balanceRepository";
const balanceRepository = new balanceRepositoryInstance();

//service
import * as balanceService from "../service/balanceService";

export const createBalance = async (req, res, next) => {
	const app = req.app;
	const payload = req.body && req.body.payload || null;
	const { error, value } = payload && joi.validate(payload, constant.CREATE_BALANCE_PAYLOAD) || constant.DEFAULT_JOI_RESPONSE;
	if (error || !value || (!error && !value)) return res.status(statusType.BAD_REQUEST).json(collection.getJsonError(error));

	const data = await balanceService._createBalance(app, payload);
	if (data && data.value) {
		return res.status(statusType.SUCCESS).json(collection.getJsonResponse({ result: true }));
	} else {
		return res.status(statusType.DB_ERROR).json(collection.getJsonError(data.error || "Something went wrong"));
	}
};

export const getBalance = async (req, res, next) => {
	const app = req.app;
	const payload = req.params || null;
	const { error, value } = payload && joi.validate(payload, constant.GET_BALANCE_PAYLOAD) || constant.DEFAULT_JOI_RESPONSE;
	if (error || !value || (!error && !value)) return res.status(statusType.BAD_REQUEST).json(collection.getJsonError(error));
	const data = await balanceRepository._getItem(payload.accountAddress, payload.currencyType);

	if (data && data.value) {
		// here call update update balance or other solution is to use socket or cron job
		const updatePayload = { accountAddress: payload.accountAddress, currencyType: payload.currencyType };
		await balanceService._updateBalance(app, updatePayload);

		return res.status(statusType.SUCCESS).json(collection.getJsonResponse({ result: data.value }));
	} else {
		return res.status(statusType.DB_ERROR).json(collection.getJsonError(data.error || "Something went wrong"));
	}
};

export const filterBalance = async (req, res, next) => {
	const payload = req.body && req.body.payload || {};
	if (!payload.filter) {
		payload.filter = {};
	}

	// allowed filters

	const data = await balanceRepository._filterItem(payload.filter, payload.paging || null);
	if (data && data.value) {
		return res.status(statusType.SUCCESS).json(collection.getJsonResponse({ result: data.value }));
	} else {
		return res.status(statusType.DB_ERROR).json(collection.getJsonError(data.error || "Something went wrong"));
	}
};

