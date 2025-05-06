// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./U2KToken.sol";

/**
 * @title BillPaymentSystem
 * @dev Manages bill payments between beneficiaries and sponsors
 */
contract BillPaymentSystem is Ownable, ReentrancyGuard {
    // U2K token contract reference
    U2KToken public u2kToken;
    
    // Bill status enum
    enum BillStatus { Pending, Paid, Rejected }
    
    // Bill structure
    struct Bill {
        uint256 id;
        address beneficiary;
        address paymentDestination; // Where the payment should go
        address sponsor;
        uint256 amount;
        string description;
        BillStatus status;
        uint256 createdAt;
        uint256 paidAt;
    }
    
    // Mapping of bill ID to bill details
    mapping(uint256 => Bill) public bills;
    
    // Bill counter for IDs
    uint256 public billCounter;
    
    // Mapping of beneficiary address to their bill IDs
    mapping(address => uint256[]) public beneficiaryBills;
    
    // Mapping of sponsor address to their bill IDs
    mapping(address => uint256[]) public sponsorBills;
    
    // Mapping of sponsor address to their U2K token balance
    mapping(address => uint256) public sponsorTokenBalance;
    
    // Events
    event BillCreated(uint256 indexed billId, address indexed beneficiary, address indexed sponsor, uint256 amount);
    event BillPaid(uint256 indexed billId, address indexed sponsor, uint256 amount);
    event BillRejected(uint256 indexed billId, address indexed sponsor);
    event TokensRewarded(address indexed sponsor, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _u2kToken Address of the U2K token contract
     */
    constructor(address _u2kToken) {
        u2kToken = U2KToken(_u2kToken);
        billCounter = 1;
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Creates a new bill request
     * @param _sponsor Address of the bill sponsor
     * @param _paymentDestination Address where payment should be sent
     * @param _amount Amount to be paid
     * @param _description Description of the bill
     * @return billId The ID of the created bill
     */
    function createBill(
        address _sponsor,
        address _paymentDestination,
        uint256 _amount,
        string memory _description
    ) external returns (uint256 billId) {
        require(_sponsor != address(0), "Invalid sponsor address");
        require(_paymentDestination != address(0), "Invalid payment destination");
        require(_amount > 0, "Amount must be greater than zero");
        
        billId = billCounter;
        bills[billId] = Bill({
            id: billId,
            beneficiary: msg.sender,
            paymentDestination: _paymentDestination,
            sponsor: _sponsor,
            amount: _amount,
            description: _description,
            status: BillStatus.Pending,
            createdAt: block.timestamp,
            paidAt: 0
        });
        
        // Add bill to respective lists
        beneficiaryBills[msg.sender].push(billId);
        sponsorBills[_sponsor].push(billId);
        
        emit BillCreated(billId, msg.sender, _sponsor, _amount);
        
        billCounter++;
        return billId;
    }
    
    /**
     * @dev Pays a bill using ETH/native currency
     * @param _billId ID of the bill to pay
     */
    function payBillWithNative(uint256 _billId) external payable nonReentrant {
        Bill storage bill = bills[_billId];
        
        require(bill.id != 0, "Bill does not exist");
        require(bill.sponsor == msg.sender, "Only sponsor can pay");
        require(bill.status == BillStatus.Pending, "Bill is not pending");
        require(msg.value >= bill.amount, "Insufficient payment amount");
        
        // Update bill status
        bill.status = BillStatus.Paid;
        bill.paidAt = block.timestamp;
        
        // Send payment to destination
        (bool success, ) = bill.paymentDestination.call{value: bill.amount}("");
        require(success, "Payment failed");
        
        // Return excess funds if any
        uint256 excess = msg.value - bill.amount;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
        
        // Reward the sponsor with U2K tokens
        _rewardSponsor(msg.sender);
        
        emit BillPaid(_billId, msg.sender, bill.amount);
    }
    
    /**
     * @dev Pays a bill using U2K tokens
     * @param _billId ID of the bill to pay
     */
    function payBillWithU2K(uint256 _billId) external nonReentrant {
        Bill storage bill = bills[_billId];
        
        require(bill.id != 0, "Bill does not exist");
        require(bill.sponsor == msg.sender, "Only sponsor can pay");
        require(bill.status == BillStatus.Pending, "Bill is not pending");
        
        // Calculate the equivalent amount of U2K tokens (1:1 for simplicity)
        uint256 tokenAmount = bill.amount;
        
        // Check if the sender has enough tokens
        require(u2kToken.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        // Update bill status
        bill.status = BillStatus.Paid;
        bill.paidAt = block.timestamp;
        
        // Transfer tokens from sender to payment destination
        bool transferSuccess = u2kToken.transferFrom(msg.sender, bill.paymentDestination, tokenAmount);
        require(transferSuccess, "Token transfer failed");
        
        // Reward the sponsor with U2K tokens
        _rewardSponsor(msg.sender);
        
        emit BillPaid(_billId, msg.sender, bill.amount);
    }
    
    /**
     * @dev Rejects a bill
     * @param _billId ID of the bill to reject
     */
    function rejectBill(uint256 _billId) external {
        Bill storage bill = bills[_billId];
        
        require(bill.id != 0, "Bill does not exist");
        require(bill.sponsor == msg.sender, "Only sponsor can reject");
        require(bill.status == BillStatus.Pending, "Bill is not pending");
        
        bill.status = BillStatus.Rejected;
        
        emit BillRejected(_billId, msg.sender);
    }
    
    /**
     * @dev Internal function to reward a sponsor with U2K tokens
     * @param _sponsor Address of the sponsor to reward
     */
    function _rewardSponsor(address _sponsor) internal {
        bool rewardSuccess = u2kToken.rewardSponsor(_sponsor);
        require(rewardSuccess, "Rewarding sponsor failed");
        
        // Update sponsor's token balance in our tracking
        sponsorTokenBalance[_sponsor] += u2kToken.rewardAmount();
        
        emit TokensRewarded(_sponsor, u2kToken.rewardAmount());
    }
    
    /**
     * @dev Gets all bills of a beneficiary
     * @param _beneficiary Address of the beneficiary
     * @return billIds Array of bill IDs
     */
    function getBeneficiaryBills(address _beneficiary) external view returns (uint256[] memory) {
        return beneficiaryBills[_beneficiary];
    }
    
    /**
     * @dev Gets all bills of a sponsor
     * @param _sponsor Address of the sponsor
     * @return billIds Array of bill IDs
     */
    function getSponsorBills(address _sponsor) external view returns (uint256[] memory) {
        return sponsorBills[_sponsor];
    }
    
    /**
     * @dev Gets a bill's details
     * @param _billId ID of the bill
     * @return bill Full bill details
     */
    function getBill(uint256 _billId) external view returns (Bill memory) {
        return bills[_billId];
    }
    
    /**
     * @dev Gets the sponsor's token balance
     * @param _sponsor Address of the sponsor
     * @return balance Token balance
     */
    function getSponsorTokenBalance(address _sponsor) external view returns (uint256) {
        return sponsorTokenBalance[_sponsor];
    }
    
    /**
     * @dev Updates the U2K token contract address
     * @param _u2kToken New token contract address
     */
    function updateTokenContract(address _u2kToken) external onlyOwner {
        u2kToken = U2KToken(_u2kToken);
    }
}