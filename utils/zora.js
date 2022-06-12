const { request, gql } = require("graphql-request");
const _ = require("lodash");

const tokenMintQuery = gql`
    query TokenMint {
        mints(
            sort: { sortKey: TIME, sortDirection: DESC }
            pagination: { limit: 500 }
        ) {
            nodes {
                mint {
                    collectionAddress
                    price {
                        nativePrice {
                            decimal
                            currency {
                                address
                            }
                        }
                    }
                    transactionInfo {
                        transactionHash
                    }
                }
                token {
                    collectionName
                }
            }
        }
    }
`;

const getInitialData = async () => {
    try {
        const result = await request(
            "https://api.zora.co/graphql",
            tokenMintQuery
        );
        return result.mints.nodes;
    } catch (error) {
        console.log("getInitialMintData Error: ", error);
        return { isError: true, error };
    }
};

const getMintData = async () => {
    const mints = await getInitialData();
    let mintArray = [];

    if (mints.isError) {
        return {
            error: mints.error,
        };
    }

    const groupedMintsObj = _.groupBy(mints, (node) => {
        return node.mint.collectionAddress;
    });
    Object.keys(groupedMintsObj).map((key) =>
        mintArray.push(groupedMintsObj[key])
    );
    mintArray = mintArray.sort((a, b) => {
        return b.length - a.length;
    });

    const mostMintedCollection = mintArray[0][0];

    return {
        mintPrice: mostMintedCollection.mint.price.nativePrice.decimal,
        sampleCount: mintArray[0].length,
        collectionName: mostMintedCollection.token.collectionName,
        contractAddress: mostMintedCollection.mint.collectionAddress,
        mintCurrency:
            mostMintedCollection.mint.price.nativePrice.currency.address,
        txHash: mostMintedCollection.mint.transactionInfo.transactionHash,
    };
};

module.exports = { getMintData };
