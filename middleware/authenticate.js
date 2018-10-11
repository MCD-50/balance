import * as constant from "../app/helper/constant";
import * as collection from "../app/common/collection";
import statusType from "../app/enum/statusType";

// assuming its a microservice architecture.
export const authenticateRequest = async (req, res, next) => {
	const { headers } = req;
	if (headers && headers.authorization) {
		const authToken = headers.authorization;
		if (authToken == constant.config.secret.nodeTokenSecret) {
			// pass to next controller
			return next();
		}
	}
	// return error
	return res.status(statusType.UNAUTHORIZED).json(collection.getJsonError(constant.AUTH_ERROR));
};
