const fs = require("fs");
const path = require("path");

const contractName = "Lock"; // change this

// Path to Hardhat’s artifact
const artifactPath = path.join(
  __dirname,
  `../artifacts/contracts/${contractName}.sol/${contractName}.json`
);

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

// Write only the ABI to frontend folder
const abiPath = path.join(__dirname, `../frontend/abi/${contractName}.json`);
fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));

console.log(`ABI extracted to ${abiPath}`);
