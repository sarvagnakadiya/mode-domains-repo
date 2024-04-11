const {
  Client,
  GatewayIntentBits,
  IntentsBitField,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const { ethers } = require("ethers");

// Replace 'NameRegistryV2.json' with the actual filename/path of your ABI JSON file
const CONTRACT_ABI = require("./NameRegistryV2.json").abi;

// Your Discord Bot Token
const DISCORD_TOKEN =
  "MTE3ODYyOTExMzg1OTI5MzIyNQ.GD5fz8.mdusqrYfG1vfcE6EZt_z9c6evOI3MACRP-zghI";

// Ethereum Node URL
const WEB3_PROVIDER_URI = "https://sepolia.mode.network/";

// Your Ethereum Contract ABI and Address
const CONTRACT_ADDRESS = "0xDbC50cE0F71621E334ebC73135ed26b184da4984";

// Role ID to Assign
const ASSIGN_ROLE_ID = "1178618495676731434";

// Predefined message to be signed
const MESSAGE_TO_SIGN = "Your message here";

// Create a Discord client with intents
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions, // Add MessageReactions intent
  ],
});

console.log(client);

// Connect to the Ethereum node using ethers
const provider = new ethers.providers.JsonRpcProvider(WEB3_PROVIDER_URI);
const signer = provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

console.log(contract);

// Listen for the bot to be ready
client.once("ready", () => {
  console.log("Bot is ready!");
});

client.on("messageCreate", async (message) => {
  // Ignore messages from the bot itself
  if (message.author.bot) return;
  console.log(message.content);

  // Check if the message starts with the command prefix
  if (message.content.startsWith("!check_contract")) {
    // Extract the message signature from the message content
    const args = message.content
      .slice("!check_contract".length)
      .trim()
      .split(/ +/);
    const messageSignature = args.shift();

    // Recover the Ethereum address from the message signature
    try {
      const recoveredAddress = ethers.utils.verifyMessage(
        MESSAGE_TO_SIGN,
        messageSignature
      );

      // Compare the recovered address with the author's Discord ID
      if (recoveredAddress.toLowerCase() === message.author.id.toLowerCase()) {
        // Signature is valid, proceed with the role assignment
        const role = message.guild.roles.cache.get(ASSIGN_ROLE_ID);

        // Send a message to the user with a link to the verification page
        const verificationMessage = await message.author.send(
          `To verify your Ethereum address and receive the role, please visit [modedomains/verify](https://modedomains/verify) and connect your wallet. After connecting, sign the message "${MESSAGE_TO_SIGN}" and react 🌐 to this message.`
        );

        // React to the verification message with 🌐
        await verificationMessage.react("🌐");

        // Create a filter to check for reactions
        const filter = (reaction, user) => {
          return (
            reaction.emoji.name === "🌐" &&
            user.id === message.author.id &&
            reaction.message.id === verificationMessage.id
          );
        };

        // Await reactions and check if the user reacts with 🌐
        verificationMessage
          .awaitReactions({ filter, max: 1, time: 60000, errors: ["time"] })
          .then(async (collected) => {
            // Assign the role if the user reacts with 🌐
            message.member.roles.add(role);
            message.author.send("Role assigned!");
          })
          .catch((error) => {
            console.error(error);
            message.author.send(
              "Verification process timed out or an error occurred."
            );
          });
      } else {
        message.channel.send("Invalid signature or Ethereum address.");
      }
    } catch (error) {
      console.error(error);
      message.channel.send("An error occurred.");
    }
  }
});

// Listen for reactions
client.on("messageReactionAdd", async (reaction, user) => {
  console.log("Reaction object:", reaction);
  if (reaction.emoji.name === "✨" && user.id !== client.user.id) {
    // Send a message with a button to the modedomains/verify page
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setURL("https://modedomains/verify") // Replace with the actual URL
        .setLabel("Verify")
        .setStyle("LINK")
    );

    const message = await reaction.message.channel.send({
      content: `<@${user.id}>, click the button to verify your wallet on modedomains/verify.`,
      components: [row],
    });

    // Wait for the user to click the button
    const filter = (interaction) =>
      interaction.customId === "verify" && interaction.user.id === user.id;
    const collector = message.createMessageComponentCollector({
      filter,
      time: 30000,
    }); // Adjust the time as needed

    // collector.on("collect", async (interaction) => {
    //   try {
    //     // Assuming messageSignature is obtained from the user during the verification process
    //     const recoveredAddress = ethers.utils.verifyMessage(
    //       MESSAGE_TO_SIGN,
    //       messageSignature
    //     );

    //     // Compare the recovered address with the author's Discord ID
    //     if (recoveredAddress.toLowerCase() === user.id.toLowerCase()) {
    //       // Signature is valid, proceed with the balance check
    //       const balance = await contract.balanceOf(recoveredAddress);

    //       if (balance > 1) {
    //         // Assign the role
    //         const role = message.guild.roles.cache.get(ASSIGN_ROLE_ID);
    //         message.guild.members.cache.get(user.id).roles.add(role);
    //         message.channel.send("Role assigned!");
    //       } else {
    //         message.channel.send("Balance is not greater than 1.");
    //       }
    //     } else {
    //       message.channel.send("Invalid signature or Ethereum address.");
    //     }
    //   } catch (error) {
    //     console.error(error);
    //     message.channel.send("An error occurred during verification.");
    //   } finally {
    //     // Stop the collector and remove the components
    //     collector.stop();
    //     message.edit({ components: [] });
    //   }
    // });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        message.edit({
          content: "Verification timed out. Please try again.",
          components: [],
        });
      }
    });
  }
});

// Log in to Discord
client.login(DISCORD_TOKEN);
