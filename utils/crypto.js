const { ethers } = require("ethers");
const { BOT_ETH_ADDRESS } = process.env;

/**
 * Generates a wallet instance used for reading and writing from/to the blockchain
 * @param privateKey An Ethereum private key
 * @param rpc Connection to an Ethereum node
 * @returns Wallet instance
 */
const walletGen = (privateKey, rpc) => {
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    return new ethers.Wallet(privateKey, provider);
};

/**
 * Gets the bot's balance of NFTs for a specific collection address
 * @param wallet An instance used for reading and writing from/to the blockchain
 * @param contractAddress Contract address for the NFT collection to check the balance of
 * @returns Balance the bot has of an NFT collection
 */
const getTokenBalance = async (wallet, contractAddress) => {
    const contractABI = [
        {
            inputs: [
                { internalType: "address", name: "owner", type: "address" },
            ],
            name: "balanceOf",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
        },
    ];

    try {
        const nftContract = await new ethers.Contract(
            contractAddress,
            contractABI,
            wallet
        );
        const balance = await nftContract.balanceOf(BOT_ETH_ADDRESS);
        return +balance;
    } catch (error) {
        console.log("getTokenBalance Error:", error);
        return 1;
    }
};

/**
 * Gets the maxSupply for an NFT collection. maxSupply returns the max amount of NFTs that is possible to mint. Some contracts don't support maxSupply, thus the bot defaults to 10k if not available.
 * @param wallet An instance used for reading and writing from/to the blockchain
 * @param contractAddress Contract address for the NFT collection to check maxSupply of
 * @param contractABI ABI for the NFT contract
 * @returns maxSupply of an NFT collection
 */
const getMaxSupply = async (wallet, contractAddress, contractABI) => {
    const maxSupplyMethod = contractABI.filter((method) => {
        if (method.name !== undefined) {
            const methodName = method.name.toLowerCase();
            return methodName.includes("max") && methodName.includes("supply");
        }
    });

    if (maxSupplyMethod.length === 0) return 10000;

    const nftContract = await new ethers.Contract(
        contractAddress,
        contractABI,
        wallet
    );

    try {
        const response = await nftContract[maxSupplyMethod[0].name]();
        return +response;
    } catch (error) {
        console.log("Error getting Total Supply", error);
        return 10000;
    }
};

/**
 * Gets the totalSupply for an NFT collection. totalSupply usually returns the current count during mints.
 * @param wallet An instance used for reading and writing from/to the blockchain
 * @param contractAddress Contract address for the NFT collection to check totalSupply of
 * @param contractABI ABI for the NFT contract
 * @returns totalSupply of an NFT collection
 */
const getTotalSupply = async (wallet, contractAddress, contractABI) => {
    const totalSupplyMethod = contractABI.filter((method) => {
        if (method.name !== undefined) {
            const methodName = method.name.toLowerCase();
            return (
                methodName.includes("total") && methodName.includes("supply")
            );
        }
    });

    if (totalSupplyMethod.length === 0) return 0;

    const nftContract = await new ethers.Contract(
        contractAddress,
        contractABI,
        wallet
    );

    try {
        const response = await nftContract[totalSupplyMethod[0].name]();
        return +response;
    } catch (error) {
        console.log("Error getting Total Supply", error);
        return 0;
    }
};

/**
 * Attemps to mint an NFT depending on the arugments.
 * @param wallet An instance used for reading and writing from/to the blockchain
 * @param mintData An object of mint related data
 * @returns An object that contains details about the submitted transaction
 */
const mintNFT = async (wallet, mintData) => {
    const { contractAddress, mintPrice, name } = mintData;
    let result;

    const nftContract = new ethers.Contract(
        contractAddress,
        [mintData],
        wallet
    );

    const rawMintPrice = ethers.utils.parseEther(mintPrice.toString());
    const overrides = {
        value: rawMintPrice,
    };

    const inputAmount = mintData.inputs.length;
    switch (true) {
        case inputAmount === 0:
            try {
                result = await nftContract[name](overrides);
            } catch (error) {
                return error;
            }
            break;

        case inputAmount === 1 && mintData.inputs[0].type === "address":
            try {
                result = await nftContract[name](BOT_ETH_ADDRESS, overrides);
            } catch (error) {
                return error;
            }
            break;

        case inputAmount === 1 && mintData.inputs[0].type.includes("uint"):
            try {
                result = await nftContract[name]("1", overrides);
            } catch (error) {
                return error;
            }
            break;

        case inputAmount === 2 &&
            mintData.inputs[0].type === "address" &&
            mintData.inputs[1].type.includes("uint"):
            try {
                result = await nftContract[name](
                    BOT_ETH_ADDRESS,
                    "1",
                    overrides
                );
            } catch (error) {
                return error;
            }
            break;

        case inputAmount === 2 &&
            mintData.inputs[0].type.includes("uint") &&
            mintData.inputs[1].type === "address":
            try {
                result = await nftContract[name](
                    "1",
                    BOT_ETH_ADDRESS,
                    overrides
                );
            } catch (error) {
                return error;
            }
            break;

        default:
            return "Error: Function has input that isn't an address or uint";
    }

    const { status, blockNumber, transactionHash } = await result.wait();
    return { status, blockNumber, transactionHash };
};

module.exports = {
    walletGen,
    getTokenBalance,
    mintNFT,
    getMaxSupply,
    getTotalSupply,
};
