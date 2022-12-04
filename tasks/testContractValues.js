// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet

//yarn hardhat testContractValues --network localhost
task("testContractValues", "This is a test function I used to test random things in the contract (do with it as you wish )")

.setAction(async (taskArgs) => {
    const address = require(`../deployments/${network.name}/TestContract.json`).address

    

   
    const testContract = await ethers.getContractFactory("TestContract")
    console.log(
        "Task running on the  ",
        network.name,
        "network with contract address  => ",
        address
    )

    //Get signer information
    const accounts = await ethers.getSigners()
    const signer = accounts[0]
    const testContractContract = await new ethers.Contract(address, testContract.interface, signer)
    const value = await testContractContract.getvalue()
    const funcion_signature = await testContractContract.getData()

    console.log(`The value is ${value}`)
    console.log(`The test contract address  is ${address}`)
    console.log(`The function data is  ${funcion_signature}`)
})

module.exports = {}
