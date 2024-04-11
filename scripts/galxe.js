const express = require("express");
const { ethers } = require("ethers");
const abi =
  require("../src/artifacts/contracts/modeDomainsV2.sol/NameRegistryV2.json").abi;

const app = express();
const jsonRpcUrl = "https://sepolia.explorer.mode.network/";
const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);

const contractAddress = "0xDbC50cE0F71621E334ebC73135ed26b184da4984";

app.get("/check-nft/:eoaAddress", async (req, res) => {
  const { eoaAddress } = req.params;

  try {
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const balance = await contract.balanceOf(eoaAddress);

    if (parseInt(balance) > 0) {
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
