const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let mumbaiUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const mumbaiUsdAggregator = await get("MockV3Aggregator")
        mumbaiUsdPriceFeedAddress = mumbaiUsdAggregator.address
        console.log("mumbia: ", mumbaiUsdPriceFeedAddress)
    } else {
        mumbaiUsdPriceFeedAddress = networkConfig[chainId]["mumbaiUsdPriceFeed"]
    }
     
    log("----------------------------------------------------")
    const args = [mumbaiUsdPriceFeedAddress]
    const crowdFundMaker = await deploy("CrowdFundContract", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY ) {
        log("Verifying...")
        await verify(crowdFundMaker.address, args)
    }
}

module.exports.tags = ["all", "crowdFundMaker", "main"]
