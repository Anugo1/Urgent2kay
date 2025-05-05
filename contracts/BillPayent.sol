// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Urgent2ktoken.sol";

contract BillPayment {
    U2KToken public u2kToken;
    address public admin;

    mapping(address => bool) public approvedProviders;

    event BillPaid(
        address indexed sponsor,
        address indexed provider,
        uint256 amount,
        uint256 reward
    );

    constructor(address tokenAddress) {
        u2kToken = U2KToken(tokenAddress);
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function whitelistProvider(address provider, bool status) external onlyAdmin {
        approvedProviders[provider] = status;
    }

    function payBill(address provider) external payable {
        require(approvedProviders[provider], "Provider not approved");
        require(msg.value > 0, "Must send ETH");

        // Forward ETH to the provider
        (bool success, ) = provider.call{value: msg.value}("");
        require(success, "Transfer failed");

        // Reward the sponsor
        uint256 reward = (msg.value / 1 ether) * 10 * 1e18; // 10 U2K per ETH
        u2kToken.mint(msg.sender, reward);

        emit BillPaid(msg.sender, provider, msg.value, reward);
    }
}
