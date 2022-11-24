// This script only works with --network 'mainnet', or 'hardhat' when running a fork of mainnet

//  yarn hardhat getDate --network localhost
task("getDate", "get the names associated with a particular address")
    .addParam("minute", "added time in minutes")
    .setAction(async (taskArgs) => {
        const minute = Number(taskArgs.minute)
        let daysAdded = 10
        let date = new Date(Date.now())
        let start_time_added_time = Math.round(date.valueOf() / 1000) + 2 * 60 
        let end_time_added_time = Math.round(date.valueOf() / 1000) + minute * 60 

        const startAt = start_time_added_time
        const endAt = end_time_added_time

        // console.log(`Normal Time => ${date}`)
        // console.log(`Unix time now => ${date.valueOf()}`)
        // console.log(`${added_time}`)
        // console.log(`${added_time.valueOf()}`)

        console.log(`yarn hardhat launch --goal 100 --start-at ${startAt} --end-at ${endAt} --network localhost`)
    })

module.exports = {}
