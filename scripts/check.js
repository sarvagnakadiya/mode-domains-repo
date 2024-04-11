const { ethers } = require("hardhat");

async function main() {
  // Get the contract address and the owner's address
  const contractAddress = "0xe443984d14cf05742AD943A1f62fa4Bf177Fb3d9"; // Replace with the actual contract address

  // Connect to the contract
  const contract = await ethers.getContractAt(
    "NameRegistryV2",
    contractAddress
  );

  // const getPrice = await contract.getRegistrationPrice("luxar");
  // console.log(getPrice);
  // // Call getNameDetails for DummyName1
  // const nameDetails = await contract.registerName(
  //   "luxar",
  //   "https://ipfs.io/ipfs/bafkreidvjybrrnquagjom4crnqkbcplhr2uu7r7lqy2wutwx42yyq5o3gy",
  //   { value: getPrice }
  // );

  const getPrice = await contract.getNameByAddress(
    "0xE6E5fcC51439d5c2d31a4659A2C52f7c84A75796"
  );
  console.log(getPrice);

  // Log the result
  // console.log("Name Details:", nameDetails);

  // You can access specific details like name owner using nameDetails[0]

  // You can add more logging or processing based on the returned data
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
