const {
  Client,
  Intents,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fetch = require("node-fetch"); // Ensure fetch is available in Node.js

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from Next.js frontend (adjust port if necessary)
  })
);
app.use(express.json());
const port = process.env.PORT || 3000;
const token = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildScheduledEvents,
  ],
});

const prefix = ",";
const afkUsers = new Map();
const commands = new Map();

// 8ball Command
commands.set("8ball", (message) => {
  const replies = [
    "Yes.",
    "No.",
    "Maybe.",
    "Absolutely!",
    "Not in a million years.",
    "Ask again later.",
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  message.reply(`🎱 ${reply}`);
});

// Joke Command
commands.set("joke", (message) => {
  const jokes = [
    "Why don’t skeletons fight each other? They don’t have the guts.",
    "I told my wife she should embrace her mistakes. She hugged me.",
    "Why don’t eggs tell jokes? They’d crack each other up.",
  ];
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  message.reply(`😂 ${joke}`);
});

// Echo Command
commands.set("echo", (message, args) => {
  const text = args.join(" ");
  if (!text) return message.reply("What do you want me to echo?");
  message.channel.send(text);
});

// Help Command
commands.set("help", (message) => {
  const embed = new EmbedBuilder()
    .setTitle("🤖 Fun Bot Commands")
    .setDescription("Here are the fun commands you can use:")
    .addFields(
      { name: "!afk <reason>", value: "Set your AFK status." },
      { name: "!8ball <question>", value: "Ask the magic 8-ball a question." },
      { name: "!joke", value: "Hear a random joke." },
      { name: "!echo <text>", value: "Make the bot repeat your text." },
      { name: "!help", value: "Show this list of commands." }
    )
    .setColor("#FFA500")
    .setFooter({ text: "Have fun!" });

  message.channel.send({ embeds: [embed] });
});

// Bot ready event
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Welcome new members
client.on("guildMemberAdd", (member) => {
  const channelId = "1297835079623508003"; // Replace with your welcome channel ID
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("🎉 Welcome!")
    .setDescription(
      `Welcome to the server, ${member}! We're glad to have you here!`
    )
    .setColor("#00FF00")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: `Member #${member.guild.memberCount}`,
      iconURL: member.guild.iconURL(),
    });

  channel
    .send({ content: `Hey ${member}, welcome aboard!`, embeds: [embed] })
    .catch((err) => {
      console.error("Failed to send welcome message:", err);
    });
});

// Trivia Question Loop
setInterval(async () => {
  const channelId = "1297835079623508003"; // Channel to send trivia questions to
  const channel = await client.channels.fetch(channelId); // Use await to ensure it's fully fetched
  if (!channel) {
    console.error("Channel not found!");
    return;
  }

  const url = "https://opentdb.com/api.php?amount=1&type=multiple";

  try {
    const response = await fetch(url); // Fetch trivia data
    const data = await response.json();
    const question = data.results[0];
    const correctAnswer = question.correct_answer;
    const answers = [...question.incorrect_answers, correctAnswer].sort(
      () => Math.random() - 0.5
    );

    const embed = new EmbedBuilder()
      .setTitle("Trivia Question")
      .setDescription(question.question)
      .addFields(
        { name: "A", value: answers[0], inline: true },
        { name: "B", value: answers[1], inline: true },
        { name: "C", value: answers[2], inline: true },
        { name: "D", value: answers[3], inline: true }
      )
      .setColor("#00FF00");

    await channel.send({ embeds: [embed] });

    const filter = (response) => {
      return (
        ["a", "b", "c", "d"].includes(response.content.toLowerCase()) &&
        response.author.id !== client.user.id // Prevent bot from answering itself
      );
    };

    // Collect the user's response
    const collected = await channel.awaitMessages({
      filter,
      max: 1,
      time: 30000, // 30 seconds to answer
      errors: ["time"],
    });

    const answer = collected.first()?.content.toLowerCase();
    const answerIndex = ["a", "b", "c", "d"].indexOf(answer);
    if (answers[answerIndex] === correctAnswer) {
      channel.send("Correct! You get a point!");
      // Add point logic here, if needed
    } else {
      channel.send("Wrong answer! Better luck next time.");
    }
  } catch (err) {
    console.error("Error fetching trivia question:", err);
    channel.send("Failed to fetch trivia question.");
  }
}, 40 * 60 * 1000); // Every 40 minutes

// Command handling
client.on("messageCreate", (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const executeCommand = commands.get(command);
  if (executeCommand) {
    executeCommand(message, args);
  }
});

// Bot login
client.login(token);

// Express API
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
