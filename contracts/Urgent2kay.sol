// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Urgent2kay is ERC20, Ownable {

    uint256 public constant REWARD_AMOUNT = 100 * 10 ** 18;

     constructor() ERC20("Urgent2kay", "U2k") {}

     function mint(address to, uint256 amount)external onlyOwner {
        _mint(to, amount);
     }
     }