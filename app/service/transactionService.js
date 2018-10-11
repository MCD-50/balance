import * as constant from "../helper/constant";
import transactionType from "../enum/transactionType";
import logMessage from "../helper/loggerHelper";
import workerType from "../enum/workerType";
import currencyType from "../enum/currencyType";

// repositories
import balanceRepositoryInstance from "../repository/balanceRepository";
import transactionRepositoryInstance from "../repository/transactionRepository";
const balanceRepository = new balanceRepositoryInstance();
const transactionRepository = new transactionRepositoryInstance();

// clients
import etherscanClientInstance from "../client/etherscanClient";
const etherscanClient = new etherscanClientInstance();


export const _createTransaction = async (app, job, done) => {
	const payload = job.data;
	if (!payload.accountAddress) {
		logMessage("TRANSACTION SERVICE", "No accountAddress is provided.");
		return done();
	}

	// assuming ether for everything once there are diffrent currencies this can be changes
	if (!payload.currencyType) {
		payload.currencyType = currencyType.ETHER;
	}

	// here we will get the accountAddress, currencyType, page , offset
	// set default value if no value
	payload.page = payload.page || 1;
	payload.offset = payload.offset || 100;

	// check if accountAddress exist in balance
	const balance = await balanceRepository._getItem(payload.accountAddress, currencyType.ETHER);
	if (balance && balance.error) {
		// since accountAddress does not exists no point in trying again
		logMessage("TRANSACTION SERVICE", "Unable to get balance.");
		return done();
	}

	// fetch data
	let transactions = [];
	if (payload.currencyType == currencyType.ETHER) {
		transactions = await etherscanClient.getTransactionList(payload.accountAddress, payload.page, payload.offset);
	} else {
		transactions = await etherscanClient.getTransactionListForErc(payload.accountAddress, payload.page, payload.offset);
	}

	if (!transactions) {
		logMessage("TRANSACTION SERVICE", "Unable to get data from etherscan");
		return done(new Error("Unable to get data from etherscan."));
	}

	if (transactions.count < 1) {
		logMessage("TRANSACTION SERVICE", "No transaction found for ERC");
		return done();
	}

	const transactionLength = transactions.count;

	// map transactions and allow only greater head transactions only
	const redisKey = payload.currencyType == currencyType.ETHER ? constant.REDIS_TRANSACTION_HEAD_ETH : constant.REDIS_TRANSACTION_HEAD_ERC;
	const transactionHead = await app.redisHelper.hget(redisKey, payload.accountAddress);
	if (transactionHead) {
		transactions = transactions.result.map(x => {
			if (Number(x.blockNumber) > Number(transactionHead)) {
				return Object.assign({}, { ...x });
			}
			return null;
		}).filter(x => x != null).slice();
	} else {
		transactions = transactions.result.slice();
	}

	// add items one by one set latest trx hash in redis
	// set data
	if (transactions.length > 0) {
		await _pushTransactions(app, payload.accountAddress, redisKey, transactions);
		// mark this job as completed
		done();
		// if length == 100 then there are more results
		if (transactionLength == 100) {
			// start a new delayed job
			if (payload.currencyType == currencyType.ETHER) {
				app.kueClient.create(`${workerType.CREATE_}TRANSACTION_ETH`, { accountAddress: payload.accountAddress, currencyType: currencyType.ETHER, page: Number(payload.page) + 1, offset: payload.offset }).attempts(constant.config.utils.normalFailRetryCount).backoff({ delay: constant.config.utils.delayedBackoff, type: "fixed" }).save();
			} else {
				app.kueClient.create(`${workerType.CREATE_}TRANSACTION_ERC`, { accountAddress: payload.accountAddress, currencyType: "ERC", page: Number(payload.page) + 1, offset: payload.offset }).attempts(constant.config.utils.normalFailRetryCount).backoff({ delay: constant.config.utils.delayedBackoff, type: "fixed" }).save();
			}
		}
	} else {
		return done();
	}
};


const _pushTransactions = async (app, accountAddress, redisKey, transactions) => {
	return new Promise((resolve, reject) => {
		// get latest added block

		let latestAddedBlock = 0;

		const promisify = transactions.map(x => {
			return new Promise(async (resolve, reject) => {
				// since trx hash needs to be unique just keep on adding stuff

				const _transactionType = accountAddress == x.from ? transactionType.WITHDRAW : transactionType.DEPOSIT;
				const _deltaAccountAddress = accountAddress == x.from ? x.to : x.from;
				const transactionPayload = {
					accountAddress: accountAddress,
					deltaAccountAddress: _deltaAccountAddress,
					amount: x.amount,
					transactionHash: x.transactionHash,
					blockNumber: x.blockNumber,
					transactionType: _transactionType,
					currencyType: x.currencyType,
				};

				const data = await transactionRepository._createItem(transactionPayload);
				if (data && data.value) {
					if (latestAddedBlock < Number(transactionPayload.blockNumber)) {
						latestAddedBlock = Number(transactionPayload.blockNumber);
					}
					return resolve({ value: "Added to DB" });
				} else {
					logMessage("TRANSACTION SERVICE", "Unable to add transaction.");
					// notify via reporting tool
					// not enough time to implement this as task is only of 5 hours
					// we can save these block in redis and retry after sometime using a cron
					return resolve(null);
				}
			});
		});

		Promise.all(promisify).then(async addedValues => {
			await app.redisHelper.hmset(redisKey, accountAddress, String(latestAddedBlock));
			resolve(1);
		});
	});
};