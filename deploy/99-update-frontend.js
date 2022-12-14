const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat-config")
const fs = require("fs")
const { network, ethers } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}


async function updateAbi() {
    const guess_game = await ethers.getContract("CrowdFundContract")
    fs.writeFileSync(frontEndAbiFile, guess_game.interface.format(ethers.utils.FormatTypes.json))
    console.log("rewriting api at", frontEndAbiFile)
}

async function updateChainsName() {
    const guess_game = await ethers.getContract("CrowdFundContract")
    fs.writeFileSync(frontEndAbiFile, guess_game.interface.format(ethers.utils.FormatTypes.json))
    console.log("rewriting api at", frontEndAbiFile)
}

async function updateContractAddresses() {
    const guess_game = await ethers.getContract("CrowdFundContract")
    const file_json = fs.readFileSync(frontEndContractsFile, "utf8") ?? {}
    const contractAddresses = JSON.parse(file_json)
    if (network.config.chainId.toString() in contractAddresses) {
        if (!contractAddresses[network.config.chainId.toString()].includes(guess_game.address)) {
            contractAddresses[network.config.chainId.toString()].push(guess_game.address)
        }
    } else {
        contractAddresses[network.config.chainId.toString()] = [guess_game.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
    console.log("writing address: ", frontEndContractsFile)
}
module.exports.tags = ["all", "frontend"]
