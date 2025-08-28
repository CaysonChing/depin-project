// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DeviceRegistry.sol";

/**
 * @title UsageManager
 * @dev This contract manages service usage sessions and handles payments.
 * It is designed for a fixed fee per session, paid in Ether (POL).
 * Device owner can withdraw their accumulated earnings through pull pattern.
 */
contract UsageManager is Ownable, ReentrancyGuard {
    DeviceRegistry public deviceRegistry; // Reference to DeviceRegistry contract
    mapping(address => uint256) private balances; // Mapping to store user-specific accumulated balance for withdrawal
    uint256 public fixedFee; // Fixed fee charged per session

    // Session structure to hold session details
    struct Session {
        address user;
        address device;
        uint256 startTime;
        uint256 fee;
        bool active;
    }

    mapping(bytes32 => Session) public sessions; // Mapping to store active sessions, indexed by a unique session ID
    mapping(address => bytes32) public deviceActiveSession; // Track active session per device (device => active sessionId)

    uint256 private sessionNonce; // Nonce to ensure unique session IDs

    // Event to log when a session starts
    event SessionStarted(
        bytes32 indexed sessionId,
        address indexed user,
        address indexed device,
        uint256 startTime,
        uint256 fee
    );

    // Event to log when a session ends
    event SessionEnded(
        bytes32 indexed sessionId,
        address indexed deviceOwner,
        uint256 endTime,
        uint256 feePaid
    );

    // Event to log when a device owner withdraws their earnings
    event Withdrawal(address indexed deviceOwner, uint256 amount);

    /**
     * @dev The constructor sets the inital owner and the address of the Device Registry.
     * @param initialOwner The address that will be the first owner of the contract.
     * @param _deviceRegistryAddress The address of the deployed DeviceRegistry contract.
     * @param _initialFixedFee The initial fixed fee charged per session.
     */
    constructor(
        address initialOwner,
        address _deviceRegistryAddress,
        uint256 _initialFixedFee
    ) Ownable (msg.sender) {
        
        require(_deviceRegistryAddress != address(0), "Invalid DeviceRegistry address");       // Check for valid DeviceRegistry address
        require(_initialFixedFee > 0, "Fee must be greater than 0");    // Check for valid fee

        deviceRegistry = DeviceRegistry(_deviceRegistryAddress); // Initialize the DeviceRegistry reference
        fixedFee = _initialFixedFee; // Set the initial fixed fee

        // Ownable constructor sets deployer as owner
        if (initialOwner != address(0) && initialOwner != msg.sender) {
            transferOwnership(initialOwner);
        }
    }

    // Contract Owner-only configuration functions

    /**
     * @dev set the fixed fee for a session.
     * This function is restricted to the contract owner.
     * @param _newFee the new fee to be set
     */
    function setFixedFee(uint256 _newFee) external onlyOwner {
        require(_newFee > 0, "Fee must be greater than zero"); // Ensure the new fee is valid
        fixedFee = _newFee; // Update the fixed fee
    }

    function setDeviceRegistry(address _deviceRegistryAddress) external onlyOwner {
        require(_deviceRegistryAddress != address(0), "Invalid address"); // Check for valid address
        deviceRegistry = DeviceRegistry(_deviceRegistryAddress); // Update the DeviceRegistry reference
    }

    // Session lifecycle functions

    /**
     * @dev Starts a new usage session. The user sends the fixed fee with this transaction.
     * The payment is secured and held by the contract.
     * Prevent a device from having multiple active sessions.
     * @param _deviceAddress The address of the device being used.
     * @return sessionId Unique session ID for tracking.
     */
    function startSession(address _deviceAddress) external payable nonReentrant returns (bytes32 sessionId) {
        require(deviceRegistry.isDeviceActive(_deviceAddress), "Device is not active or not found"); // Ensure the device exists and is active
        require(msg.value == fixedFee, "Incorrect fee sent"); // Ensure the user sent the correct fee.
        require(deviceActiveSession[_deviceAddress] == bytes32(0),"Device already has an active session"); // Prevent multiple active sessions for the same device

        // Generate a unique session ID based on the user's address and timestamp.
        sessionId = keccak256(
            abi.encodePacked(
                msg.sender,
                _deviceAddress,
                block.timestamp,
                sessionNonce
            )
        );
        sessionNonce++;

        require(!sessions[sessionId].active, "Session already exists"); // Prevent accidental collision of session IDs

        // Store session details
        sessions[sessionId] = Session({
            user: msg.sender,
            device: _deviceAddress,
            startTime: block.timestamp,
            fee: fixedFee,
            active: true
        });

        deviceActiveSession[_deviceAddress] = sessionId; // Mark this device as having an active session

        //Emit event to log the session start.
        emit SessionStarted(
            sessionId,
            msg.sender,
            _deviceAddress,
            block.timestamp,
            msg.value
        );
    }

    /**
     * @dev Ends a usage session.
     * The device owner, session starter (user), and contract owner (emergency) can end the session.
     * Fee is credited to the device owner (pull pattern).
     * @param sessionId The unique ID of the session to end.
     */
    function endSession(bytes32 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId]; // Fetch the session details
        require(s.active, "Session not active or not found"); // Ensure the session is exists and is active

        address deviceOwner = deviceRegistry.getDeviceOwner(s.device); // Get the device owner from the registry
        require(deviceOwner != address(0), "Invalid device owner address"); // Ensure the device owner address is valid

        // Authorization check: only device owner, contract owner, or session user can end the session
        bool isDeviceOwner = (msg.sender == deviceOwner);
        bool isContractOwner = (msg.sender == owner());
        bool isSessionUser = (msg.sender == s.user);

        require(isDeviceOwner || isContractOwner || isSessionUser, "Not authorized to end session"); // authorization: device owner or contract owner only

        balances[deviceOwner] += s.fee; // Credit the device owner's (pull pattern)
        s.active = false; // Mark the session as inactive

        // Clear the active session for the device
        if (deviceActiveSession[s.device] == sessionId) {
            deviceActiveSession[s.device] = bytes32(0);
        }

        // Emit event to log the session end
        emit SessionEnded(sessionId, deviceOwner, block.timestamp, s.fee);
    }

    /**
     * @dev Allows device owners to withdraw their accumulated earnings.
     * This uses a "pull instead of push" pattern for security. Users "pull" their funds rather than the contract "pushing" them, helps with re-entrancy attacks.
     */
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender]; // Get the caller's balance
        require(amount > 0, "No balance to withdraw"); // Ensure that user has positive balance to withdraw

        balances[msg.sender] = 0; // Reset the balance to 0

        // Transfer the fee
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        // Emit event to log successful withdrawal
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @dev Gets the accumulated balance for a specific address.
     * @param _deviceOwner The address to query.
     * @return The current balance.
     */
    function getBalance(address _deviceOwner) external view returns (uint256) {
        return balances[_deviceOwner];
    }

    /**
     * @dev Gets the details of a specific session.
     * @param sessionId The unique ID of the session to query.
     * @return The session details.
     */
    function getSession(
        bytes32 sessionId
    ) external view returns (Session memory) {
        return sessions[sessionId];
    }

    /**
     * @dev Gets the active session ID for a specific device.
     * @param device The address of the device to query.
     * @return The active session ID, or bytes32(0) if no active session.
     */
    function activeSessionOfDevice(address device) external view returns (bytes32) {
        return deviceActiveSession[device];
    }

    // Accept accidental native transfers
    receive() external payable {}
}
