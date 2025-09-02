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
    mapping(address => uint256) private deviceBalances; // Map device to their own fee pool

    uint256 public registrationReward; // Fixed reward for registering device

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

    // ----- Events -----
    event SessionStarted(
        bytes32 indexed sessionId,
        address indexed user,
        address indexed device,
        uint256 startTime,
        uint256 fee
    );

    event SessionEnded(
        bytes32 indexed sessionId,
        address indexed deviceOwner,
        uint256 endTime,
        uint256 feePaid
    );

    event Withdraw(
        address indexed device,
        address indexed deviceOwner,
        uint256 amount
    );

    // ----- Constructor -----
    /**
     * @dev The constructor sets the inital owner and the address of the Device Registry.
     * @param initialOwner The address that will be the first owner of the contract.
     * @param _deviceRegistryAddress The address of the deployed DeviceRegistry contract.
     */
    constructor(
        address initialOwner,
        address _deviceRegistryAddress
    ) Ownable(initialOwner) {
        // Check for valid DeviceRegistry address
        require(
            _deviceRegistryAddress != address(0),
            "Invalid DeviceRegistry address"
        );
        deviceRegistry = DeviceRegistry(_deviceRegistryAddress); // Initialize the DeviceRegistry reference
    }

    // ----- Contract Owner Functions -----

    function setRegistrationReward(uint256 _reward) external onlyOwner {
        require(_reward > 0, "Reward must be greater than 0"); // Check for valid reward amount
        registrationReward = _reward;
    }

    function setDeviceRegistry(
        address _deviceRegistryAddress
    ) external onlyOwner {
        require(_deviceRegistryAddress != address(0), "Invalid address"); // Check for valid address
        deviceRegistry = DeviceRegistry(_deviceRegistryAddress); // Update the DeviceRegistry reference
    }

    // ----- Session lifecycle functions -----
    /**
     * @dev Starts a new usage session. The user sends the fixed fee with this transaction.
     * The payment is secured and held by the contract.
     * Prevent a device from having multiple active sessions.
     * @param _deviceAddress The address of the device being used.
     * @return sessionId Unique session ID for tracking.
     */
    function startSession(
        address _deviceAddress
    ) external payable nonReentrant returns (bytes32 sessionId) {
        // Ensure the device exists and is active
        require(
            deviceRegistry.isDeviceActive(_deviceAddress),
            "Device is not active or not found"
        );
        // Prevent multiple active sessions for the same device
        require(
            deviceActiveSession[_deviceAddress] == bytes32(0),
            "Device already has an active session"
        );

        // Fetch device info
        uint256 deviceFee = deviceRegistry.getDeviceFee(_deviceAddress);
        require(msg.value == deviceFee, "Incorrect fee sent");

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
            fee: deviceFee,
            active: true
        });

        deviceActiveSession[_deviceAddress] = sessionId; // Mark this device as having an active session

        //Emit event to log the session start.
        emit SessionStarted(
            sessionId,
            msg.sender,
            _deviceAddress,
            block.timestamp,
            deviceFee
        );
    }

    /**
     * @dev Ends a usage session.
     * The device owner, session starter (user), and contract owner (emergency) can end the session.
     * Fee is credited to the device owner (pull pattern).
     * @param sessionId The unique ID of the session to end.
     */
    function endSession(bytes32 sessionId) external nonReentrant {
        Session storage session = sessions[sessionId]; // Fetch the session details
        require(session.active, "Session not active or not found"); // Ensure the session is exists and is active

        address deviceOwner = deviceRegistry.getDeviceOwner(session.device); // Get the device owner from the registry
        require(deviceOwner != address(0), "Invalid device owner address"); // Ensure the device owner address is valid

        // Authorization check: only device owner, contract owner, or session user can end the session
        bool isDeviceOwner = (msg.sender == deviceOwner);
        bool isContractOwner = (msg.sender == owner());
        bool isSessionUser = (msg.sender == session.user);
        require(
            isDeviceOwner || isContractOwner || isSessionUser,
            "Not authorized to end session"
        );

        // Credit balance into device pool
        deviceBalances[session.device] += session.fee;
        session.active = false; // Mark the session as inactive

        // Clear the active session for the device
        if (deviceActiveSession[session.device] == sessionId) {
            deviceActiveSession[session.device] = bytes32(0);
        }

        // Emit event to log the session end
        emit SessionEnded(sessionId, deviceOwner, block.timestamp, session.fee);
    }

    // ----- Withdrawal functions -----
    /**
     * @dev Allows device owners to withdraw their accumulated earnings.
     * This uses a "pull instead of push" pattern for security. Users "pull" their funds rather than the contract "pushing" them, helps with re-entrancy attacks.
     */
    function withdraw(address _deviceAddress) external nonReentrant {
        require(
            deviceRegistry.getDeviceOwner(_deviceAddress) == msg.sender,
            "Not device owner"
        );

        uint256 amount = deviceBalances[_deviceAddress]; // Get the amount of token in device
        require(amount > 0, "No balance to withdraw"); // Ensure that device has a positive balance to withdraw

        deviceBalances[_deviceAddress] = 0; // Reset the balance the device hold to 0

        // Transfer the fee
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        // Emit event to log successful withdrawal
        emit Withdraw(_deviceAddress, msg.sender, amount);
    }

    // ------ Get Functions ------
    /**
     * @dev Function to get Balance of a device
     */
    function getDeviceBalance(
        address _deviceAddress
    ) external view returns (uint256) {
        return deviceBalances[_deviceAddress];
    }

    /**
     * @dev Function to get a specific session
     */
    function getSession(
        bytes32 sessionId
    ) external view returns (Session memory) {
        return sessions[sessionId];
    }

    /**
     * @dev Function the session state of a device
     */
    function activeSessionOfDevice(
        address device
    ) external view returns (bytes32) {
        return deviceActiveSession[device];
    }

    // Accept accidental native transfers
    receive() external payable {}
}
