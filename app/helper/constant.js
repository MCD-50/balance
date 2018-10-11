import joi from "joi";
import currencyType from "../enum/currencyType";

export const config = require("../../configServer");
export const URL_BASE = "https://api.etherscan.io/api";

// redis
export const REDIS_BALANCE_LOCK = "PLATFORM_REDIS_BALANCE_LOCK";
export const REDIS_TRANSACTION_HEAD_ETH = "PLATFORM_REDIS_TRANSACTION_HEAD_ETH";
export const REDIS_TRANSACTION_HEAD_ERC = "PLATFORM_REDIS_TRANSACTION_HEAD_ERC";

// skip keys, payload clear keys
export const DEFAULT_SKIP_KEYS = ["baseObjectId", "deletedAt", "lockVersion"];
export const DEFAULT_PAYLOAD_UPDATE_KEYS = ["_id", "objectId", "deletedAt", "createdAt", "updatedAt", "lockVersion"];

// joi
export const DEFAULT_JOI_RESPONSE = { error: "Something went wrong", value: null };

// joi balance
export const CREATE_BALANCE_PAYLOAD = joi.object().keys({ accountAddress: joi.string().required(), currencyType: joi.string().valid(Object.keys(currencyType).map(key => currencyType[key])) });
export const GET_BALANCE_PAYLOAD = joi.object().keys({ accountAddress: joi.string().required(), currencyType: joi.string().valid(Object.keys(currencyType).map(key => currencyType[key])).required() });

// joi transaction
export const GET_TRANSACTION_PAYLOAD = joi.object().keys({ transactionHash: joi.string().required() });

// db fetch
export const DB_FETCH = {
	balance: ["_id", "accountAddress", "currentBalance", "currencyType", "createdAt", "lockVersion"],
	transaction: ["_id", "accountAddress", "deltaAccountAddress", "amount", "transactionHash", "blockNumber", "transactionType", "createdAt", "lockVersion"]
};


// messages
export const AUTH_ERROR = "Unauthorized or invalid OTP.";
export const DB_ERROR = "Something went wrong while processing data.";
export const NOT_ALLOWED = "Not Allowed.";
export const REDIS_ERROR = "Something went wrong while fetching data";
export const BAD_REQUEST_ERROR = "Bad request, Error in processing the payload";
export const OTHER_ERROR = "Something went wrong";
export const INTERNET_ERROR = "Unable to make internet request";