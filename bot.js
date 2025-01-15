const {
  Client,
  Intents,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

const prefix = "!";
const afkUsers = new Map(); // Store AFK users and their messages

// Command collection
const commands = new Map();

commands.set("afk", (message, args) => {
  const reason = args.join(" ") || "AFK 💤";

  if (afkUsers.has(message.author.id)) {
    // User is already AFK, update the reason
    afkUsers.set(message.author.id, reason);
    message.reply(`You're already AFK. Updated your reason to: "${reason}"`);
  } else {
    // User is not AFK, set their status
    afkUsers.set(message.author.id, reason);
    message.reply(`You are now AFK: "${reason}"`);
  }
});

commands.set("rape", (message, args) => {
  const user = args.join(" ");

  message.reply(`${user} you have been raped by ${message.author}`);
});

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

setInterval(() => {
  const channelId = "1297835079623508003";
  const channel = client.channels.cache.get(channelId);
  const url = "https://opentdb.com/api.php?amount=1&type=multiple";

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
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

      channel.send({ embeds: [embed] });

      const filter = (response) => {
        return (
          ["a", "b", "c", "d"].includes(response.content.toLowerCase()) &&
          response.author.id === author.id
        );
      };

      channel
        .awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] })
        .then((collected) => {
          const answer = collected.first().content.toLowerCase();
          const answerIndex = ["a", "b", "c", "d"].indexOf(answer);
          if (answers[answerIndex] === correctAnswer) {
            channel.send("Correct! You get a point!");
            // Add point logic here
          }
        })
        .catch(() => {
          channel.send("You did not answer in time!");
        });
    })
    .catch((err) => {
      console.error(err);
      message.channel.send("Failed to fetch trivia question.");
    });
}, 40 * 60 * 1000);

client.on("messageCreate", (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  // Check if someone pinged an AFK user
  // Remove AFK status when the user sends a message

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Handle commands
  const executeCommand = commands.get(command);
  if (executeCommand) {
    executeCommand(message, args);
  }
  if (afkUsers.has(message.author.id) && command !== "afk") {
    afkUsers.delete(message.author.id);
    message.reply("Welcome back! You've been removed from AFK.");
  }
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach((user) => {
      if (afkUsers.has(user.id)) {
        message.reply(`${user.username} is AFK: "${afkUsers.get(user.id)}"`);
      }
    });
  }
});

client.login(token);

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.post("/announcements", async (req, res) => {
  const { channelId, title, description } = req.body;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      return res.status(400).json({ error: "Channel not found" });
    }

    // Create a cool embed using EmbedBuilder
    const embed = new EmbedBuilder()
      .setTitle(title || "📢 New Announcement")
      .setDescription(description)
      .setColor(0x4e54c8); // Set color (hex code)

    await channel.send({ embeds: [embed] });
    res.status(200).json({ message: "Announcement sent as an embed" });
  } catch (error) {
    console.error("Error sending announcement:", error);
    res.status(500).json({ error: "Failed to send announcement" });
  }
});

app.get("/api/channels", async (req, res) => {
  const guildId = "1297835078399033354";

  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }

    const channels = guild.channels.cache.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
    }));

    res.status(200).json({ channels });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

app.get("/api/roles", async (req, res) => {
  const guildId = "1297835078399033354";

  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }

    const roles = guild.roles.cache.map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
    }));

    res.status(200).json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});
