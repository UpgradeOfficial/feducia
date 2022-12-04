// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet

task("totalCampaign", "Get the total number of campaigns in the contract").setAction(
    async (taskArgs) => {
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
        const data = await crowdFundContract.getNumberOfCampaigns()

        console.log("data: ", data.toString())
    }
)

module.exports = {}
