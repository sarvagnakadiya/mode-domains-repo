const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  try {
    // Load the contract addresses from the JSON file
    const contractAddressesJSON = fs.readFileSync("contractAddresses.json");
    const contractAddresses = JSON.parse(contractAddressesJSON);

    // Extract the V1 contract address
    const v2ContractAddress = contractAddresses.NAME_REGISTRY_V2_ADDRESS; // Use the correct key from your JSON file

    // Connect to the V1 contract using its address
    const v1Contract = await ethers.getContractAt(
      "NameRegistryV2",
      v2ContractAddress
    );

    // Connect to the Ethereum wallet using the private key
    const wallet = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ethers.provider
    );

    const registrationPrice = await v1Contract.getRegistrationPrice(
      "testName1"
    );
    console.log(
      `Registration price for ${"testName1"}: ${registrationPrice.toString()} wei`
    );

    // Set up transaction overrides (e.g., value for registration)
    const overrides = {
      value: registrationPrice, // Set to the calculated registration price
    };

    // Connect the wallet to the V1 contract
    const connectedContract = v1Contract.connect(wallet);

    // Call the `registerName` function using the wallet
    const tx = await connectedContract.registerName(
      "testName1",
      "dummymetadataURI",
      overrides
    );
    await tx.wait();

    console.log(`Registered `);
  } catch (error) {
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
