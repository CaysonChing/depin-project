// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DeviceRegistry is Ownable {

    /**
     * @dev The Device struct holds all relevant data for a registered device.
     * 'owner': The Ethereum address of the device owner.
     * 'isActive': A flag to check if a device is currently active in the network.
     * 'deviceType': A human-readable identifier for the device category (eg. "router", "sensor").
     * 'lastSeen': A timestamp of the last time the device checked in.
     * 'publicKey': The public key for off-chain message signing or identification.
     * 'fee': Amount to charge user whenever they want to use the device. This fee is set by device owner.
     */
    struct Device {
        address deviceOwner;
        bool isActive;
        string deviceType;
        uint256 lastSeen;
        string publicKey;
        uint256 fee;
    }

    mapping(address => Device) public devices;      // Mapping to store device data, indexed by device's unique address


    event DeviceRegistered(address indexed deviceAddress, address indexed owner, string deviceType, uint256 fee);    // Event to log when a new device is successfully registered
    event DeviceInfoUpdated(address indexed deviceAddress, string newDeviceType, string newPublicKey, uint256 fee);  // An event to log when a device information is updated
    event DeviceStatusUpdated(address indexed deviceAddress, bool newStatus);   // An event to log when a device's status is updated
    event DeviceRemoved(address indexed deviceAddress);  // An event to log when a device is removed
    event DeviceHeartbeat(address indexed deviceAddress, uint256 timestamp); // An event to log when a device sends a heartbeat signal
    
    /**
     * @dev The constructor sets the inital owner of the contract.
     * @param initialOwner The address that will be the first owner of the contract.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

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

    /**
     * @dev Registers a new device in the registry.
     * This function can be called by any user
     * @param _deviceAddress the address of the device to register.
     * @param _deviceOwner The address of the device owner.
     * @param _deviceType A human-readable identifier for the device category (eg. "router", "sensor").
     * @param _publicKey The public key associated with the device.
     */
    function registerDevice(
        address _deviceAddress,
        address _deviceOwner,
        string calldata _deviceType,
        string calldata _publicKey,
        uint256 _fee
    ) external {
        require(_deviceAddress != address(0) && _deviceOwner != address(0), "Zero address");    // Ensure valid addresses
        require(msg.sender == _deviceOwner, "You can only register devices for yourself");     // Ensure the registrar is the device owner
        require(devices[_deviceAddress].deviceOwner == address(0), "Device is already registered");   // Ensure the device is not already registered
        require(_fee > 0, "Fee must be greater than 0");

        // Store new device information
        devices[_deviceAddress] = Device({
            deviceOwner: _deviceOwner,
            isActive: true,
            deviceType: _deviceType,
            lastSeen: block.timestamp,
            publicKey: _publicKey,
            fee: _fee
        });

        // Emit an event to log the registration
        emit DeviceRegistered(_deviceAddress, _deviceOwner, _deviceType, _fee);
    }

    /**
     * @dev Updates a device's information
     * This function is restricted to device owners 
     * @param _deviceAddress The address of device to update
     * @param _newDeviceType The new type of device
     * @param _newPublicKey  New public key of the device
     */
    function updateDeviceInfo(
        address _deviceAddress,
        string calldata _newDeviceType,
        string calldata _newPublicKey,
        uint256 _newFee
    ) external onlyDeviceOwner(_deviceAddress) {
        
        Device storage d = devices[_deviceAddress]; // Fetch the device details
        d.deviceType = _newDeviceType;  // Update the device type
        d.publicKey = _newPublicKey;    // Update the public key of the device
        d.lastSeen = block.timestamp;   // Update the last seen timestamp
        d.fee = _newFee;
        
        // Emit an event to log the update 
        emit DeviceInfoUpdated(_deviceAddress, _newDeviceType, _newPublicKey, _newFee);
    }

    /**
     * @dev Updates a device's status (eg. active to inactive)
     * This function is restricted to contract and device owner to prevent malicious actors from disabling a device.
     * @param _deviceAddress The address of the device to update.
     * @param _newStatus The new status to set (true for active, false for inactive).
     */
    function updateDeviceStatus(
        address _deviceAddress,
        bool _newStatus
    ) external onlyAdminOrDeviceOwner(_deviceAddress) {

        Device storage d = devices[_deviceAddress]; // Fetch the device details

        require(d.isActive != _newStatus, "No status change");  // Ensure there is a status change
        d.isActive = _newStatus;    // Update the device status
        d.lastSeen = block.timestamp;   // Update the last seen timestamp

        // Emit an event to log the status update
        emit DeviceStatusUpdated(_deviceAddress, _newStatus);
    }

    /**
     * @dev Records a heartbeat signal from a device to update its last seen timestamp.
     * @param _deviceAddress The address of the device sending the heartbeat.
     * This function can be called by the device owner or contract owner to update the last seen
     */
    function heartbeat(address _deviceAddress) external onlyAdminOrDeviceOwner(_deviceAddress) {
        
        devices[_deviceAddress].lastSeen = block.timestamp; // Update the last seen timestamp   

        // Emit an event to log the heartbeat
        emit DeviceHeartbeat(_deviceAddress, block.timestamp);  
    }

    /**
     * @dev Delete a device that is out of service or causing issue
     * This function is restricted to contract owner and device owner
     * @param _deviceAddress The address of the device to be deleted
     */
    function removeDevice(address _deviceAddress) external onlyAdminOrDeviceOwner(_deviceAddress){
        require(devices[_deviceAddress].deviceOwner != address(0), "Device is not registered"); // Ensure that the device is registered

        delete devices[_deviceAddress]; // Deletes the device

        // Emit event to log the deletion
        emit DeviceRemoved(_deviceAddress); 
    }

    /**
     * @dev Checks if a device is registered in the registry.
     * @param _deviceAddress The address of the device to check.
     * @return A boolean indicating if the device is registered.
     */
    function isRegistered(address _deviceAddress) external view returns (bool) {
        return devices[_deviceAddress].deviceOwner != address(0);
    }

    /**
    //  * @dev Gets a device's status
    //  * @param _deviceAddress The address of the device to query.
    //  * @return A booleaan indicating if the device is active.
    //  */
    function isDeviceActive(address _deviceAddress) external view returns (bool) {
        return devices[_deviceAddress].isActive;
    }

    // /**
    //  * @dev Gets the owner of a device
    //  * @param _deviceAddress The address to query
    //  * @return The address of the device's owner
    //  */
    function getDeviceOwner(address _deviceAddress) external view returns (address) {
        return devices[_deviceAddress].deviceOwner;
    }

    function getDeviceFee(address _deviceAddress) external view returns(uint256){
        return devices[_deviceAddress].fee;
    }

    /**
     * @dev Gets the information of the device
     * @param _deviceAddress The address of the device
     * return the device object matching the address
     */
    function getDeviceInformation(address _deviceAddress) external view 
    returns (
        address deviceOwner,
        bool isActive,
        string memory deviceType,
        uint256 lastSeen,
        string memory publicKey,
        uint256 fee
    ) 
    {
        Device storage d = devices[_deviceAddress];
        return (
            d.deviceOwner,
            d.isActive,
            d.deviceType,
            d.lastSeen,
            d.publicKey,
            d.fee
        );
    }

}
