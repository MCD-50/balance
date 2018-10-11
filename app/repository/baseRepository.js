import dbHelper from "../helper/dbHelper";
import * as collection from "../common/collection";
import * as constant from "../helper/constant";


class BaseRepository {
	constructor(database) {
		this.db = dbHelper.db[database];
		this.dbName = String(database).toUpperCase();

		this._createItem = this._createItem.bind(this);
		this._getItemByObjectId = this._getItemByObjectId.bind(this);
		this._updateItemByObjectId = this._updateItemByObjectId.bind(this);

		// satisfies for lockVersion updates
		this._saveItem = this._saveItem.bind(this);

		this._filterItem = this._filterItem.bind(this);
	}

	_createItem(payload, transaction = null) {
		if (!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise((resolve, reject) => {
			const options = transaction ? { transaction } : {};
			this.db.create(payload, options)
				.then(value => collection.dbCallback({ dbName: this.dbName, action: "create", value, error: null }, resolve))
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "create", value: null, error: error }, resolve));
		});
	}

	_getItemByObjectId(objectId, transaction = null, fields = null) {
		if (!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise((resolve, reject) => {
			const where = { _id: objectId };
			const options = transaction ? { transaction } : {};
			const attributes = fields && fields.length > 0 ? fields : constant.DB_FETCH[this.dbName.toLowerCase()];
			this.db.findOne({ where, ...options, attributes: attributes })
				.then(value => collection.dbCallback({ dbName: this.dbName, action: "get", value, error: null }, resolve))
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "get", value: null, error: error }, resolve));
		});
	}

	_updateItemByObjectId(objectId, payload, transaction = null) {
		if (!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise(async (resolve, reject) => {
			const where = { _id: objectId };
			const options = {};
			if (transaction) {
				options.transaction = transaction;
			}

			// its very imp to clean up incoming payload
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

	_saveItem(item, transaction = null) {
		return new Promise(async (resolve, reject) => {
			const options = {};
			if (transaction) {
				options.transaction = transaction;
			}
			item.save({ ...options })
				.then(value => collection.dbCallback({ dbName: this.dbName, action: "update", value, error: null, }, resolve))
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "update", value: null, error: error }, resolve));
		});
	}

	_filterItem(filter, paging = null, transaction = null, fields = null) {
		if (!this.db) this.db = dbHelper.db[this.dbName.toLowerCase()];
		return new Promise((resolve, reject) => {
			filter = collection.beautifyFilter(filter);
			paging = collection.beautifyPaging(paging);
			const options = transaction ? { transaction } : {};

			const attributes = fields && fields.length > 0 ? fields : constant.DB_FETCH[this.dbName.toLowerCase()];
			this.db.findAndCountAll({ where: filter, ...options, ...paging, attributes: attributes })
				.then(value => collection.dbCallback({ dbName: this.dbName, action: "list", value, error: null }, resolve))
				.catch(error => collection.dbCallback({ dbName: this.dbName, action: "list", value: null, error: error }, resolve));
		});
	}
}


export default BaseRepository;