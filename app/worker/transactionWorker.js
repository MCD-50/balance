import workerType from "../enum/workerType";
import * as transactionService from "../service/transactionService";

const initWorker = (app) => {
	const kueClient = app.kueClient;

	// process list of transactions for an address
	kueClient.process(`${workerType.CREATE_}TRANSACTION_ETH` , 30, (job, done) => transactionService._createTransaction(app, job, done));
	kueClient.process(`${workerType.CREATE_}TRANSACTION_ERC` , 30, (job, done) => transactionService._createTransaction(app, job, done));
};

export default initWorker;