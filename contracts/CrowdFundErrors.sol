// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

////////////
// error //
////////////////////////////////////////////////////////////
error CrowdFundContract_PastDateSelected();
error CrowdFundContract_StartDateGreaterThanEndDate();
error CrowdFundContract_EndDateGreaterThanMaxDuration();
error CrowdFundContract_CampaignNotStarted();
error CrowdFundContract_CampaignEnded();
error CrowdFundContract_CampaignNotEnded();
error CrowdFundContract_CampaignFundClaimed();
error CrowdFundContract_CampaignCancelled();
error CrowdFundContract_CampaignGoalAchieved();
error CrowdFundContract_PledgeNotFound();
error CrowdFundContract_NotCampaignOwner();
error CrowdFundContract_NotContractOwner();
error CrowdFundContract_CampaignWithdrawalDateNotReached();
error CrowdFundContract_FailedToSendEther();
error CrowdFundContract_WithdrawalGreaterThanYourPledge();