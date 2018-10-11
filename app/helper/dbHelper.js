const db = {};

export const addModel = (key, value) => {
	db[key] = value;
};

export const removeModel = (key) => {
	delete db[key];
};

export default { db, addModel, removeModel } ;