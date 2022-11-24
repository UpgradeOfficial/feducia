// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet


task("launch", "get the names associated with a particular address")
.addParam("goal", "The transaction id")
.addParam("startAt", "The transaction id")
.addParam("endAt", "The transaction id")
.setAction(async (taskArgs) => {
    const goal = taskArgs.goal
    const startAt = Number(taskArgs.startAt) 
    const endAt = Number(taskArgs.endAt)
    const crowdFund = await ethers.getContractFactory("CrowdFundContract")

    const address = require(`../deployments/${network.name =="hardhat"?"localhost":network.name}/CrowdFundContract.json`).address
    console.log(
        "Task running on the ",
        network.name=="hardhat"?"localhost":network.name,
        "network with contract address  => ",
        address
    )

    //Get signer information
    const accounts = await ethers.getSigners()
    const signer = accounts[0]
    const crowdFundContract = await new ethers.Contract(address, crowdFund.interface, signer)
    const numOfCampaign = await crowdFundContract.getNumberOfCampaigns()
    const transactionResponse = await crowdFundContract.launch(`Campaign-${numOfCampaign.toString()}`,goal, startAt, endAt)
    const transactionReceipt = transactionResponse.wait()
    
    console.log(`Campaign has started`)
})


module.exports = {}
