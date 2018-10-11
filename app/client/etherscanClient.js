import * as internet from "../common/internet";
import * as constant from "../helper/constant";
import * as collection from "../common/collection";
import currencyType from "../enum/currencyType";


class etherscanClient {
	getTransactionList(address, page = 1, offset = 100, ) {
		if (!address) {
			return null;
		}
		return new Promise(async (resolve, reject) => {


			// endpoint
			const endpoint = `${constant.URL_BASE}?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}&sort=asc&apikey=${constant.config.secret.etherscanKey}`;

			// fetch data from etherscan client
			const result = await internet.makeRequest(endpoint);
			if (result) {
				const count = result.length;
				const mappedResult = result.map(x => {
					let amount = 0;
					if (x.value && Number(x.value) > 0) {
						amount = collection.convertFromPrecision(x.value, 18); // for wei
					}

					if (amount > 0) {
						return {
							transactionHash: x.hash,
							blockNumber: x.blockNumber,
							from: x.from,
							to: x.to,
							amount: String(amount),
							currencyType: currencyType.ETHER,
						};
					} else {
						// might be an erc trx.
						return null;
					}

				}).filter(x => x != null);

				return resolve({ result: mappedResult, count });
			}

			return resolve(null);
		});
	}

	getTransactionListForErc(address, page = 1, offset = 100, ) {
		if (!address) {
			return null;
		}
		return new Promise(async (resolve, reject) => {

			// endpoint
			const endpoint = `${constant.URL_BASE}?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&sort=asc&apikey=${constant.config.secret.etherscanKey}`;

			// fetch data from etherscan client
			const result = await internet.makeRequest(endpoint);
			if (result) {
				const count = result.length;
				const mappedResult = result.map(x => {
					let amount = 0;

					// BUG here if token Number(x.tokenDecimal) then we are gone
					// TODO add checks
					if (x.value && Number(x.value) > 0) {
						amount = collection.convertFromPrecision(x.value, Number(x.tokenDecimal) || 18);// for wei
					}

					if (amount > 0) {
						return {
							transactionHash: x.hash,
							blockNumber: x.blockNumber,
							from: x.from,
							to: x.to,
							amount: String(amount),
							currencyType: x.tokenSymbol,
						};
					} else {
						// might be an erc trx.
						return null;
					}

				}).filter(x => x != null);
				return resolve({ result: mappedResult, count });
			}

			return resolve(null);
		});
	}


	getAccountsBalance(addresses) {
		if (addresses && addresses.length < 1) {
			// fail silently
			return null;
		}

		return new Promise(async (resolve, reject) => {

			addresses = String(addresses);

			// endpoint
			const endpoint = `${constant.URL_BASE}?module=account&action=balancemulti&address=${addresses}&tag=latest&apikey=${constant.config.secret.etherscanKey}`;

			// fetch data from etherscan client
			const result = await internet.makeRequest(endpoint);
			if (result) {
				const mappedResult = result.map(x => {
					let amount = 0;
					if (x.value && Number(x.value) > 0) {
						amount = collection.convertFromPrecision(x.value, 18); // for wei only for ether
					}

					if (amount > 0) {
						return {
							account: x.account,
							balance: String(amount)
						};
					} else {
						return null;
					}
				}).filter(x => x != null);

				return resolve(mappedResult);
			}

			return resolve(null);
		});
	}

	getAccountBalance(address) {
		if (address && address.length < 1) {
			// fail silently
			return null;
		}

		return new Promise(async (resolve, reject) => {
			// endpoint
			const endpoint = `${constant.URL_BASE}?module=account&action=balance&address=${address}&tag=latest&apikey=${constant.config.secret.etherscanKey}`;

			// fetch data from etherscan client
			const result = await internet.makeRequest(endpoint);
			if (result && result.length > 0) {
				let amount = 0;
				amount = collection.convertFromPrecision(result, 18); // for wei only for ether
				if (amount > 0) {
					return resolve({
						account: address,
						balance: String(amount)
					});
				} else {
					return resolve(null);
				}
			}

			return resolve(null);
		});
	}
}


export default etherscanClient;