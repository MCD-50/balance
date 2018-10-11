"use strict";
import currencyType from "../app/enum/currencyType";

module.exports = {
	up: async (queryInterface, sequelize) => {
		await queryInterface.createTable("balances", {
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
