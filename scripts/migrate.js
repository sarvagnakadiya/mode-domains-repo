const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  // Read contract addresses from the JSON file
  const contractAddresses = JSON.parse(fs.readFileSync('contractAddresses.json'));

  // Get the contract instances
  const OldRegistry = await ethers.getContractFactory('NameRegistry');
  const oldRegistry = await OldRegistry.attach(contractAddresses.NAME_REGISTRY_V1_ADDRESS);

  const NewRegistryV2 = await ethers.getContractFactory('NameRegistryV2');
  const newRegistry = await NewRegistryV2.attach(contractAddresses.NAME_REGISTRY_V2_ADDRESS);

  // Check if the migration has already been done
  let nextTokenId = await newRegistry.nextTokenId();
  console.log(nextTokenId);

  if (nextTokenId.toNumber() > 51) {
    console.log('Migration already completed.');
    return;
  }

  // Get the total number of tokens in the old registry
  const totalTokens = await oldRegistry.nextTokenId();

  // Define batch size and start from token ID 1
  const batchSize = 5; // Change this to 5
  let startTokenId = 51;

  while (startTokenId < totalTokens.toNumber()) {
    const endTokenId = Math.min(startTokenId + batchSize - 1, totalTokens.toNumber());

    // Migrate a batch of tokens
    await migrateBatch(oldRegistry, newRegistry, startTokenId, endTokenId);

    startTokenId += batchSize;
  }

  console.log('Migration completed.');
}

async function migrateBatch(oldRegistry, newRegistry, startTokenId, endTokenId) {
  for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId++) {
    // Retrieve data from the old contract
    const name = await oldRegistry.tokenIdToName(tokenId);
    const creationTimestamp = await oldRegistry.tokenIdToCreationTimestamp(tokenId);
    const tokenURIValue = await oldRegistry.tokenURI(tokenId);
    const tokenOwner = await oldRegistry.ownerOf(tokenId);

    // Migrate the data to the new contract
    await newRegistry.migrate(
      name,
      tokenURIValue,
      tokenOwner, // Pass the token owner's address
      creationTimestamp
    );

    console.log(`Migrated token ID ${tokenId}: ${name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
