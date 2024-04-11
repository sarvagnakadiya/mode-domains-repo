const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Load contract addresses from contractAddresses.json
  const contractAddressesJSON = fs.readFileSync("contractAddresses.json");
  const contractAddresses = JSON.parse(contractAddressesJSON);
  const oldRegistryAddress = contractAddresses.NAME_REGISTRY_V1_ADDRESS; // Update with the correct key
  const newRegistryAddress = contractAddresses.NAME_REGISTRY_V2_ADDRESS; // Update with the correct key

  // Load the old and new contract artifacts
  const OldRegistry = await ethers.getContractFactory("NameRegistry");
  const NewRegistry = await ethers.getContractFactory("NameRegistryV2");

  // Connect to the old and new contracts
  const oldRegistry = await OldRegistry.attach(oldRegistryAddress);
  const newRegistry = await NewRegistry.attach(newRegistryAddress);

  // Check if migration is already completed
  const migrationCompleted = await newRegistry.nextTokenId();
  if (migrationCompleted.toNumber() > 1) {
    console.log("Migration already completed");
    return;
  }

  const totalTokens = await oldRegistry.nextTokenId();

  // Set the batch size for migrating tokens
  const batchSize = 10; // Migrate 10 tokens at a time

  // Manually set the gas limit to the maximum value
  const gasLimit = 3000000; // You can increase this value if needed

  // Initialize nonce
  let nonce = await deployer.getTransactionCount();

  // Loop through token IDs in batches
  for (let i = 1; i <= totalTokens.toNumber(); i += batchSize) {
    const batchStart = i;
    const batchEnd = Math.min(i + batchSize - 1, totalTokens.toNumber());

    const txBatch = [];

    // Migrate tokens in this batch
    for (let tokenId = batchStart; tokenId <= batchEnd; tokenId++) {
      // Retrieve data from the old contract
      const name = await oldRegistry.tokenIdToName(tokenId);
      const creationTimestamp = await oldRegistry.tokenIdToCreationTimestamp(
        tokenId
      );
      const tokenURIValue = await oldRegistry.tokenURI(tokenId);

      // Retrieve the owner of the token
      const tokenOwner = await oldRegistry.ownerOf(tokenId);

      // Prepare a batch transaction to migrate the data
      const tx = {
        to: newRegistryAddress, // New contract address
        data: newRegistry.interface.encodeFunctionData("migrate", [
          name,
          tokenURIValue,
          tokenOwner,
          creationTimestamp,
        ]),
        gasLimit: gasLimit, // Set gas limit manually to the maximum value
        nonce: nonce, // Set the nonce value
      };

      nonce++; // Increment nonce for the next transaction

      txBatch.push(tx);
    }

    // Use Promise.all to send all transactions in the batch concurrently
    const txHashes = await Promise.all(
      txBatch.map(async (tx) => {
        const txResponse = await deployer.sendTransaction(tx);
        return txResponse.hash;
      })
    );

    console.log(`Batch ${batchStart}-${batchEnd} migrated`);
    console.log("Transactions sent:", txHashes);
  }

  console.log("Data migration completed");

  // Check if tokens exist in the new contract (NameRegistryV2)
  const totalTokensInNewRegistry = await newRegistry.nextTokenId();
  if (totalTokensInNewRegistry.toNumber() > 1) {
    console.log(`Tokens successfully migrated to ${newRegistryAddress}`);
  } else {
    console.error("No tokens migrated to the new contract.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
