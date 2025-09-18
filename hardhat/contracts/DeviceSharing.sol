// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DeviceSharing is Ownable, ReentrancyGuard {
    enum Duration {
        DAY,
        WEEK,
        MONTH
    }
    enum SubscriptionStatus {
        Active,
        Expired
    }

    struct Device {
        uint256 id;
        bytes32 deviceId;
        address deviceOwner;
        bool isActive;
        uint256 feePerDay;
    }

    struct Subscription {
        uint256 id;
        address subscriber;
        bytes32 deviceId;
        uint256 startTime;
        uint256 endTime;
        uint256 feePaid;
        Duration durationType;
        SubscriptionStatus status;
    }

    mapping(uint256 => Device) public devices;
    mapping(bytes32 => uint256) public deviceIdToHash; // To map id to device_id ensuring no duplicates

    mapping(uint256 => Subscription) public subscriptions;
    mapping(bytes32 => uint256[]) public deviceSubscriptions;

    uint256 public nextDeviceId = 1;
    uint256 public nextSubscriptionId = 1;
    uint256 public registrationReward;

    // ========== Events ==========
    event DeviceRegistered(
        uint256 indexed id,
        bytes32 indexed deviceId,
        address indexed deviceOwner,
        uint256 feePerDay
    );

    event RegistrationRewardPaid(
        uint256 indexed id,
        uint256 registrationReward,
        address deviceOwner
    );

    event RegistrationRewardFailed(
        uint256 indexed id,
        uint256 registrationReward,
        address deviceOwner
    );

    event DeviceUpdated(
        uint256 indexed id,
        uint256 feePerDay,
        address indexed owner
    );

    event DeviceStatusChanged(
        uint256 indexed id,
        bool isActive,
        address indexed owner
    );

    event DeviceRemoved(uint256 indexed id, address indexed owner);

    event SubscriptionCreated(
        uint256 indexed id,
        address indexed subscriber,
        bytes32 indexed deviceId,
        uint256 startTime,
        uint256 endTime,
        uint256 feePaid,
        Duration durationType,
        SubscriptionStatus status
    );

    event FeePaid(
        address indexed subscriber,
        address deviceOwner,
        uint256 totalFee
    );

    event SubscriptionExpired(
        uint256 indexed subscriptionId,
        address indexed subscriber
    );

    // ========== Constructor ==========

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ========== Contract Owner actions ==========

    function setRegistrationReward(uint256 _reward) external onlyOwner {
        registrationReward = _reward;
    }

    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "Must send tokens to fund");
    }

    receive() external payable {} // Accept other currency transfers

    // ========== Modifier ==========

    modifier onlyDeviceOwner(string memory device_id) {
        require(bytes(device_id).length > 0, "Device ID cannot be empty");

        bytes32 hashedId = keccak256(abi.encodePacked(device_id));
        uint256 id = deviceIdToHash[hashedId];

        require(devices[id].deviceId == hashedId, "Device not found");
        require(devices[id].deviceOwner == msg.sender, "Not device owner");
        _;
    }

    // ========== Device Functions ==========

    function registerDevice(
        string memory device_id,
        uint256 feePerDay
    ) external {
        require(bytes(device_id).length > 0, "Device ID cannot be empty");
        require(feePerDay > 0, "Fee must be greater than 0");

        bytes32 hashedId = keccak256(abi.encodePacked(device_id));

        require(deviceIdToHash[hashedId] == 0, "This device already exist");

        uint256 id = nextDeviceId++;

        devices[id] = Device({
            id: id,
            deviceId: hashedId,
            deviceOwner: msg.sender,
            isActive: true,
            feePerDay: feePerDay
        });

        deviceIdToHash[hashedId] = id;

        emit DeviceRegistered(id, hashedId, msg.sender, feePerDay);

        // Registration reward
        if (
            registrationReward > 0 &&
            address(this).balance >= registrationReward
        ) {
            (bool success, ) = payable(msg.sender).call{
                value: registrationReward
            }("");

            if (success) {
                emit RegistrationRewardPaid(id, registrationReward, msg.sender);
            } else {
                emit RegistrationRewardFailed(
                    id,
                    registrationReward,
                    msg.sender
                );
            }
        }
    }

    function updateDevice(
        string memory device_id,
        uint256 newFee
    ) external onlyDeviceOwner(device_id) {
        require(newFee > 0, "Fee cannot be 0 or less");

        bytes32 hashedId = keccak256(abi.encodePacked(device_id));
        uint256 id = deviceIdToHash[hashedId];

        devices[id].feePerDay = newFee;

        emit DeviceUpdated(id, newFee, msg.sender);
    }

    function changeDeviceStatus(
        string memory device_id,
        bool newStatus
    ) external onlyDeviceOwner(device_id) {
        bytes32 hashedId = keccak256(abi.encodePacked(device_id));
        uint256 id = deviceIdToHash[hashedId];

        require(devices[id].isActive != newStatus, "No change in status");

        devices[id].isActive = newStatus;

        emit DeviceStatusChanged(id, newStatus, msg.sender);
    }

    function removeDevice(
        string memory device_id
    ) external onlyDeviceOwner(device_id) {
        bytes32 hashedId = keccak256(abi.encodePacked(device_id));
        uint256 id = deviceIdToHash[hashedId];

        uint256[] memory subs = deviceSubscriptions[hashedId];
        for (uint256 i = 0; i < subs.length; i++) {
            if (subscriptions[subs[i]].status == SubscriptionStatus.Active) {
                revert("Cannot remove device with active subscriptions");
            }
        }

        delete devices[id];
        delete deviceIdToHash[hashedId];
        delete deviceSubscriptions[hashedId];

        emit DeviceRemoved(id, msg.sender);
    }

    function getDeviceByStringID(
        string memory device_id
    )
        external
        view
        returns (
            uint256 id,
            bytes32 deviceId,
            address deviceOwner,
            bool isActive,
            uint256 feePerDay
        )
    {
        require(bytes(device_id).length > 0, "Device ID cannot be empty");

        bytes32 hashedId = keccak256(abi.encodePacked(device_id));
        uint256 device_identity = deviceIdToHash[hashedId];

        Device memory device = devices[device_identity];

        require(device.deviceId == hashedId, "Device not found");

        return (
            device.id,
            hashedId,
            device.deviceOwner,
            device.isActive,
            device.feePerDay
        );
    }

    // ========== Subscription functions ==========

    function subscribe(
        string memory device_id,
        Duration duration
    ) external payable nonReentrant {
        require(bytes(device_id).length > 0, "Device ID cannot be empty");

        bytes32 hashedId = keccak256(abi.encodePacked(device_id));
        uint256 id = deviceIdToHash[hashedId];

        Device memory device = devices[id];

        require(device.deviceId == hashedId, "Device not found");
        require(device.isActive, "Device is not active");

        uint256 durationInDays;
        if (duration == Duration.DAY) {
            durationInDays = 1;
        } else if (duration == Duration.WEEK) {
            durationInDays = 7;
        } else if (duration == Duration.MONTH) {
            durationInDays = 30;
        } else {
            revert("Invalid duration");
        }

        uint256 totalFee = device.feePerDay * durationInDays;

        require(msg.value >= totalFee, "Insufficient payment");

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (durationInDays * 1 days);

        uint256 subscriptionId = nextSubscriptionId++;

        subscriptions[subscriptionId] = Subscription({
            id: subscriptionId,
            subscriber: msg.sender,
            deviceId: hashedId,
            startTime: startTime,
            endTime: endTime,
            feePaid: totalFee,
            durationType: duration,
            status: SubscriptionStatus.Active
        });

        deviceSubscriptions[hashedId].push(subscriptionId);

        (bool sent, ) = payable(device.deviceOwner).call{value: totalFee}("");

        require(sent, "failed to send fee to device owner");

        emit FeePaid(msg.sender, device.deviceOwner, totalFee);

        // Refund excess payment
        if (msg.value > totalFee) {
            (bool refundSent, ) = payable(msg.sender).call{
                value: msg.value - totalFee
            }("");
            require(refundSent, "Failed to refund excess payment");
        }

        emit SubscriptionCreated(
            subscriptionId,
            msg.sender,
            hashedId,
            startTime,
            endTime,
            totalFee,
            duration,
            SubscriptionStatus.Active
        );
    }

    function expireSubscription(uint256 subscriptionId) external {
        Subscription storage sub = subscriptions[subscriptionId];

        require(
            sub.status == SubscriptionStatus.Active,
            "Subscription is not active"
        );
        // require(
        //     block.timestamp > sub.endTime,
        //     "Subscription period not ended yet"
        // );

        bytes32 device_id = sub.deviceId;

        sub.status = SubscriptionStatus.Expired;

        emit SubscriptionExpired(subscriptionId, sub.subscriber);

        delete subscriptions[subscriptionId];

        uint256[] storage subs = deviceSubscriptions[device_id];
        for (uint256 i = 0; i < subs.length; i++) {
            if (subs[i] == subscriptionId) {
                subs[i] = subs[subs.length - 1]; // move last element into slot
                subs.pop(); // remove last
                break;
            }
        }
        
    }

    function isSubscriptionActive(
        uint256 subscriptionId
    ) external view returns (bool) {
        Subscription memory sub = subscriptions[subscriptionId];

        return (sub.status == SubscriptionStatus.Active &&
            block.timestamp < sub.endTime);
    }

    function getSubscriptionById(
        uint256 subscriptionId
    )
        external
        view
        returns (
            uint256 id,
            address subscriber,
            bytes32 deviceId,
            uint256 startTime,
            uint256 endTime,
            uint256 feePaid,
            Duration durationType,
            SubscriptionStatus status
        )
    {
        Subscription memory sub = subscriptions[subscriptionId];

        return (
            sub.id,
            sub.subscriber,
            sub.deviceId,
            sub.startTime,
            sub.endTime,
            sub.feePaid,
            sub.durationType,
            sub.status
        );
    }
}
