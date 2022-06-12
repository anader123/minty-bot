const axios = require("axios");
const { ETHERSCAN_API_KEY } = process.env;
const abiDecoder = require("abi-decoder");

const getContractABI = async (contractAddress) => {
    let response;
    try {
        response = await axios.get(
            `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`
        );
    } catch (error) {
        console.log("getContractABI Error: ", error);
        return [{ name: undefined }];
    }

    const result = response.data.result;
    if (
        result === "Contract source code not verified" ||
        result === undefined
    ) {
        return [{ name: undefined }];
    }

    const contractABI = JSON.parse(response.data.result);
    return contractABI;
};

const decodeMethod = async (abi, txHash) => {
    let response;
    abiDecoder.addABI(abi);

    try {
        const result = await axios.get(
            `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
        );
        if (result.data.result.input === undefined) return { name: "mint" };
        response = result;
    } catch (error) {
        console.log("decodeMethod Error: ", error);
        return { name: "mint" };
    }

    const decodedMethod = abiDecoder.decodeMethod(response.data.result.input);
    console.log(decodedMethod);
    return decodedMethod;
};

const getMintFunction = async (mintData) => {
    const contractABI = await getContractABI(mintData.contractAddress);
    const decodedMethod = await decodeMethod(contractABI, mintData.txHash);

    const result = contractABI.filter((method) => {
        if (method !== undefined) {
            return method.name === decodedMethod.name;
        } else if (method.inputs === undefined) return [{ name: undefined }];
    });

    const mintInfo = result[0];
    mintInfo.contractAddress = mintData.contractAddress;
    mintInfo.mintPrice = mintData.mintPrice;
    mintInfo.sampleCount = mintData.sampleCount;
    return mintInfo;
};

const getGasPrice = async () => {
    try {
        const response = await axios.get(
            `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
        );
        return response.data.result.SafeGasPrice;
    } catch (error) {
        console.log("getGasPrice Error: ", error);
        return undefined;
    }
};

module.exports = { getMintFunction, getGasPrice };
