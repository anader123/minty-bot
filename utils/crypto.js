const { ethers } = require("ethers");
const { BOT_ETH_ADDRESS } = process.env;

const walletGen = (privateKey, rpc) => {
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    return new ethers.Wallet(privateKey, provider);
};

const getTokenBalance = async (wallet, contractAddress) => {
    const abi = [
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
            abi,
            wallet
        );
        const balance = await nftContract.balanceOf(BOT_ETH_ADDRESS);
        return balance.toString();
    } catch (error) {
        console.log("getTokenBalance Error:", error);
        return 1;
    }
};

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

module.exports = { walletGen, getTokenBalance, mintNFT };
