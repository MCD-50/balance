import * as constant from "../helper/constant";
import * as collection from "../common/collection";
import logMessage from "../helper/loggerHelper";

// repositories
import balanceRepositoryInstance from "../repository/balanceRepository";
const balanceRepository = new balanceRepositoryInstance();

// clients
import etherscanClientInstance from "../client/etherscanClient";
const etherscanClient = new etherscanClientInstance();

// service
import * as lockService from "../service/lockService";
import currencyType from "../enum/currencyType";
import workerType from "../enum/workerType";


export const _createBalance = (app, payload) => {
	return new Promise(async (resolve, reject) => {

		// set ether as default supporting only ether for now
		payload.currencyType = currencyType.ETHER;
		payload.accountAddress = String(payload.accountAddress).toLowerCase();
	
		// first get redis lock so that only address can be created per currency lock
		const sourceKey = `${constant.REDIS_BALANCE_LOCK}_${payload.accountAddress}_${payload.currencyType}`;
		const locked = await lockService.getLock(app, sourceKey);
		if (locked.error) {
			return resolve({ error: "Unable to access data. Please try after some time." });
		}

		// make network request
		const _resultBalance = await etherscanClient.getAccountBalance(payload.accountAddress);
		if (!_resultBalance) {
			// release lock
			await lockService.releaseLock(app, sourceKey);
			return resolve({ error: "Something went wrong." });
		}

		// since we are adding independent balance we dont need to execute in transaction
		// slow check to db

		const balance = await balanceRepository._getItem(payload.accountAddress, payload.currencyType);
		if (balance && balance.value) {
			// release lock
			await lockService.releaseLock(app, sourceKey);
			
			// update the balance
			_updateBalance(app, payload);
			return resolve({ error: "Balance already exists and is synced with blockchainChain" });
		}

		const balancePayload = { accountAddress: payload.accountAddress, currencyType: payload.currencyType, currentBalance: _resultBalance.balance };
		const data = await balanceRepository._createItem(balancePayload);

		// release lock
		await lockService.releaseLock(app, sourceKey);
		if (data && data.value) {
			// add new transactions
			app.kueClient.create(`${workerType.CREATE_}TRANSACTION_ETH`, { accountAddress: payload.accountAddress, currencyType: currencyType.ETHER }).attempts(constant.config.utils.normalFailRetryCount).backoff({ delay: constant.config.utils.frequentFailBackoff, type: "fixed" }).save();
			app.kueClient.create(`${workerType.CREATE_}TRANSACTION_ERC`, { accountAddress: payload.accountAddress, currencyType: "ERC" }).delay(constant.config.utils.frequentFailBackoff).attempts(constant.config.utils.normalFailRetryCount).backoff({ delay: constant.config.utils.frequentFailBackoff, type: "fixed" }).save();
			return resolve({ value: true });
		} else {
			return resolve({ error: "Unable to create balance." });
		}
	});
};

export const _updateBalance = (app, payload) => {
	return new Promise(async (resolve, reject) => {
		// set ether as default
		payload.currencyType = currencyType.ETHER;

		// first get redis lock to lock updates to this address and currency
		const sourceKey = `${constant.REDIS_BALANCE_LOCK}_${payload.accountAddress}_${payload.currencyType}`;
		const locked = await lockService.getLock(app, sourceKey);
		if (locked.error) {
			return resolve({ error: "Unable to access data. Please try after some time." });
		}

		// this is an independent function hence if we call from other function 
		// there might be double checks
		const balance = await balanceRepository._getItem(payload.accountAddress, payload.currencyType);
		if (balance && balance.error) {
			// release lock
			await lockService.releaseLock(app, sourceKey);
			return resolve({ error: "Balance does not exists" });
		}

		// make network request
		const _resultBalance = await etherscanClient.getAccountBalance(payload.accountAddress);
		if (!_resultBalance) {
			// release lock
			await lockService.releaseLock(app, sourceKey);
			return resolve({ error: "Something went wrong." });
		}

		// add new transactions
		app.kueClient.create(`${workerType.CREATE_}TRANSACTION_ETH`, { accountAddress: payload.accountAddress, currencyType: currencyType.ETHER }).attempts(constant.config.utils.normalFailRetryCount).backoff({ delay: constant.config.utils.frequentFailBackoff, type: "fixed" }).save();
		app.kueClient.create(`${workerType.CREATE_}TRANSACTION_ERC`, { accountAddress: payload.accountAddress, currencyType: "ERC" }).delay(constant.config.utils.frequentFailBackoff).attempts(constant.config.utils.normalFailRetryCount).backoff({ delay: constant.config.utils.frequentFailBackoff, type: "fixed" }).save();

		// lets take transactional lock in here (Locking is optional.)
		const transaction = await app.postgresClient.transaction();
		try {
			const updatedBalance = collection.safeParseFloat(_resultBalance.balance);
			balance.value.currentBalance = String(updatedBalance);
			const trx1 = await balanceRepository._saveItem(balance.value, transaction);
			if (trx1 && trx1.error) throw { error: trx1.error || "Something went wrong." };

			// release the lock
			await lockService.releaseLock(app, sourceKey);

			//commit trx
			await transaction.commit();
			return resolve({ value: true });
		} catch (error) {
			logMessage("BALANCE SERVICE", "Something went wrong", error);

			// release the lock
			await lockService.releaseLock(app, sourceKey);

			//rollback trx
			transaction && await transaction.rollback();
			return resolve({ error: "Unable to update balance." });
		}
	});
};