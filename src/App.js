import logo from "./logo.svg";
import "./App.css";
import { ethers } from "ethers";
import abi from "./artifacts/contracts/modeDomainsV2.sol/NameRegistryV2.json";
import { useEffect, useState } from "react";
// const { Client } = require("discord.js");
// import { Client } from "discord.js";

function App() {
  const [errorMessage, setErrorMessage] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null);
  const [userBalance, setUserBalance] = useState(null);

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const handleClaimEarlyAccess = async () => {
    try {
      const connectedContract = new ethers.Contract(
        "0xDbC50cE0F71621E334ebC73135ed26b184da4984",
        abi.abi,
        signer
      );

      const balance = await connectedContract.balanceOf(signer.getAddress());
      console.log(balance);
      console.log(parseInt(balance._hex));

      if (parseInt(balance._hex) > 0) {
        console.log("It has");

        // Get user's signature for claiming early access role
        const message = "Claim Early Access Role";
        const signature = await signer.signMessage(message);

        // Now you have the user's signature, you can use it as needed
        console.log("User's Signature:", signature);

        // Verify the signature
        const signerAddress = ethers.utils.verifyMessage(message, signature);
        console.log("Signer Address:", signerAddress);

        // Check if the signer address matches the user's address
        if (signerAddress === (await signer.getAddress())) {
          console.log(
            "Signature is valid. Proceed with claiming early access."
          );
        } else {
          console.log("Signature is not valid. Aborting.");
        }
      } else {
        console.log("It does not");
      }
    } catch (err) {
      console.log(err.reason);
    }
  };

  const connectwalletHandler = () => {
    if (window.Ethereum) {
      provider.send("eth_requestAccounts", []).then(async () => {
        await accountChangedHandler(provider.getSigner());
      });
    } else {
      setErrorMessage("Please Install Metamask!!!");
    }
  };
  const accountChangedHandler = async (newAccount) => {
    const address = await newAccount.getAddress();
    setDefaultAccount(address);
    const balance = await newAccount.getBalance();
    setUserBalance(ethers.utils.formatEther(balance));
    await getuserBalance(address);
  };
  const getuserBalance = async (address) => {
    const balance = await provider.getBalance(address, "latest");
  };
  const check = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const connectedContract = new ethers.Contract(
        "0x17283Ca17A946a8319154275706351D0e1198B8B",
        abi.abi,
        signer
      );

      const allProductsData = await connectedContract.registerName(
        "gtr",
        "metadata"
      );
      console.log(allProductsData);

      return allProductsData;
    } catch (err) {
      console.log(err.reason);
      if (err.reason.includes("Name is already registered")) {
        console.log("Name is already registered");
      } else {
        console.log(err);
      }
    }
  };
  const getName = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const connectedContract = new ethers.Contract(
        "0xDbC50cE0F71621E334ebC73135ed26b184da4984",
        abi.abi,
        signer
      );

      const balance = await connectedContract.balanceOf(
        "0x2585d23cF030aA77e47C9051f1fF0dBeB7a123e5"
      );
      console.log(balance);

      if (balance) {
        console.log("HAS");
      }

      const tokenId = await connectedContract.tokenOfOwnerByIndex(
        "0x2585d23cF030aA77e47C9051f1fF0dBeB7a123e5",
        0
      );
      console.log(`Token ID : ${tokenId.toString()}`);
      // for (let i = 0; i < balance; i++) {
      //   console.log(i);
      //   const tokenId = await connectedContract.tokenOfOwnerByIndex(
      //     "0x2585d23cF030aA77e47C9051f1fF0dBeB7a123e5",
      //     0
      //   );
      //   console.log(`Token ID ${i}: ${tokenId.toString()}`);
      // }
      const resolvedName = await connectedContract.tokenIdToName(tokenId);
      console.log(resolvedName);

      // console.log(getTokenIds());

      // const allProductsData = await connectedContract.getNameByAddress(
      //   "0x2585d23cF030aA77e47C9051f1fF0dBeB7a123e5"
      // );
      // console.log(allProductsData);

      // return allProductsData;
    } catch (err) {
      console.log(err.reason);
    }
  };

  return (
    <div className="App">
      <button onClick={() => check()}>press</button>
      <button onClick={() => getName()}>getName</button>
      <button onClick={handleClaimEarlyAccess}>Claim Early Access</button>
      <div className="WalletCard">
        {/* <img src={Ethereum} className="App-logo" alt="logo" /> */}
        <h3 className="h4">Welcome to a decentralized Application</h3>
        <button
          style={{ background: defaultAccount ? "#A5CC82" : "white" }}
          onClick={connectwalletHandler}
        >
          {defaultAccount ? "Connected!!" : "Connect"}
        </button>
        <div className="displayAccount">
          <h4 className="walletAddress">Address:{defaultAccount}</h4>
          <div className="balanceDisplay">
            <h3>Wallet Amount: {userBalance}</h3>
          </div>
        </div>
        {errorMessage}
      </div>
    </div>
  );
}

export default App;
