import baseRepository from "../repository/baseRepository";
import dbHelper from "../helper/dbHelper";
import * as collection from "../common/collection";
import * as constant from "../helper/constant";

class BalanceRepository extends baseRepository {
	constructor() {
		super("balance");

		this._getItem = this._getItem.bind(this);
		this._updateItem = this._updateItem.bind(this);
	}

	_getItem(accountAddress, currencyType, transaction = null) {
		if (!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise((resolve, reject) => {
			const where = { accountAddress, currencyType };
			const options = transaction ? { transaction } : {};
			this.db.findOne({ where, ...options, attributes: constant.DB_FETCH[this.dbName.toLowerCase()] })
				.then(value => collection.dbCallback({ dbName: this.dbName, action: "get", value, error: null, }, resolve))
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "get", value: null, error: error }, resolve));
		});
	}

	_updateItem(accountAddress, currencyType, payload, transaction) {
		if (!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise(async (resolve, reject) => {
			const where = { accountAddress, currencyType };
			const options = {};
			if (transaction) {
				options.transaction = transaction;
			}

			// clean payload
			payload = collection.cleanUpdatePayload(payload);
			this.db.update(payload, { where, ...options })
				.then(async value => {
					this.db.findOne({ where, ...options, attributes: constant.DB_FETCH[this.dbName.toLowerCase()] })
						.then(value => collection.dbCallback({ dbName: this.dbName, action: "update", value, error: null, }, resolve))
						.catch(error => collection.dbCallback({ dbName: this.dbName, action: "update", value: null, error: error }, resolve));
				})
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "update", value: null, error: error }, resolve));
		});
	}
}

export default BalanceRepository;
