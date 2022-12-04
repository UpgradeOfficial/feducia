// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet

task("claim", "This is used to claim funds from a campaign")
    .addParam("id", "The id of the campaign")
    .setAction(async (taskArgs) => {
        const id = Number(taskArgs.id)
        const crowdFund = await ethers.getContractFactory("CrowdFundContract")

        const address = require(`../deployments/${
            network.name == "hardhat" ? "localhost" : network.name
        }/CrowdFundContract.json`).address
        console.log(
            "Task running on the ",
            network.name == "hardhat" ? "localhost" : network.name,
            "network with contract address  => ",
            address
        )

        //Get signer information
        const accounts = await ethers.getSigners()
        const signer = accounts[0]
        const crowdFundContract = await new ethers.Contract(address, crowdFund.interface, signer)
        await crowdFundContract.claim(id)

        console.log("Your campaign has been claimed")
    })

module.exports = {}
