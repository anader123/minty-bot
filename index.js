require("dotenv").config();
const { walletGen, getTokenBalance, mintNFT } = require("./utils/crypto");
const { getMintData } = require("./utils/zora");
const { getFullMintData, getGasPrice } = require("./utils/etherscan");

const {
    ETH_PRIVATE_KEY,
    ETH_RPC,
    MAX_MINT_PRICE,
    MIN_SAMPLE_COUNT,
    MAX_GAS_PRICE,
    DELAY_SEC,
    MIN_MINT_RATIO,
} = process.env;

const wallet = walletGen(ETH_PRIVATE_KEY, ETH_RPC);

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

    const nameCheckResult = ["goblin", "town", "ape", "poop"].filter((word) => {
        return collectionName.toLowerCase().includes(word);
    });

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

        case nameCheckResult.length > 0:
            console.log("Collection is a derivative:", collectionName);
            return;
    }

    const tokenBalance = await getTokenBalance(wallet, contractAddress);

    if (tokenBalance > 0) {
        console.log("Already minted token:", `Balance of ${tokenBalance}`);
        return;
    }

    const fullMintData = await getFullMintData(wallet, mintData);
    const gasPrice = await getGasPrice();

    const { name, inputs, totalSupply, maxSupply } = fullMintData;
    switch (true) {
        case name === undefined:
            console.log("No contract ABI found");
            return;

        case totalSupply === 0:
            console.log("Error getting Total Supply");
            return;

        case totalSupply / maxSupply < MIN_MINT_RATIO:
            console.log("Not enough minted yet", `${totalSupply}/${maxSupply}`);
            return;

        case inputs.length > 2:
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
