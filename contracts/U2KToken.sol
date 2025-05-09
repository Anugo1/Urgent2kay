// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title U2KToken
 * @dev ERC20 token for the U2K payment ecosystem.
 */
contract U2KToken is ERC20, Ownable {
    // Total supply is 100 million tokens with 18 decimals
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * (10 ** 18);
    
    // 70% of tokens are reserved for rewards to bill sponsors
    uint256 public constant REWARDS_ALLOCATION = 70_000_000 * (10 ** 18);
    
    // The amount of tokens given to bill sponsors per bill payment
    uint256 public rewardAmount = 20 * (10 ** 18); // 20 U2K tokens
    
    // The address of the bill payment contract
    address public billPaymentContract;
    
    /**
     * @dev Constructor that mints the initial supply of tokens
     * @param initialOwner The address that will own the contract and initial token supply
     */
    constructor(address initialOwner) ERC20("Urgent2K", "U2K") {
        _mint(address(this), REWARDS_ALLOCATION); // 70% for rewards (held by contract)
        _mint(initialOwner, TOTAL_SUPPLY - REWARDS_ALLOCATION); // 30% to owner
        _transferOwnership(initialOwner);
    }
    
    /**
     * @dev Sets the bill payment contract address 
     * @param _billPaymentContract The address of the bill payment contract
     */
    function setBillPaymentContract(address _billPaymentContract) external onlyOwner {
        billPaymentContract = _billPaymentContract;
    }
    
    /**
     * @dev Updates the reward amount
     * @param _rewardAmount New reward amount (in token units)
     */
    function setRewardAmount(uint256 _rewardAmount) external onlyOwner {
        rewardAmount = _rewardAmount;
    }
    
    /**
     * @dev Sends rewards to bill sponsors. Only callable by the bill payment contract.
     * @param sponsor The address of the bill sponsor to reward
     * @return success Whether the reward was sent successfully
     */
    function rewardSponsor(address sponsor) external returns (bool success) {
        require(msg.sender == billPaymentContract, "Only bill payment contract can reward sponsors");
        require(balanceOf(address(this)) >= rewardAmount, "Insufficient reward tokens available");
        
        _transfer(address(this), sponsor, rewardAmount);
        return true;
    }
}