const { Client, Intents } = require("discord.js");
const Discord = require("discord.js");
const express = require("express");
require("dotenv").config();
const token = process.env.TOKEN;
const client = new Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.GuildMessageTyping,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.DirectMessageReactions,
    Discord.GatewayIntentBits.DirectMessageTyping,
    Discord.GatewayIntentBits.GuildScheduledEvents,
    Discord.GatewayIntentBits.MessageContent,
  ],
});

const prefix = "!";

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
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

      const embed = new Discord.EmbedBuilder()
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
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    message.channel.send("Pong!");
  } else if (command === "hello") {
    message.channel.send("Hello there!");
  } else if (command === "announce") {
    const channelId = args.shift();
    const announcement = args.join(" ");
    if (!channelId || !announcement) {
      return message.channel.send(
        "Please provide a channel ID and an announcement."
      );
    }
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return message.channel.send(`Channel with ID ${channelId} not found.`);
    }

    const embed = new Discord.EmbedBuilder()
      .setTitle("Announcement")
      .setDescription(announcement)
      .setColor("#FF0000");

    channel.send({ embeds: [embed] }).catch((err) => {
      console.error(err);
      message.channel.send(
        `Failed to send the announcement in the channel with ID ${channelId}.`
      );
    });
  } else if (command === "help") {
    message.channel.send("Available commands: !ping, !hello, !help");
  }
});

client.login(token);

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});
