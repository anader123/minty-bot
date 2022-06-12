require("dotenv").config();
const { walletGen, getTokenBalance, mintNFT } = require("./utils/crypto");
const { getMintData } = require("./utils/zora");
const { getMintFunction, getGasPrice } = require("./utils/etherscan");

const {
    ETH_PRIVATE_KEY,
    ETH_RPC,
    MAX_MINT_PRICE,
    MIN_SAMPLE_COUNT,
    MAX_GAS_PRICE,
    DELAY_SEC,
} = process.env;

const wallet = walletGen(ETH_PRIVATE_KEY, ETH_RPC);

// TODO:
// - Add file writing for logging
// - Add ReadMe
// - Might rename certain functions for better clarity
// - Take into account max supply before deceiding to mint
// - Add collection name filters ie has the word goblin or town
// - Don't mint if under 50%

const checkForMinting = async () => {
    const mintData = await getMintData();

    const {
        sampleCount,
        mintPrice,
        contractAddress,
        mintCurrency,
        collectionName,
    } = mintData;

    console.table(mintData);

    switch (true) {
        case contractAddress === undefined:
            console.log("Error getting mint data:", mintData.error);
            return;

        case sampleCount < MIN_SAMPLE_COUNT:
            console.log(
                "Not a large enough sample size:",
                `${sampleCount}/${MIN_SAMPLE_COUNT}`
            );
            return;

        case mintPrice > MAX_MINT_PRICE:
            console.log("Mint price is too high:", mintPrice);
            return;

        case mintCurrency !== "0x0000000000000000000000000000000000000000":
            console.log("Mint currency was an ERC20", mintCurrency);
            return;
    }

    const tokenBalance = await getTokenBalance(wallet, contractAddress);

    if (+tokenBalance > 0) {
        console.log("Already minted token:", `Balance of ${tokenBalance}`);
        return;
    }

    const fullMintData = await getMintFunction(mintData);
    const gasPrice = await getGasPrice();

    switch (true) {
        case fullMintData.name === undefined:
            console.log("No contract ABI found");
            return;

        case fullMintData.inputs.length > 2:
            console.log("Too many function arguments");
            return;

        case gasPrice === undefined || +gasPrice > MAX_GAS_PRICE:
            console.log("Gas Price not found or too high:", gasPrice);
            return;
    }

    console.log(`Attempting to mint a ${collectionName}`);

    const result = await mintNFT(wallet, fullMintData);
    console.log(result);
};

const delayMil = DELAY_SEC * 1000;
setInterval(checkForMinting, delayMil);
