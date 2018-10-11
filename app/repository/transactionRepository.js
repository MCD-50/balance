import baseRepository from "../repository/baseRepository";
import dbHelper from "../helper/dbHelper";
import * as collection from "../common/collection";
import * as constant from "../helper/constant";

class DepositRepository extends baseRepository {
	constructor() {
		super("transaction");
		
		this._getItem = this._getItem.bind(this);
		this._updateItem = this._updateItem.bind(this);
	}

	_getItem(transactionHash, transaction = null) {
		if(!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise((resolve, reject) => {
			const where = { transactionHash };
			const options = transaction ? { transaction } : {};
			this.db.findOne({ where, ...options, attributes: constant.DB_FETCH[this.dbName.toLowerCase()] })
				.then(value => collection.dbCallback({ dbName: this.dbName, action: "get", value, error: null }, resolve))
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "get", value: null, error: error }, resolve));
		});
	}

	_updateItem(transactionHash, payload, transaction){
		if(!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise(async (resolve, reject) => {
			const where = { transactionHash };
			const options = {};
			if (transaction) {
				options.transaction = transaction;
			}

			payload = collection.cleanUpdatePayload(payload);
			this.db.update(payload, { where, ...options })
				.then(async value => {
					this.db.findOne({ where, ...options, attributes: constant.DB_FETCH[this.dbName.toLowerCase()] })
						.then(value => collection.dbCallback({ dbName: this.dbName, action: "get", value, error: null, }, resolve))
						.catch(error => collection.dbCallback({ dbName: this.dbName, action: "get", value: null, error: error }, resolve));
				})
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "get", value: null, error: error }, resolve));
		});
	}
}

export default DepositRepository;