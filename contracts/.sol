// SPDX - License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 

contract Urgent2ktoken is ERC20, Ownable {
    contractor() ERC20("Urgent2Kay","U2k"){}

    function mint(address to, uint256 amount) external onlyOnwer {
        _mint(to,amount);
    }
}