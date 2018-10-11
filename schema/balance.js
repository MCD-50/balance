const sequelize = require("sequelize");
import dbHelper from "../app/helper/dbHelper";
import currencyType from "../app/enum/currencyType";

const schema = {
	_id: {
		type: sequelize.UUID,
		defaultValue: sequelize.UUIDV1,
		primaryKey: true,
		unique: true
	},
	accountAddress: {
		type: sequelize.STRING,
		allowNull: false,
	},
	currentBalance: {
		type: sequelize.STRING,
		allowNull: false,
		defaultValue: "0",
	},
	currencyType: {
		type: sequelize.ENUM,
		values: Object.keys(currencyType).map(key => currencyType[key]),
		allowNull: false,
	},
	createdAt: {
		type: sequelize.DATE,
		defaultValue: sequelize.NOW
	},
	updatedAt: {
		type: sequelize.DATE,
		defaultValue: sequelize.NOW
	}
};


const initSchema = (app) => {
	const _schema = app.postgresClient.define("balances", schema);
	dbHelper.addModel("balance", _schema);
};

export default initSchema;