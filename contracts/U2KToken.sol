// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract U2KToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    uint256 public constant REWARDS_POOL = (TOTAL_SUPPLY * 70) / 100; // 70% for rewards
    
    constructor() ERC20("Urgent2k Token", "U2K") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY - REWARDS_POOL); // Mint remaining 30% to owner
        _mint(address(this), REWARDS_POOL); // Mint 70% to contract for rewards
    }

    function mintRewards(address to, uint256 amount) external onlyOwner {
        require(amount <= balanceOf(address(this)), "Insufficient rewards pool");
        _transfer(address(this), to, amount);
    }
} 