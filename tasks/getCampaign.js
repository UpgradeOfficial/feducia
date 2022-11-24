// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet


task("getCampaign", "get the names associated with a particular address")
.addParam("id", "The transaction id")
.setAction(async (taskArgs) => {
    const id = Number(taskArgs.id) 
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
    const {creator, goal, pledged, startAt, endAt, claimed, isCancelled} = await crowdFundContract.getCampaignById(id)
    
    console.log("creator: ", creator)
    console.log("goal: ", goal.toString())
    console.log("pledged: ", pledged.toString())
    console.log("endAt: ",  new Date(Number(endAt) * 1000))
    console.log("startAt: ",  new Date(Number(startAt) * 1000))
    console.log("claimed: ", claimed)
    console.log("isCancelled: ", isCancelled)

    // creator: '0x0000000000000000000000000000000000000000',
    // goal: BigNumber { _hex: '0x00', _isBigNumber: true },
    // pledged: BigNumber { _hex: '0x00', _isBigNumber: true },
    // startAt: BigNumber { _hex: '0x00', _isBigNumber: true },
    // endAt: BigNumber { _hex: '0x00', _isBigNumber: true },
    // claimed: false,
    // isCancelled: false
})

module.exports = {}
