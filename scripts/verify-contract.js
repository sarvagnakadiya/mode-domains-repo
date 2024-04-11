// const { verifyContract } = require("@nomicfoundation/hardhat-etherscan");

async function main() {
  const contractAddress = "0xDbC50cE0F71621E334ebC73135ed26b184da4984"; // Replace with your contract's address
  const constructorArgs = ["ModeDomains", "MD"]; // Replace with your constructor arguments

  await verifyContract({
    address: contractAddress,
    constructorArguments: constructorArgs,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
