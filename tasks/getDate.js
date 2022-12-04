// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet

//  yarn hardhat getDate --network localhost
task("getDate", "This generates a campaign with a valid time ")
    .addParam("minute", "This will be the amount of time between start and end time of the campaign (Note The campaign start time will be two minute from the current time and the name is not included)")
    .setAction(async (taskArgs) => {
        const minute = Number(taskArgs.minute)
        let daysAdded = 10
        let date = new Date(Date.now())
        let start_time_added_time = Math.round(date.valueOf() / 1000) + 2 * 60 
        let end_time_added_time = Math.round(date.valueOf() / 1000) + minute * 60 

        const startAt = start_time_added_time
        const endAt = end_time_added_time

        console.log(`yarn hardhat launch --goal 100 --start-at ${startAt} --end-at ${endAt} --network localhost`)
    })

module.exports = {}
