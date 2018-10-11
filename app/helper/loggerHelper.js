import logType from "../enum/logType";

const DEBUG_LOGGING_ON = true;
const WARNING_LOGGING_ON = true;
const INFO_LOGGING_ON = true;

const logMessage = (title, message, err = null, level = logType.VERBOSE) => {
	if (err != null) {
		console.log("ERROR :: ", `${title} ::: `, message, err);
		// TODO report to any reporting client
	} else if (DEBUG_LOGGING_ON && level == logType.DEBUG) {
		console.log("DEBUG :: ", `${title} ::: `, message);
	} else if (INFO_LOGGING_ON && (level == logType.INFO || level == logType.VERBOSE)) {
		console.log("INFO :: ", `${title} ::: `, message);
	} else if (WARNING_LOGGING_ON && (level == logType.WARNING)) {
		console.log("WARNING :: " + `${title} ::: `, message);
	}
};

export default logMessage;