// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "./CrowdFundErrors.sol";

/**
 * @title Feducia
 * @author Odeyemi Increase Ayobami
 * @notice This is use to create campagn/idea and fund them in a decentralised context
 *         This project was inspired by solidity by example with changes where necessary
 *         for performance and a comprhensive test
 * @dev Use Hardhat and this is create for the Polygon Hackathon
 */
contract CrowdFundContract {
    /////////////
    // Events //
    ////////////////////////////////////////////////////////////
    event Launch(uint256 id, address indexed creator, uint256 goal, uint256 startAt, uint256 endAt);
    event Cancel(uint256 id);
    event Pledge(uint256 indexed id, address indexed caller, uint256 amount);
    event Unpledge(uint256 indexed id, address indexed caller, uint256 amount);
    event Claim(uint256 id);
    event Refund(uint256 id, address indexed caller, uint256 amount);
    event Error(address indexed caller, uint256 amount);

    /////////////
    // Types //
    ////////////////////////////////////////////////////////////

    struct Campaign {
        string name;
        uint256 id;
        address creator;
        uint256 goal;
        uint256 pledged;
        uint256 startAt;
        uint256 endAt;
        bool claimed;
        bool isCancelled;
    }

    ///////////////
    // Modifiers //
    ////////////////////////////////////////////////////////////
    // Modifiers
    modifier onlyOwner {
            if (msg.sender != i_owner) revert CrowdFundContract_NotContractOwner();
            _;
    }

    ////////////////
    // Variables //
    ////////////////////////////////////////////////////////////
    uint256 public s_campaignCount;
    string s_fundname;
    uint256 maxDuration = 365 days;
    uint256 minWithdrawalDuration = 2 days;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public pledgedAmount;
    address private /* immutable */ i_owner;

    ////////////////////////
    // Special Functions //
    ////////////////////////////////////////////////////////////
    constructor() {
        i_owner = msg.sender;
    }

    fallback() external payable {
        emit Error(msg.sender, msg.value);
    }

    receive() external payable {
        // console.log("----- receive:", msg.value);
    }

    /////////////////////
    // Main Functions //
    ////////////////////////////////////////////////////////////

    /**
     * @notice This Function is used to contribute/fund a campaign
     * @dev Not working with decimal numbers
     * @param _name The name of the campaign
     * @param _goal How much is to be raise in this campaign
     * @param _startAt When will the campaign start
     * @param _endAt When will the campaign end
     */
    function launch(
        string memory _name,
        uint256 _goal,
        uint256 _startAt,
        uint256 _endAt
    ) public {
        if (_startAt <= block.timestamp) revert CrowdFundContract_PastDateSelected();
        if (_endAt <= _startAt) revert CrowdFundContract_StartDateGreaterThanEndDate();
        if (_endAt >= block.timestamp + maxDuration) revert CrowdFundContract_EndDateGreaterThanMaxDuration();
        s_campaignCount += 1;
        campaigns[s_campaignCount] = Campaign({
            name: _name,
            id: s_campaignCount,
            creator: msg.sender,
            goal: _goal,
            pledged: 0,
            startAt: _startAt,
            endAt: _endAt,
            claimed: false,
            isCancelled: false
        });
        emit Launch(s_campaignCount, msg.sender, _goal, _startAt, _endAt);
    }

    /**
     * @notice This function is used to cancel a campaign
     * @dev I thought about creating a modifier but use if statement instead cause
     *      campaign id will be used in each modified and is a waste of computing power
     * @param _id The id of the campaign
     */
    function cancel(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        if (block.timestamp >= campaign.endAt)  revert CrowdFundContract_CampaignEnded();
        if (campaign.creator != msg.sender) revert CrowdFundContract_NotCampaignOwner();
        campaign.isCancelled = true;
        emit Cancel(_id);
    }

    /**
     * @notice This function is used to fund a campaign
     * @param _id The id of the campaign
     */
    function pledge(uint256 _id) public payable  {
        Campaign storage campaign = campaigns[_id];
        //console.log("start: %s, blocktime: %s", campaign.startAt, block.timestamp);

        if (block.timestamp <= campaign.startAt)  revert CrowdFundContract_CampaignNotStarted();
        if (block.timestamp >= campaign.endAt)  revert CrowdFundContract_CampaignEnded();
        if (campaign.isCancelled)  revert CrowdFundContract_CampaignCancelled();
        campaign.pledged += msg.value;
        pledgedAmount[_id][msg.sender] += msg.value;
        emit Pledge(_id, msg.sender, msg.value);
    }

    /**
     * @notice This function is used to get your funds before the end of a campaign
     * @param _id The id of the campaign
     */
    function unpledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        uint256 bal = pledgedAmount[_id][msg.sender];
        if (_amount > bal) revert CrowdFundContract_WithdrawalGreaterThanYourPledge();
        if (block.timestamp > campaign.endAt) revert CrowdFundContract_CampaignEnded();

        campaign.pledged -= _amount;
        pledgedAmount[_id][msg.sender] -= _amount;

        (bool sent, ) = msg.sender.call{value: _amount}("");
        if(!sent) revert CrowdFundContract_FailedToSendEther();

        emit Unpledge(_id, msg.sender, _amount);
    }

    /**
     * @notice This function is collect the funds in a campaign
     * @dev It can only be called by the owner of the campaign
     * @param _id The id of the campaign
     */
    function claim(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        // console.log("end=> %s, block time %s", campaign.endAt, block.timestamp);
        if (campaign.creator != msg.sender) revert CrowdFundContract_NotCampaignOwner();
        if (campaign.endAt > block.timestamp) revert CrowdFundContract_CampaignNotEnded();
        if (campaign.endAt + minWithdrawalDuration > block.timestamp) revert CrowdFundContract_CampaignWithdrawalDateNotReached();
        if (campaign.claimed) revert CrowdFundContract_CampaignFundClaimed();

        campaign.claimed = true;
        (bool sent, ) = campaign.creator.call{value: campaign.pledged}("");
        if(!sent) revert CrowdFundContract_FailedToSendEther();
 

        emit Claim(_id);
    }

    /**
     * @notice This function is collect all the pledge by a donor if the goal was not met
     * @dev It can only be called by the donor and
     * all the funds will be removed you have a three days time frame to collect the said balamce
     * @param _id The id of the campaign
     */
    function refund(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        if (block.timestamp < campaign.endAt) revert CrowdFundContract_CampaignNotEnded();
        if (campaign.pledged >= campaign.goal) revert CrowdFundContract_CampaignGoalAchieved();
        uint256 bal = pledgedAmount[_id][msg.sender];
        if (bal == 0) revert CrowdFundContract_PledgeNotFound();
        pledgedAmount[_id][msg.sender] = 0;
        campaign.pledged -= bal;
        (bool sent, ) = msg.sender.call{value: bal}("");
        if(!sent) revert CrowdFundContract_FailedToSendEther();
        emit Refund(_id, msg.sender, bal);
    }

    ////////////////////////////
    // Pure / View Functions //
    ////////////////////////////////////////////////////////////
    /**
     * @notice This function is get the number campaigns in this contract
     */
    function getNumberOfCampaigns() public view returns (uint256) {
        return s_campaignCount;
    }

    /**
     * @notice This function is get the number campaigns in this contract
     */
    function getMaxDuration() public view returns (uint256) {
        return maxDuration;
    }

    function setMaxDuration(uint256 _duration) onlyOwner public {
        maxDuration = _duration;
    }
    function getMinimumWithdrawalDuration() public view returns (uint256) {
        return minWithdrawalDuration;
    }

    function setMinimumWithdrawalDuration(uint256 _duration) onlyOwner public {
        minWithdrawalDuration = _duration;
    }

    /**
     * @notice This function is used get the details of a campaign
     * @param _id The id of the campaign
     */
    function getCampaignById(uint256 _id) public view returns (Campaign memory) {
        return campaigns[_id];
    }

    /**
     * @notice This function is used get amount the  paid to a campaign ( the address is the person sending the request)
     * @param _id The id of the campaign
     */
    function getPledgeAmountSender(uint256 _id)
        public
        view
        returns (
            uint256 /*amount*/
        )
    {
        return pledgedAmount[_id][msg.sender];
    }

    /**
     * @notice This function is used get get amount the send to a campaign by an unknown/known account
     * @param _id The id of the campaign
     * @param _account The address of the funder
     */
    function getPledgeAmount(uint256 _id, address _account)
        public
        view
        returns (
            uint256 /*amount*/
        )
    {
        return pledgedAmount[_id][_account];
    }

    /**
     * @notice This function withdraw funds sent to the address and not to a campaign
     */
    // function withdraw() public onlyOwner {
    //     (bool sent, ) = msg.sender.call{value: bal}("");
    //     if(!sent) revert CrowdFundContract_FailedToSendEther();
    // }
}
