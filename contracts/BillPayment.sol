// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./U2KToken.sol";

contract BillPayment is ReentrancyGuard, Ownable {
    U2KToken public immutable u2kToken;
    uint256 public constant REWARD_AMOUNT = 20 * 10**18; // 20 U2K tokens per bill
    
    struct Bill {
        address beneficiary;
        address provider;
        uint256 amount;
        bool isPaid;
        bool exists;
    }
    
    mapping(uint256 => Bill) public bills;
    mapping(address => uint256) public sponsorBalances;
    uint256 public billCount;
    
    event BillCreated(uint256 billId, address beneficiary, address provider, uint256 amount);
    event BillPaid(uint256 billId, address sponsor, uint256 amount);
    event RewardDistributed(address sponsor, uint256 amount);
    
    constructor(address _u2kToken) Ownable(msg.sender) {
        u2kToken = U2KToken(_u2kToken);
    }
    
    function createBill(address _provider, uint256 _amount) external returns (uint256) {
        require(_provider != address(0), "Invalid provider address");
        require(_amount > 0, "Amount must be greater than 0");
        
        uint256 billId = billCount++;
        bills[billId] = Bill({
            beneficiary: msg.sender,
            provider: _provider,
            amount: _amount,
            isPaid: false,
            exists: true
        });
        
        emit BillCreated(billId, msg.sender, _provider, _amount);
        return billId;
    }
    
    function payBill(uint256 _billId) external payable nonReentrant {
        Bill storage bill = bills[_billId];
        require(bill.exists, "Bill does not exist");
        require(!bill.isPaid, "Bill already paid");
        require(msg.value >= bill.amount, "Insufficient payment");
        
        // Transfer payment to provider
        (bool success, ) = bill.provider.call{value: bill.amount}("");
        require(success, "Payment transfer failed");
        
        // Mark bill as paid
        bill.isPaid = true;
        
        // Distribute reward to sponsor
        u2kToken.mintRewards(msg.sender, REWARD_AMOUNT);
        sponsorBalances[msg.sender] += REWARD_AMOUNT;
        
        emit BillPaid(_billId, msg.sender, bill.amount);
        emit RewardDistributed(msg.sender, REWARD_AMOUNT);
        
        // Return excess payment if any
        if (msg.value > bill.amount) {
            (success, ) = msg.sender.call{value: msg.value - bill.amount}("");
            require(success, "Excess payment return failed");
        }
    }
    
    function getBillStatus(uint256 _billId) external view returns (bool isPaid, address beneficiary, address provider, uint256 amount) {
        Bill storage bill = bills[_billId];
        require(bill.exists, "Bill does not exist");
        return (bill.isPaid, bill.beneficiary, bill.provider, bill.amount);
    }
    
    function getSponsorBalance(address _sponsor) external view returns (uint256) {
        return sponsorBalances[_sponsor];
    }
}
