import * as collection from "../common/collection";
import statusType from "../enum/statusType";

function hasSql(value) {
	if (value === null || value === undefined) {
		return false;
	}

	var sql_meta = new RegExp("(%27)|(')|(--)|(%23)|(#)", "i");
	if (sql_meta.test(value)) {
		return true;
	}

	var sql_meta2 = new RegExp("((%3D)|(=))[^\n]*((%27)|(')|(--)|(%3B)|(;))", "i");
	if (sql_meta2.test(value)) {
		return true;
	}

	var sql_typical = new RegExp("w*((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))", "i");
	if (sql_typical.test(value)) {
		return true;
	}

	var sql_union = new RegExp("((%27)|('))union", "i");
	if (sql_union.test(value)) {
		return true;
	}

	return false;
}

function middleware(req, res, next) {
	var containsSql = false;
	if (req.originalUrl != null && req.originalUrl != undefined) {
		if (hasSql(req.originalUrl) == true) {
			containsSql = true;
		}
	}

	if (req.body !== null && req.body !== undefined) {
		let body = "";
		if (typeof body != "string") {
			body = collection.getStringFromJson(body);
		}

		if (hasSql(body) == true) {
			containsSql = true;
		}
	}

	if (!containsSql) {
		return next();
	} else {
		return res.status(statusType.DB_ERROR).json(collection.getJsonError("Something went wrong, while processing request."));
	}
}

module.exports = middleware;