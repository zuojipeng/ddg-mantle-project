// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DeviceStatus
 * @dev 去中心化设备状态管理合约
 */
contract DeviceStatus {
    
    // 设备状态结构体
    struct Device {
        string deviceId;           // 设备唯一ID
        string deviceName;         // 设备名称
        string deviceType;         // 设备类型
        bool isOnline;             // 在线状态
        uint256 temperature;       // 温度 (摄氏度 * 100，避免浮点数)
        uint256 cpuUsage;          // CPU使用率 (百分比 * 100)
        uint256 memoryUsage;       // 内存使用率 (百分比 * 100)
        uint256 lastUpdateTime;    // 最后更新时间
        bool isAbnormal;           // 异常标记
        string abnormalReason;     // 异常原因
        address owner;             // 设备所有者
        bool exists;               // 设备是否存在
    }
    
    // 设备数据历史记录
    struct DeviceHistory {
        uint256 timestamp;
        uint256 temperature;
        uint256 cpuUsage;
        uint256 memoryUsage;
        bool isAbnormal;
    }
    
    // 存储：设备ID => 设备信息
    mapping(string => Device) public devices;
    
    // 存储：设备ID => 历史记录数组
    mapping(string => DeviceHistory[]) public deviceHistory;
    
    // 设备ID列表
    string[] public deviceIds;
    
    // 权限管理：设备ID => (地址 => 是否有权限)
    mapping(string => mapping(address => bool)) public devicePermissions;
    
    // 超级管理员
    address public admin;
    
    // 事件
    event DeviceRegistered(string deviceId, string deviceName, address owner);
    event DeviceStatusUpdated(string deviceId, bool isOnline, uint256 timestamp);
    event DeviceAbnormalDetected(string deviceId, string reason, uint256 timestamp);
    event PermissionGranted(string deviceId, address user);
    event PermissionRevoked(string deviceId, address user);
    
    // 修饰器
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyDeviceOwner(string memory deviceId) {
        require(
            devices[deviceId].owner == msg.sender || msg.sender == admin,
            "Only device owner or admin"
        );
        _;
    }
    
    modifier deviceExists(string memory deviceId) {
        require(devices[deviceId].exists, "Device does not exist");
        _;
    }
    
    modifier hasPermission(string memory deviceId) {
        require(
            devices[deviceId].owner == msg.sender || 
            devicePermissions[deviceId][msg.sender] || 
            msg.sender == admin,
            "No permission to access this device"
        );
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev 注册新设备
     */
    function registerDevice(
        string memory deviceId,
        string memory deviceName,
        string memory deviceType
    ) external {
        require(!devices[deviceId].exists, "Device already registered");
        require(bytes(deviceId).length > 0, "Device ID cannot be empty");
        
        devices[deviceId] = Device({
            deviceId: deviceId,
            deviceName: deviceName,
            deviceType: deviceType,
            isOnline: false,
            temperature: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            lastUpdateTime: block.timestamp,
            isAbnormal: false,
            abnormalReason: "",
            owner: msg.sender,
            exists: true
        });
        
        deviceIds.push(deviceId);
        
        emit DeviceRegistered(deviceId, deviceName, msg.sender);
    }
    
    /**
     * @dev 更新设备状态
     */
    function updateDeviceStatus(
        string memory deviceId,
        bool isOnline,
        uint256 temperature,
        uint256 cpuUsage,
        uint256 memoryUsage
    ) external deviceExists(deviceId) onlyDeviceOwner(deviceId) {
        Device storage device = devices[deviceId];
        
        device.isOnline = isOnline;
        device.temperature = temperature;
        device.cpuUsage = cpuUsage;
        device.memoryUsage = memoryUsage;
        device.lastUpdateTime = block.timestamp;
        
        // 保存历史记录
        deviceHistory[deviceId].push(DeviceHistory({
            timestamp: block.timestamp,
            temperature: temperature,
            cpuUsage: cpuUsage,
            memoryUsage: memoryUsage,
            isAbnormal: device.isAbnormal
        }));
        
        emit DeviceStatusUpdated(deviceId, isOnline, block.timestamp);
    }
    
    /**
     * @dev 标记设备异常
     */
    function markDeviceAbnormal(
        string memory deviceId,
        bool isAbnormal,
        string memory reason
    ) external deviceExists(deviceId) onlyDeviceOwner(deviceId) {
        devices[deviceId].isAbnormal = isAbnormal;
        devices[deviceId].abnormalReason = reason;
        
        if (isAbnormal) {
            emit DeviceAbnormalDetected(deviceId, reason, block.timestamp);
        }
    }
    
    /**
     * @dev 授予设备访问权限
     */
    function grantPermission(string memory deviceId, address user) 
        external 
        deviceExists(deviceId) 
        onlyDeviceOwner(deviceId) 
    {
        devicePermissions[deviceId][user] = true;
        emit PermissionGranted(deviceId, user);
    }
    
    /**
     * @dev 撤销设备访问权限
     */
    function revokePermission(string memory deviceId, address user) 
        external 
        deviceExists(deviceId) 
        onlyDeviceOwner(deviceId) 
    {
        devicePermissions[deviceId][user] = false;
        emit PermissionRevoked(deviceId, user);
    }
    
    /**
     * @dev 获取设备信息
     */
    function getDevice(string memory deviceId) 
        external 
        view 
        deviceExists(deviceId) 
        hasPermission(deviceId)
        returns (Device memory) 
    {
        return devices[deviceId];
    }
    
    /**
     * @dev 获取设备历史记录
     */
    function getDeviceHistory(string memory deviceId, uint256 limit) 
        external 
        view 
        deviceExists(deviceId) 
        hasPermission(deviceId)
        returns (DeviceHistory[] memory) 
    {
        DeviceHistory[] storage history = deviceHistory[deviceId];
        uint256 length = history.length;
        
        if (length == 0) {
            return new DeviceHistory[](0);
        }
        
        uint256 returnLength = limit > length ? length : limit;
        DeviceHistory[] memory result = new DeviceHistory[](returnLength);
        
        // 返回最新的记录
        for (uint256 i = 0; i < returnLength; i++) {
            result[i] = history[length - returnLength + i];
        }
        
        return result;
    }
    
    /**
     * @dev 获取所有设备ID
     */
    function getAllDeviceIds() external view returns (string[] memory) {
        return deviceIds;
    }
    
    /**
     * @dev 获取设备总数
     */
    function getDeviceCount() external view returns (uint256) {
        return deviceIds.length;
    }
    
    /**
     * @dev 检查用户是否有设备访问权限
     */
    function checkPermission(string memory deviceId, address user) 
        external 
        view 
        returns (bool) 
    {
        return devices[deviceId].owner == user || 
               devicePermissions[deviceId][user] || 
               user == admin;
    }
}



