import dbHelper from "../helper/dbHelper";
const initRelationship = () => {
	dbHelper.db.transaction.belongsTo(dbHelper.db.balance, { as: "balance", foreignKey: "accountAddress", targetKey: "accountAddress" });
};

export default initRelationship;