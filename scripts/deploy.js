const fs = require("fs"); // Import the fs module to read/write JSON files
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying contract with address: ${deployer.address}`);

  // Deploy the NameRegistryV2 contract
  const NameRegistryV2 = await ethers.getContractFactory("NameRegistryV2");
  const nameRegistryV2 = await NameRegistryV2.deploy("ModeDomains", "MD");
  await nameRegistryV2.deployed();

  console.log(`NameRegistryV2 deployed to: ${nameRegistryV2.address}`);
  console.log(`NameRegistryV2 deployed to: ${nameRegistryV2.target}`);

  // // Deploy the NameRegistry contract (V1)
  // const NameRegistry = await ethers.getContractFactory("NameRegistry");
  // const nameRegistryV1 = await NameRegistry.deploy("NameRegistry", "NRV1");

  // await nameRegistryV1.deployed();

  // console.log(`NameRegistryV1 deployed to: ${nameRegistryV1.address}`);

  // Read the existing JSON file
  let contractAddresses = {};
  try {
    const jsonString = fs.readFileSync("contractAddresses.json");
    contractAddresses = JSON.parse(jsonString);
  } catch (error) {
    console.error("Error reading contractAddresses.json:", error);
  }

  // Update the contract addresses in the JSON object
  contractAddresses.NAME_REGISTRY_V2_ADDRESS = nameRegistryV2.address;
  // contractAddresses.NAME_REGISTRY_V1_ADDRESS = nameRegistryV1.address;

  // Write the updated JSON object back to the file
  try {
    fs.writeFileSync(
      "contractAddresses.json",
      JSON.stringify(contractAddresses, null, 2)
    );
    console.log("Contract addresses updated in contractAddresses.json.");
  } catch (error) {
    console.error("Error writing contractAddresses.json:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
