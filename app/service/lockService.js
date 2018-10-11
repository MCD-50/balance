export const getLock = (app, sKey, dKey = null) => {
	return new Promise(async (resolve, reject) => {
		let retry = 0;
		while (retry < 3) {
			retry++;
			let data = await promisify(app, sKey, dKey);
			if (data && data.value) {
				return resolve({ value: "Lock aquired" });
			}
		}
		return resolve({ error: "Unable to get lock" });
	});
};

export const releaseLock = (app, sKey, dKey = null) => {
	return new Promise(async (resolve, reject) => {
		const redisHelper = app.redisHelper;
		await redisHelper.del(sKey);
		dKey && await redisHelper.del(dKey);
		resolve({ value: true });
	});
};

const promisify = (app, sKey, dKey = null) => {
	return new Promise(async (resolve, reject) => {
		const redisHelper = app.redisHelper;
		let sourceLock = await redisHelper.setnx(sKey, "1");
		let destinationLock = "0"; // fake it as not aquired
		if (dKey) {
			destinationLock = await redisHelper.setnx(dKey, "1");
		}

		if (sourceLock == "0" || (dKey && destinationLock == "0")) {
			await releaseLock(app, sKey, dKey);
			return resolve({ error: "Unable to get lock" });
		} else {
			await redisHelper.expire(sKey, 50);
			dKey && await redisHelper.expire(dKey, 50);
			return resolve({ value: "Lock aquired" });
		}
	});
};