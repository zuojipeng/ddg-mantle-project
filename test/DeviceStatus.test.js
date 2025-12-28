const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeviceStatus Contract", function () {
  let deviceStatus;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const DeviceStatus = await ethers.getContractFactory("DeviceStatus");
    deviceStatus = await DeviceStatus.deploy();
    await deviceStatus.deployed();
  });

  describe("Device Registration", function () {
    it("Should register a new device", async function () {
      await deviceStatus.registerDevice("device-001", "Server Alpha", "Server");
      const device = await deviceStatus.getDevice("device-001");

      expect(device.deviceId).to.equal("device-001");
      expect(device.deviceName).to.equal("Server Alpha");
      expect(device.owner).to.equal(owner.address);
    });

    it("Should not allow duplicate device registration", async function () {
      await deviceStatus.registerDevice("device-001", "Server Alpha", "Server");
      await expect(
        deviceStatus.registerDevice("device-001", "Server Beta", "Server")
      ).to.be.revertedWith("Device already registered");
    });
  });

  describe("Device Status Updates", function () {
    beforeEach(async function () {
      await deviceStatus.registerDevice("device-001", "Server Alpha", "Server");
    });

    it("Should update device status", async function () {
      await deviceStatus.updateDeviceStatus("device-001", true, 6500, 7500, 8000);
      const device = await deviceStatus.getDevice("device-001");

      expect(device.isOnline).to.equal(true);
      expect(device.temperature).to.equal(6500);
      expect(device.cpuUsage).to.equal(7500);
    });

    it("Should only allow owner to update status", async function () {
      await expect(
        deviceStatus.connect(addr1).updateDeviceStatus("device-001", true, 6500, 7500, 8000)
      ).to.be.revertedWith("Only device owner or admin");
    });
  });

  describe("Permissions", function () {
    beforeEach(async function () {
      await deviceStatus.registerDevice("device-001", "Server Alpha", "Server");
    });

    it("Should grant and revoke permissions", async function () {
      await deviceStatus.grantPermission("device-001", addr1.address);
      expect(await deviceStatus.checkPermission("device-001", addr1.address)).to.be.true;

      await deviceStatus.revokePermission("device-001", addr1.address);
      expect(await deviceStatus.checkPermission("device-001", addr1.address)).to.be.false;
    });
  });
});



