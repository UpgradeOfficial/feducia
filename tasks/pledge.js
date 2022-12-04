// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet


task("pledge", "This is used to pledge funds to a campaign")
.addParam("id", "The campaign id")
.addParam("amount", "The amount pledged")
.setAction(async (taskArgs) => {
    const id = Number(taskArgs.id) 
    const amount = Number(taskArgs.amount) 
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
    await crowdFundContract.pledge(id, {value: amount})
    
    console.log("You have pledge ", amount," success fully")
})

module.exports = {}
