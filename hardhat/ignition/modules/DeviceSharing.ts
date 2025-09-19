// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeviceSharing = buildModule("DeviceSharingModule", (m) => {
  const initialOwner = m.getParameter("initialOwner", m.getAccount(0));
  const callSetReward = m.getParameter("callSetReward", false);
  const registrationReward = m.getParameter("registrationReward", "0");

  const deviceSharing = m.contract("DeviceSharing", [initialOwner]);

  return { deviceSharing };
});

export default DeviceSharing;
