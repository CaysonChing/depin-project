// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DeviceUsageManager
 * @dev This contract manages the registration, management and usage of the devices uploaded unto the DePIN system.
 */
contract DeviceUsageManager is Ownable, ReentrancyGuard{
    

    // ========== DeviceRegistry =========
    struct Device{
        address deviceOwner;
        bool isActive;
        string deviceType;
        uint256 lastSeen;
        bytes32 publicKey;
        uint256 fee;
    }

    mapping(address => Device) public devices;                                  // deviceAddress => Device
    address[]  private deviceAddresses;                                         // list of device addresses
    mapping(address => address[]) private ownerDevices;                         // owner => list of device addresses
    mapping(bytes32 => address) private publicKeyToDevice;                       // map device's public keys
    mapping(address => uint256) private deviceIndex;                            // Mapping device index
    mapping(address => mapping(address => uint256)) private ownerDeviceIndex;   // Mapping ownerDevice index

    // ========== Session ==========
    struct Session{
        address user;
        address deviceAddress;
        uint256 startTime;
        uint256 endTime;
        uint256 fee;
        bool active;
    }

    mapping(bytes32 => Session) public sessions;            // Session indexed by unique sessionId   
    mapping(address => bytes32) public deviceActiveSession; // Track active session per device
    mapping(address => uint256) private deviceBalance;      // Earnings are tracked per device

    uint256 private sessionNonce;                           // Uniqueness for session IDs
    uint256 public registrationReward;                      // Reward set by Contract owner for new device registration


    // ========== Events ==========
    // Device Registry Events
    event DeviceRegistered(address indexed deviceAddress, address indexed deviceOwner, string deviceType, bytes32 publicKey, uint256 fee);    
    event RegistrationRewardPaid(address indexed deviceAddress, uint256 amount);       
    event DeviceInfoUpdated(address indexed deviceAddress, string newDeviceType, uint256 fee);     
    event DeviceStatusUpdated(address indexed deviceAddress, bool newStatus);                                           
    event DeviceRemoved(address indexed deviceAddress);                                                                 
    event DeviceHeartbeat(address indexed deviceAddress, uint256 timestamp);    
    
    // Session/earning events
    event SessionStarted(bytes32 indexed sessionId, address indexed user, address indexed deviceAddress, uint256 startTime, uint256 fee);
    event SessionEnded(bytes32 indexed sessionId, address indexed user, address indexed deviceAddress, uint256 endTime, uint256 fee);
    event Withdraw(address indexed deviceOwner, address indexed deviceAddress, uint256 amount);
    event WithdrawAll(address indexed deviceOwner, uint256 amount);


    // ========== Constructor ==========
    constructor(address initialOwner) Ownable(initialOwner) {}

    // ========== Contract owner config ==========
    function setRegistrationReward(uint256 _reward) external onlyOwner{
        require(_reward > 0, "Reward must be greater than 0");
        registrationReward = _reward;
    }

    function fundContract() external payable onlyOwner{
        require(msg.value > 0, "Must send tokens to fund");
    }

    receive() external payable {} // Accept other currency transfers


    // ========== Modifiers ==========
    modifier onlyAdminOrDeviceOwner (address _deviceAddress) {
        
        address dOwner = devices[_deviceAddress].deviceOwner;
        require(dOwner != address(0), "Device not registered");
        require(msg.sender == owner() || msg.sender == dOwner, "Not authorized");
        _;
    }

    modifier onlyDeviceOwner (address _deviceAddress){
        require(devices[_deviceAddress].deviceOwner == msg.sender, "Not device owner");
        _;
    }


    // ========== Device Management ==========
    function registerDevice(
        address _deviceAddress, 
        address _deviceOwner, 
        string calldata _deviceType, 
        bytes32 _publicKey, 
        uint256 _fee
    ) external {
    
        // Confirmation conditions
        require(_deviceAddress != address(0) && _deviceOwner != address(0), "Zero address");
        require(_deviceAddress != _deviceOwner, "Device cannot be owner");
        require(devices[_deviceAddress].deviceOwner == address(0), "Device is already registered");
        require(_publicKey != bytes32(0), "PublicKey cannot be empty"); 
        require(publicKeyToDevice[_publicKey] == address(0), "Public key is already in use");
        require(msg.sender == _deviceOwner, "You can only register devices for yourself");
        require(_fee > 0, "Fee must be greater than 0");
        require(bytes(_deviceType).length > 0 && bytes(_deviceType).length <= 64, "Invalid device type length");

        // Map device value to object
        devices[_deviceAddress] = Device({
            deviceOwner: _deviceOwner,
            isActive: true,
            deviceType: _deviceType,
            lastSeen: block.timestamp,
            publicKey: _publicKey,
            fee: _fee
        });

        // Add to deviceAddress array and index mapping
        deviceIndex[_deviceAddress] = deviceAddresses.length + 1;
        deviceAddresses.push(_deviceAddress);

        // Add to ownerDevices array and index mapping
        ownerDeviceIndex[_deviceOwner][_deviceAddress] = ownerDevices[_deviceOwner].length + 1;
        ownerDevices[_deviceOwner].push(_deviceAddress);

        // Map public key to device address
        publicKeyToDevice[_publicKey] = _deviceAddress;

        // Pay registration reward if contract still has balance
        if(registrationReward > 0 && address(this).balance >= registrationReward){
            deviceBalance[_deviceAddress] += registrationReward; 
            emit RegistrationRewardPaid(_deviceAddress, registrationReward);
        }

        emit DeviceRegistered(_deviceAddress, _deviceOwner, _deviceType, _publicKey, _fee);
    }

    function updateDeviceInfo(
        address _deviceAddress,
        string calldata _newDeviceType,
        uint256 _newFee
    ) external onlyDeviceOwner(_deviceAddress){
        
        require(bytes(_newDeviceType).length > 0 && bytes(_newDeviceType).length <= 64, "Invalid device type length");
        require(_newFee > 0, "Fee must be greater than 0");
        
        Device storage device = devices[_deviceAddress];

        // Update new device information
        device.deviceType = _newDeviceType;
        device.lastSeen = block.timestamp;
        device.fee = _newFee;

        emit DeviceInfoUpdated(_deviceAddress, _newDeviceType, _newFee);
    }

    function updateDeviceStatus(address _deviceAddress, bool _newStatus)
        external
        onlyAdminOrDeviceOwner(_deviceAddress)
    {
        Device storage device = devices[_deviceAddress];
        require(device.isActive != _newStatus, "No status change");

        device.isActive = _newStatus;
        device.lastSeen = block.timestamp;

        emit DeviceStatusUpdated(_deviceAddress, _newStatus);
    }

    function removeDevice(address _deviceAddress) external onlyAdminOrDeviceOwner(_deviceAddress){

        require(devices[_deviceAddress].deviceOwner != address(0), "Device is not registered");
        require(deviceActiveSession[_deviceAddress] == bytes32(0), "Unable to remove device with active session");

        address deviceOwner = devices[_deviceAddress].deviceOwner;

        delete publicKeyToDevice[devices[_deviceAddress].publicKey];    // Remove public key mapping to device
        delete devices[_deviceAddress];                                 // Remove device

        // Remove device from deviceAddresses array
        // Check if deviceIndex is empty
        uint256 indexPlusOne = deviceIndex[_deviceAddress];
        require(indexPlusOne != 0, "Device index missing");

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = deviceAddresses.length - 1;

        // Check if the device is the only one in the array
        if(index != lastIndex){
            // Switch the index of device to be removed with the last device in the array
            address lastDevice = deviceAddresses[lastIndex];
            deviceAddresses[index] = lastDevice;
            deviceIndex[lastDevice] = index + 1;
        }

        //Remove the device
        deviceAddresses.pop();
        delete deviceIndex[_deviceAddress];

        // Remove from ownerDevices mapping
        // Check if ownerDevices is empty
        uint256 ownerIndexPlusOne = ownerDeviceIndex[deviceOwner][_deviceAddress];
        require(ownerIndexPlusOne != 0, "Onwer index missing");

        uint256 ownerIndex = ownerIndexPlusOne - 1;
        uint256 ownerLastIndex = ownerDevices[deviceOwner].length - 1;

        // Check if the device is the only device the owner own
        if(ownerIndex != ownerLastIndex){
            address lastOwned = ownerDevices[deviceOwner][ownerLastIndex];
            ownerDevices[deviceOwner][ownerIndex] = lastOwned;
            ownerDeviceIndex[deviceOwner][lastOwned] = ownerIndex + 1;
        }

        //Remove the device
        ownerDevices[deviceOwner].pop();
        delete ownerDeviceIndex[deviceOwner][_deviceAddress];

        emit DeviceRemoved(_deviceAddress);
    }

    function heartbeat(address _deviceAddress) external onlyAdminOrDeviceOwner(_deviceAddress){

        devices[_deviceAddress].lastSeen = block.timestamp;

        emit DeviceHeartbeat(_deviceAddress, block.timestamp);
    }

    // ========== View Functions (Device) ==========

    /**
     * @dev Get Device Information by it's address
     */
    function getDevice(address _deviceAddress)
        external
        view
        returns(
            address deviceOwner,
            bool isActive,
            string memory deviceType,
            uint256 lastSeen,
            bytes32 publicKey,
            uint256 fee
        )
    {
        Device storage device = devices[_deviceAddress];
        require(device.deviceOwner != address(0), "Device is not registered");

        return(
            device.deviceOwner,
            device.isActive,
            device.deviceType,
            device.lastSeen,
            device.publicKey,
            device.fee
        );
    }

    /**
     * @dev Get all devices (prototype ver)
     * Will have to improve later when more devices join, more device = higher gas fee
     */
    function getAllDevices() external view returns(address [] memory){
        return deviceAddresses;
    }

    /**
     * @dev Get Devices owned by specific device owner's address
     */
    function getDevicesByOwner(address _deviceOwner) external view returns(address[] memory){
        return ownerDevices[_deviceOwner];
    }

    /**
     * @dev Get number of devices owned by specific device owner via their address
     */
    function getOwnerDeviceCount(address _deviceOwner) external view returns(uint256){
        return ownerDevices[_deviceOwner].length;
    }

    /**
     * @dev Get Devices by their public key
     */
    function getDeviceByPublicKey(bytes32 _publicKey) external view returns (address){
        return publicKeyToDevice[_publicKey];
    }


    // ========== Session Management ==========
    /**
     * @dev Start a session on device
     */
    function startSession(address _deviceAddress) external payable nonReentrant returns (bytes32 sessionId){
        
        Device storage device = devices[_deviceAddress];

        require(device.deviceOwner != address(0), "Device is not registered");
        require(device.isActive, "Device is not active");
        require(deviceActiveSession[_deviceAddress] == bytes32(0), "Device already in use");
        require(msg.value == device.fee, "Incorrect fee submitted");

        // Refund excess payment
        uint256 excess = msg.value - device.fee;
        if (excess > 0){
            (bool refundSuccess, ) = payable(msg.sender).call{value:excess}("");
            require(refundSuccess, "Refund failed");
        }

        // Generate unique sessionId
        sessionId = keccak256(abi.encodePacked(msg.sender, _deviceAddress, block.timestamp, sessionNonce));
        sessionNonce++;

        // Create session
        sessions[sessionId] = Session({
            user: msg.sender,
            deviceAddress: _deviceAddress,
            startTime: block.timestamp,
            endTime: 0,
            fee: device.fee,
            active: true
        });

        deviceActiveSession[_deviceAddress] = sessionId;

        emit SessionStarted(sessionId, msg.sender, _deviceAddress, block.timestamp, msg.value);
    }

    /**
     * @dev End a session on a device
     */
    function endSession(bytes32 _sessionId) external nonReentrant{
        
        Session storage session = sessions[_sessionId];

        require(session.active, "Session not active");
        require(msg.sender == session.user || msg.sender == devices[session.deviceAddress].deviceOwner, "Not authorized to end session");

        session.endTime = block.timestamp;
        session.active = false;

        // credit earnings to device
        deviceBalance[session.deviceAddress] += session.fee;
        deviceActiveSession[session.deviceAddress] = bytes32(0);

        emit SessionEnded(_sessionId, session.user, session.deviceAddress, session.endTime, session.fee);
    }

    /**
     * @dev Withdraw earnings from an owned device
     */
    function withdraw(address _deviceAddress) external onlyDeviceOwner(_deviceAddress) nonReentrant{

        uint256 amount=deviceBalance[_deviceAddress];
        require(amount > 0, "No earnings");

        deviceBalance[_deviceAddress] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdraw failed");

        emit Withdraw(msg.sender, _deviceAddress, amount);
    }

    /**
     * @dev Withdraw earnings from all owned device
     */
    function withdrawAll() external nonReentrant{
        address[] storage ownedDevices = ownerDevices[msg.sender];
        uint256 total = 0;

        for (uint256 i = 0; i < ownedDevices.length; i++){
            address deviceAddress = ownedDevices[i];
            uint256 amount = deviceBalance[deviceAddress];

            if (amount > 0){
                total += amount;
                deviceBalance[deviceAddress] = 0;
            }
        }

        require (total > 0, "No earnings to withdraw");
        (bool success, ) = payable(msg.sender).call{value: total}("");
        require(success, "Withdraw All failed");

        emit WithdrawAll(msg.sender, total);
    }

    // ========== View Functions (Session & Usage) ==========
    /**
     * @dev Get the session information using sessionId
     */
    function getSession(bytes32 _sessionId)external view returns(
        address user,
        address deviceAddress,
        uint256 startTime,
        uint256 endTime,
        uint256 fee,
        bool active
    ){
        Session storage session = sessions[_sessionId];
        return (session.user, session.deviceAddress, session.startTime, session.endTime, session.fee, session.active);
    }

    /**
     * @dev Get the list of devices with active session
     */
    function getActiveSession(address _deviceAddress) external view returns(bytes32){
        return deviceActiveSession[_deviceAddress];
    }

    /**
     * @dev Get balance the device is holding
     */
    function getDeviceBalance(address _deviceAddress) external view returns(uint256){
        return deviceBalance[_deviceAddress];
    }

    /**
     * @dev Return total owner earnings from all devices they own
     */
    function getOwnerBalance(address _ownerAddress) external view returns(uint256 total){
        address[] storage ownedDevices = ownerDevices[_ownerAddress];

        for(uint256 i=0; i < ownedDevices.length; i++){
            total += deviceBalance[ownedDevices[i]];
        }
    }

}