const axios = require("axios");
const { ETHERSCAN_API_KEY } = process.env;
const abiDecoder = require("abi-decoder");
const { getTotalSupply, getMaxSupply } = require("./crypto");

/**
 * Gets the ABI for an NFT contract
 * @param contractAddress Contract address for the NFT collection
 * @returns Contract ABI
 */
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

/**
 * Decodes the mint fuction for an NFT collection. This is required because the mint function is not always named mint.
 * @param contractABI List of contract function signatures
 * @param txHash An example mint transaction
 * @returns Details about the contract's mint function
 */
const decodeMethod = async (contractABI, txHash) => {
    try {
        abiDecoder.addABI(contractABI);
        const result = await axios.get(
            `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
        );
        if (result.data.result.input === undefined) return { name: "mint" };
        const decodedMethod = abiDecoder.decodeMethod(result.data.result.input);
        return decodedMethod;
    } catch (error) {
        console.log("fetchDecodeMethod Error: ", error);
        return { name: "mint" };
    }
};

/**
 * Gets additional context about the NFT contract the bot is trying to mint from
 * @param wallet An instance used for reading and writing from/to the blockchain
 * @param mintData An object of minting related data
 * @returns Returns mintData with additional information
 */
const getFullMintData = async (wallet, mintData) => {
    const contractABI = await getContractABI(mintData.contractAddress);
    const decodedMethod = await decodeMethod(contractABI, mintData.txHash);
    const totalSupply = await getTotalSupply(
        wallet,
        mintData.contractAddress,
        contractABI
    );
    const maxSupply = await getMaxSupply(
        wallet,
        mintData.contractAddress,
        contractABI
    );

    const result = contractABI.filter((method) => {
        const methodName = method.name;
        console.log({ methodName });
        if (method.name !== undefined) {
            console.log(method);
            return method.name === decodedMethod.name;
        }
    });

    const mintInfo = result[0];
    mintInfo.contractAddress = mintData.contractAddress;
    mintInfo.mintPrice = mintData.mintPrice;
    mintInfo.sampleCount = mintData.sampleCount;
    mintInfo.totalSupply = totalSupply;
    mintInfo.maxSupply = maxSupply;

    return mintInfo;
};

/**
 * Gets current gas price on Ethereum
 * @returns Returns average gas price
 */
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

module.exports = { getFullMintData, getGasPrice };
