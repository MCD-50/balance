"use strict";

import transactionType from "../app/enum/transactionType";
import currencyType from "../app/enum/currencyType";

module.exports = {
	up: async (queryInterface, sequelize) => {
		await queryInterface.createTable("transactions", {
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
			deltaAccountAddress: { // where trx came from or going to 
				type: sequelize.STRING,
				allowNull: false,
			},
			amount: {
				type: sequelize.STRING,
				allowNull: false,
			},
			transactionHash: {
				type: sequelize.STRING,
				allowNull: false,
				unique: true
			},
			blockNumber : {
				type: sequelize.STRING,
				allowNull: false,
			},
			transactionType: {
				type: sequelize.ENUM,
				values: Object.keys(transactionType).map(key => transactionType[key]),
				allowNull: false,
			},
			// since, have No supported currencies list using string instead enum
			currencyType: {
				type: sequelize.STRING,
				allowNull: false,
				defaultValue: currencyType.ETHER,
			},
			createdAt: {
				type: sequelize.DATE,
				defaultValue: sequelize.NOW
			},
			updatedAt: {
				type: sequelize.DATE,
				defaultValue: sequelize.NOW
			},
			lockVersion: {
				type: sequelize.INTEGER,
				defaultValue: 1
			}
		});
	},

	down: async (queryInterface, sequelize) => {
		//await queryInterface.dropTable("balances");
	}
};
