const { ethers } = require("hardhat");

async function main() {
  // Get the contract address and the owner's address
  const contractAddress = "0x9B4aC8FAfC44575C6963fA22D50963379e899a49"; // Replace with the actual contract address

  // Connect to the contract
  const contract = await ethers.getContractAt(
    "NameRegistryV2",
    contractAddress
  );

  // Call getNameDetails for DummyName1
  const nameDetails = await contract.getNameDetails("DummyName10");

  // Log the result
  console.log("Name Details:", nameDetails);

  // You can access specific details like name owner using nameDetails[0]

  // You can add more logging or processing based on the returned data
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });