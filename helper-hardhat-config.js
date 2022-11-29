const path = require("path")

const networkConfig = {
    31337: {
        name: "localhost",
    },
    5: {
        name: "goerli",
        mumbaiUsdPriceFeed: null
    },
    80001: {
        name: "mumbai-testnet",
        mumbaiUsdPriceFeed: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada"
    },
}


const developmentChains = ["hardhat", "localhost"]
const frontEndContractsFile = path.join(
    __dirname,
    "..",
    "feducia_frontend",
    "src",
    "utils",
    "contractAddresses.json"
)
const frontEndAbiFile = path.join(
    __dirname,
    "..",
    "feducia_frontend",
    "src",
    "utils",
    "abi.json"
)
const DECIMALS = 8
const INITIAL_ANSWER = 2 * 10 **8
module.exports = {
    networkConfig,
    developmentChains,
    frontEndAbiFile,
    frontEndContractsFile,
    DECIMALS,
    INITIAL_ANSWER
}
