// We are going to skimp a bit on these tests...

const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { Contract } = require("hardhat/internal/hardhat-network/stack-traces/model")
const { developmentChains } = require("../../helper-hardhat-config")
const { moveBlocks } = require("../../utils/move-blocks")
const { moveTime } = require("../../utils/move-time")

// it.only and describe.only used to run a particular test or test suite
// could also use --grep
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Crowd Fund Maker Unit Test", function () {
          let deployer,
              account_holder_1,
              account_holder_2,
              data,
              pledged_amount,
              start_date,
              end_date,
              start_date_timestampInSeconds,
              end_date_timestampInSeconds

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              account_holder_1 = accounts[1]
              account_holder_2 = accounts[2]
              await deployments.fixture(["all"])
              crowdFund = await ethers.getContract("CrowdFundContract")
              start_date = new Date()
              // start date is one day ahead of the curren time
              start_date.setDate(start_date.getDate() + 1)
              end_date = new Date(start_date.getTime())
              end_date.setDate(end_date.getDate() + 1)

              // 👇️ timestamp in seconds (Unix timestamp)
              start_date_timestampInSeconds = Math.floor(start_date.getTime() / 1000)
              end_date_timestampInSeconds = Math.floor(end_date.getTime() / 1000)

              data = {
                  name: "test",
                  goal: 100,
                  startAt: start_date_timestampInSeconds,
                  endAt: end_date_timestampInSeconds,
              }
              await crowdFund.launch(data.name, data.goal, data.startAt, data.endAt)
              await moveBlocks(5)
              pledged_amount = ethers.utils.parseEther("1")
          })
          describe("MaxDuration and MinimumWithdrawalDuration", () => {
            it("set Max duration ", async function () {
                await crowdFund.setMaxDuration(1000)
                const maxDuration =await crowdFund.getMaxDuration()
                assert.equal(maxDuration.toString(), "1000")
            })
            it("set Max duration from non owner of contract", async function () {
                await expect(
                    crowdFund.connect(account_holder_1).setMaxDuration(1000)
                ).to.be.revertedWith("CrowdFundContract_NotContractOwner()")
            })
            it("set Minimum Withdrawal Duration ", async function () {
                await crowdFund.setMinimumWithdrawalDuration(1000)
                const maxDuration =await crowdFund.getMinimumWithdrawalDuration()
                assert.equal(maxDuration.toString(), "1000")
            })
            it("set Minimum Withdrawal Duration from non owner of contract", async function () {
                await expect(
                    crowdFund.connect(account_holder_1).setMinimumWithdrawalDuration(1000)
                ).to.be.revertedWith("CrowdFundContract_NotContractOwner()")
            })
            
            
            it("get pledge amount of an address ", async function () {
                const pledge_deployer = await crowdFund.getPledgeAmount(1, deployer.address)
                assert.equal(pledge_deployer.toString(), "0")
            })
            it("call a function that doesnt exist ", async function () {
                // const pledge_deployer = await crowdFund.nonExist(1, deployer.address)
                //assert.equal(pledge_deployer.toString(), "0")
                const tx = deployer.sendTransaction({
                    to: crowdFund.address,
                    data: "0x1234",
                });
                await expect(tx)
                    .to.emit(crowdFund, 'Error')
                    .withArgs(deployer.address, 0)
            })
        })
          describe("Launch", () => {
              it("create a new campaign", async function () {
                  await crowdFund.launch(data.name, data.goal, data.startAt, data.endAt)
                  const campaignCount = await crowdFund.getNumberOfCampaigns()
                  const campaign1 = await crowdFund.getCampaignById(1)
                  assert.equal(campaign1.creator, deployer.address)
                  assert.equal(campaign1.goal, data.goal)
                  assert.equal(campaign1.pledged, 0)
                  assert.equal(campaign1.endAt, data.endAt)
                  assert.equal(campaign1.startAt, data.startAt)
                  assert.equal(campaign1.claimed, false)
                  assert.equal(campaignCount.toNumber(), 2)
              })

              it("create campaign will emit an event", async function () {
                  await expect(crowdFund.launch(data.name, data.goal, data.startAt, data.endAt))
                      .to.emit(crowdFund, "Launch")
                      .withArgs(2, deployer.address, data.goal, data.startAt, data.endAt)
              })
              it("create campaign where startdate greater less than now", async function () {
                  let start_date = new Date("2020-02-01")
                  start_date = Math.floor(start_date.getTime() / 1000)
                  await expect(
                      crowdFund.launch(data.name, data.goal, start_date, data.endAt)
                  ).to.be.revertedWith("CrowdFundContract_PastDateSelected()")
              })
              it("create campaign where startdate greater enddate", async function () {
                  // end date be one day less than start date
                  end_date = start_date_timestampInSeconds - 2 * 60 * 60 * 24
                  await expect(
                      crowdFund.launch(data.name, data.goal, data.startAt, end_date)
                  ).to.be.revertedWith("CrowdFundContract_StartDateGreaterThanEndDate()")
              })
              it("create campaign where enddate greater than max date", async function () {
                  const maxDuration = Number(await crowdFund.getMaxDuration())
                  await expect(
                      crowdFund.launch(
                          data.name,
                          data.goal,
                          data.startAt,
                          data.endAt + maxDuration + 1000
                      )
                  ).to.be.revertedWith("CrowdFundContract_EndDateGreaterThanMaxDuration()")
              })
          })

          describe("refund", () => {
              it("Refund a pledge to a donor when campaign hasn't ended", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                  await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                  await expect(crowdFund.connect(account_holder_1).refund(1)).to.be.revertedWith(
                      "CrowdFundContract_CampaignNotEnded()"
                  )
              })
              it("Refund a pledge to a donor when goal hasn't been reached", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                  await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                  moveTime(amount_to_move_time)
                  await expect(crowdFund.connect(account_holder_1).refund(1)).to.be.revertedWith(
                      "CrowdFundContract_CampaignGoalAchieved()"
                  )
              })
              it("Refund a pledge to a donor from account with no pledge", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await crowdFund.connect(account_holder_1).pledge(1, { value: 5 })
                  moveTime(amount_to_move_time)
                  await expect(crowdFund.connect(account_holder_2).refund(1)).to.be.revertedWith(
                      "CrowdFundContract_PledgeNotFound()"
                  )
              })

              it("Refund a pledge to a donor", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await crowdFund.connect(account_holder_1).pledge(1, { value: 10 })
                  moveTime(amount_to_move_time)
                  const account_before_refund = Number(await account_holder_1.getBalance())
                  const transactionResponse = await crowdFund.connect(account_holder_1).refund(1)
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  // gas cost
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const account_after_refund = Number(await account_holder_1.getBalance()) + gasCost
                  assert.isTrue(account_after_refund > account_before_refund)
              })
              it("Refund a pledge to a donor should emit an event", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await crowdFund.connect(account_holder_1).pledge(1, { value: 10 })
                  moveTime(amount_to_move_time)
                  await expect(crowdFund.connect(account_holder_1).refund(1))
                      .to.emit(crowdFund, "Refund")
                      .withArgs(1, account_holder_1.address, 10)
              })
          })
          describe("unpledge", () => {
            it("unPledge to a campaign", async function () {
                const amount_to_move_time = 60 * 60 * 24 + 20
                moveTime(amount_to_move_time)
                await crowdFund.pledge(1, { value: pledged_amount })
                await crowdFund.pledge(1, { value: pledged_amount })
                const pledge_amount_before_unpledge = await crowdFund.getPledgeAmountSender(1)
                await crowdFund.unpledge(1, pledged_amount)
                const pledge_amount_after_unpledge = await crowdFund.getPledgeAmountSender(1)

                assert.equal(pledge_amount_before_unpledge.toString(), String(2*pledged_amount))
                assert.equal(pledge_amount_after_unpledge.toString(), String(pledged_amount))
            })

            it("UnPledge to a campaign should emit an event", async function () {
                const amount_to_move_time = 60 * 60 * 24 + 20
                moveTime(amount_to_move_time)
                await crowdFund.pledge(1, { value: pledged_amount })
                await crowdFund.pledge(1, { value: pledged_amount })
                await expect(crowdFund.unpledge(1, pledged_amount)
                )
                    .to.emit(crowdFund, "Unpledge")
                    .withArgs(1, deployer.address, pledged_amount)
            })

            it("unPledge to a campaign that has ended", async function () {
                const amount_to_move_time = 60 * 60 * 24 + 20
                moveTime(amount_to_move_time)
                await crowdFund.pledge(1, { value: pledged_amount })
                await crowdFund.pledge(1, { value: pledged_amount })
                moveTime(4*amount_to_move_time)
                await expect(crowdFund.unpledge(1, pledged_amount)).to.be.revertedWith(
                    "CrowdFundContract_CampaignEnded()"
                )
            })
            it("unPledge to a campaign with sum greater than deposit", async function () {
                const amount_to_move_time = 60 * 60 * 24 + 20
                moveTime(amount_to_move_time)
                await crowdFund.pledge(1, { value: pledged_amount })
                await crowdFund.pledge(1, { value: pledged_amount })
                await expect(crowdFund.unpledge(1, ethers.utils.parseUnits("5", 18))).to.be.revertedWith(
                    "CrowdFundContract_WithdrawalGreaterThanYourPledge()"
                )
            })
        })
          describe("pledge", () => {
              it("Pledge to a campaign", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await crowdFund.pledge(1, { value: pledged_amount })
                  await crowdFund.pledge(1, { value: pledged_amount })

                  const campaign1 = await crowdFund.getCampaignById(1)
                  assert.equal(campaign1.pledged.toString(), 2 * pledged_amount)
              })
              it("Pledge to a campaign should emit an event", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await expect(crowdFund.pledge(1, { value: pledged_amount }))
                      .to.emit(crowdFund, "Pledge")
                      .withArgs(1, deployer.address, pledged_amount)
              })
              it("Pledge to a campaign that hasn't started", async function () {
                  await expect(crowdFund.pledge(1, { value: pledged_amount })).to.be.revertedWith(
                      "CrowdFundContract_CampaignNotStarted()"
                  )
              })
              it("Pledge to a campaign that has end", async function () {
                  const amount_to_move_time = 60 * 60 * 24 * 3
                  moveTime(amount_to_move_time)
                  await expect(crowdFund.pledge(1, { value: pledged_amount })).to.be.revertedWith(
                      "CrowdFundContract_CampaignEnded()"
                  )
              })
              it("Pledge to a campaign that has been cancelled", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await crowdFund.cancel(1)
                  await expect(crowdFund.pledge(1, { value: pledged_amount })).to.be.revertedWith(
                      "CrowdFundContract_CampaignCancelled()"
                  )
              })
          })

          describe("cancel", () => {
              it("cancel a campaign", async function () {
                  await crowdFund.cancel(1)
                  const campaign1 = await crowdFund.getCampaignById(1)
                  assert.equal(campaign1.isCancelled, true)
              })
              it("cancel a campaign should emit an event", async function () {
                  await expect(crowdFund.cancel(1)).to.emit(crowdFund, "Cancel").withArgs(1)
              })
              it("cancel a campaign that has ended", async function () {
                const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(10*amount_to_move_time)
                await expect(crowdFund.cancel(1)).to.be.revertedWith(
                    "CrowdFundContract_CampaignEnded()"
                )
              })
              it("cancel a campaign that has ended", async function () {
                const amount_to_move_time = 60 * 60 * 24 + 20
                moveTime(amount_to_move_time)
                await expect(crowdFund.connect(account_holder_1).cancel(1)).to.be.revertedWith(
                    "CrowdFundContract_NotCampaignOwner()"
                )
              })

              
          })
          describe("Claim", () => {
            it("claim campaign fund that has not reach the minimum claim period", async function () {
                const amount_to_move_time = 60 * 60 * 24 + 20
                moveTime(amount_to_move_time)
                const before_deployer = Number(await deployer.getBalance())
                await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                await crowdFund.connect(account_holder_2).pledge(1, { value: pledged_amount })
                await moveTime(amount_to_move_time)
                const transactionResponse = await 
                await expect(crowdFund.claim(1)).to.be.revertedWith(
                    `CrowdFundContract_CampaignWithdrawalDateNotReached()`
                )
            })
              it("claim campaign fund", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  const before_deployer = Number(await deployer.getBalance())
                  await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                  await crowdFund.connect(account_holder_2).pledge(1, { value: pledged_amount })
                  await moveTime(1072800)
                  const startingDeployerBalance = Number(
                      await ethers.provider.getBalance(deployer.address)
                  )
                  const transactionResponse = await crowdFund.claim(1)
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  // gas cost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingDeployerBalance = Number(
                      await ethers.provider.getBalance(deployer.address)
                  )
                  const after_deployer = Number(await deployer.getBalance())
                  console.log(after_deployer - before_deployer + gasCost)
                  //   console.log(endingDeployerBalance, Number(gasCost), startingDeployerBalance, endingDeployerBalance + startingDeployerBalance)
                  //   assert.equal(endingDeployerBalance + Number(gasCost) - startingDeployerBalance, 2*pledged_amount)
                  const campaign1 = await crowdFund.getCampaignById(1)
                  assert.equal(campaign1.claimed, true)
              })

              it("claimed campaign fund should emit an event", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  const before_deployer = Number(await deployer.getBalance())
                  await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                  await crowdFund.connect(account_holder_2).pledge(1, { value: pledged_amount })
                  await moveTime(1072800)
                  await expect(crowdFund.claim(1)).to.emit(crowdFund, "Claim").withArgs(1)
              })

              it("claimed campaign fund where you are not the owner", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  const before_deployer = Number(await deployer.getBalance())
                  await crowdFund.connect(account_holder_1).pledge(1, { value: pledged_amount })
                  await crowdFund.connect(account_holder_2).pledge(1, { value: pledged_amount })
                  await moveTime(1072800)
                  await expect(crowdFund.connect(account_holder_1).claim(1)).to.be.revertedWith(
                      "CrowdFundContract_NotCampaignOwner()"
                  )
              })

              it("claimed campaign fund when it has ended", async function () {
                  const amount_to_move_time = 60 * 60 * 24 + 20
                  moveTime(amount_to_move_time)
                  await expect(crowdFund.claim(1)).to.be.revertedWith(
                      "CrowdFundContract_CampaignNotEnded()"
                  )
              })
              it("claimed campaign fund when funds has been claimed", async function () {
                  const amount_to_move_time = 60 * 60 * 24 * 20
                  moveTime(amount_to_move_time)
                  await crowdFund.claim(1)
                  await expect(crowdFund.claim(1)).to.be.revertedWith(
                      "CrowdFundContract_CampaignFundClaimed()"
                  )
              })
          })
      })
