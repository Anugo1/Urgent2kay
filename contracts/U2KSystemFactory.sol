// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./U2KToken.sol";
import "./BillPaymentSystem.sol";

/**
 * @title U2KSystemFactory
 * @dev Factory contract to deploy the entire U2K payment ecosystem
 */
contract U2KSystemFactory {
    // Deployed contracts
    U2KToken public u2kToken;
    BillPaymentSystem public billPaymentSystem;
    
    // Event for deployed system
    event SystemDeployed(address indexed token, address indexed paymentSystem, address indexed deployer);
    
    /**
     * @dev Deploys the U2K token and bill payment system
     * @return deployedToken Address of the deployed token contract
     * @return deployedPaymentSystem Address of the deployed payment system contract
     */
    function deploySystem() external returns (address deployedToken, address deployedPaymentSystem) {
        // Deploy the U2K token contract
        u2kToken = new U2KToken(msg.sender);
        
        // Deploy the bill payment system
        billPaymentSystem = new BillPaymentSystem(address(u2kToken));
        
        // Set the bill payment contract address in the token contract
        u2kToken.setBillPaymentContract(address(billPaymentSystem));
        
        emit SystemDeployed(address(u2kToken), address(billPaymentSystem), msg.sender);
        
        return (address(u2kToken), address(billPaymentSystem));
    }
}