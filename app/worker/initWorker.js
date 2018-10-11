import transactionWorker from "./transactionWorker";

const initWorker = (app) => {
	transactionWorker(app);
};

export default initWorker;