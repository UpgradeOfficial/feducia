const path = require("path")

const networkConfig = {
    31337: {
        name: "localhost",
    },
    5: {
        name: "goerli",
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
module.exports = {
    networkConfig,
    developmentChains,
    frontEndAbiFile,
    frontEndContractsFile,
}
