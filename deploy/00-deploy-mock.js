const { network } = require("hardhat")
const {
    developmentChains,
     DECIMALS,
 INITIAL_ANSWER
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    // only deploy mocks
    if (developmentChains.includes(network.name)) {
        log("Local Network detected! deploying mocks!!!")
        const fundMe = await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER],
            log: true,
        })
        log("mocks Deployed!!!")
        log("_______________________________________________________________________________")
    }

    // when going for localhost or hardhat we want to use a mock
}

module.exports.tags = ["all", "mocks"]
