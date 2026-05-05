require("dotenv").config();

const db = require("./database");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const readline = require("readline");
const fs = require("fs");
const { exec } = require("child_process");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const LEVEL_UP_CHANNEL = "✢﹕level-up﹒";
const MAX_LEVEL = 200;
let resetConfirmUntil = 0;

const rankRoles = [
  { level: 1, role: "Rookie." },
  { level: 5, role: "Wolf." },
  { level: 15, role: "Tiger." },
  { level: 30, role: "Demon." },
  { level: 60, role: "Dragon." },
  { level: 120, role: "God." },
  { level: 200, role: "Broken Limiter." }
];

function xpNeeded(level) {
  return Math.floor(150 * Math.pow(level, 2.2));
}

function getRank(level) {
  let current = "Unranked";
  for (const rank of rankRoles) {
    if (level >= rank.level) current = rank.role;
  }
  return current;
}

function formatNumber(num) {
  return num.toLocaleString();
}

function getProgress(level, xp) {
  if (level >= MAX_LEVEL) return "MAX";

  const currentReq = xpNeeded(level);
  const nextReq = xpNeeded(level + 1);
  const gained = xp - currentReq;
  const needed = nextReq - currentReq;

  return `${Math.min(100, Math.floor((gained / needed) * 100))}%`;
}

function calculateLevel(xp) {
  let level = 0;
  while (level < MAX_LEVEL && xp >= xpNeeded(level + 1)) {
    level++;
  }
  return level;
}

function isAdmin(member) {
  return member.roles.cache.some(
    role => role.name === "Resistance Commander"
  );
}

async function updateRoles(member, level) {
  const newRoleName = getRank(level);

  for (const rank of rankRoles) {
    const role = member.guild.roles.cache.find(r => r.name === rank.role);
    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role).catch(() => { });
    }
  }

  const newRole = member.guild.roles.cache.find(r => r.name === newRoleName);
  if (newRole) {
    await member.roles.add(newRole).catch(() => { });
  }
}

function ensureUser(userId, callback) {
  db.get("SELECT * FROM users WHERE userId = ?", [userId], (err, user) => {
    if (err) return console.error(err);

    if (!user) {
      db.run(
        "INSERT INTO users (userId, xp, level, lastMessage) VALUES (?, ?, ?, ?)",
        [userId, 0, 0, 0],
        () =>
          callback({
            userId,
            xp: 0,
            level: 0,
            lastMessage: 0
          })
      );
    } else {
      callback(user);
    }
  });
}

client.once("clientReady", () => {
  console.log(`${client.user.tag} is online!`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let currentChannel = null;
  let mode = "command";
  let messageBuffer = [];

  function pickChannel() {
    rl.question("Enter channel name: ", (channelName) => {
      let channel = null;

      // <#123456>
      const mentionMatch = channelName.match(/^<#(\d+)>$/);
      if (mentionMatch) {
        channel = client.channels.cache.get(mentionMatch[1]);
      }
      // raw id
      else if (/^\d+$/.test(channelName)) {
        channel = client.channels.cache.get(channelName);
      }
      // normal name
      else {
        channel = client.channels.cache.find(
          ch => ch.name === channelName
        );
      }

      if (!channel) {
        console.log("Channel not found.");
        return pickChannel();
      }

      currentChannel = channel;

      console.log(`Connected to #${channel.name}`);
      console.log("Commands: msg | upload | switch | servers | exit");
    });
  }

  pickChannel();

  rl.on("line", (input) => {
    input = input.trim();

    if (input.toLowerCase() === "exit") {
      console.log("Closed terminal chat.");
      rl.close();
      return;
    }

    if (input.toLowerCase() === "servers") {
      console.log("\n=== SERVERS USING THIS BOT ===");

      client.guilds.cache.forEach((guild, index) => {
        console.log(`${index + 1}. ${guild.name} (${guild.id})`);
      });

      console.log(`Total: ${client.guilds.cache.size}`);
      console.log("Commands: msg | upload | switch | servers | exit");
      return;
    }

    if (input.toLowerCase() === "switch") {
      pickChannel();
      return;
    }

    if (input.toLowerCase() === "msg") {
      mode = "message";
      messageBuffer = [];
      console.log("Paste lines. Type 'send' when done:");
      return;
    }

    if (input.toLowerCase() === "upload") {
      exec(
        `powershell -command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Images|*.jpg;*.jpeg;*.png;*.gif;*.webp'; if($f.ShowDialog() -eq 'OK'){ Write-Output $f.FileName }"`,
        async (err, stdout) => {
          const filePath = stdout.trim();

          if (!filePath) {
            console.log("No file selected.");
            return;
          }

          await currentChannel.send({
            files: [filePath]
          }).catch(() => {
            console.log("Cannot upload in this channel.");
          });

          console.log("Uploaded.");
          console.log("Commands: msg | upload | switch | servers | exit");
        }
      );

      return;
    }

    if (mode === "message") {
      if (input.toLowerCase() === "send") {
        const finalMessage = messageBuffer.join("\n");

        const chunks = [];
        for (let i = 0; i < finalMessage.length; i += 1900) {
          chunks.push(finalMessage.slice(i, i + 1900));
        }

        (async () => {
          try {
            for (const chunk of chunks) {
              await currentChannel.send({
                content: chunk,
                allowedMentions: {
                  parse: ["users", "roles", "everyone"]
                }
              });
            }
          } catch {
            console.log("Cannot send message in this channel.");
          }
        })();

        mode = "command";
        messageBuffer = [];
        console.log("Sent.");
        console.log("Commands: msg | upload | switch | servers | exit");
        return;
      }

      messageBuffer.push(input);
      return;
    }
  });

});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const content = message.content.trim();

  // COMMANDS
  if (content.startsWith("!")) {
    const args = content.slice(1).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (command === "xp" && args.length === 0) {
      ensureUser(message.author.id, (user) => {
        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle(`Hero Report — ${message.author.username}`)
          .addFields(
            { name: "Rank", value: getRank(user.level), inline: true },
            { name: "Level", value: `${user.level}`, inline: true },
            {
              name: "XP",
              value: `${formatNumber(user.xp)} / ${user.level >= MAX_LEVEL
                ? "MAX"
                : formatNumber(xpNeeded(user.level + 1))
                }`
            },
            {
              name: "Progress",
              value: getProgress(user.level, user.xp),
              inline: true
            }
          );

        message.reply({ embeds: [embed] });
      });
      return;
    }

    if (command === "xp" && args[0] === "resetall") {
      if (!isAdmin(message.member)) {
        return message.reply("Resistance Commander only.");
      }

      resetConfirmUntil = Date.now() + 15000;

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("⚠ WARNING ⚠")
        .setDescription(
          "  **!confirmreset** within 15 seconds to wipe all hero XP.\nThis cannot be undone."
        );

      message.reply({ embeds: [embed] });
      return;
    }

    if (command === "confirmreset") {
      if (!isAdmin(message.member)) {
        return message.reply("Resistance Commander only.");
      }

      if (Date.now() > resetConfirmUntil) {
        return message.reply("Reset confirmation expired.");
      }

      db.run("DELETE FROM users");

      for (const member of message.guild.members.cache.values()) {
        for (const rank of rankRoles) {
          const role = message.guild.roles.cache.find(r => r.name === rank.role);
          if (role && member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(() => { });
          }
        }
      }

      resetConfirmUntil = 0;

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("💀 HERO DATABASE WIPED 💀")
        .setDescription("All XP, levels, and rank roles have been reset.");

      message.reply({ embeds: [embed] });
      return;
    }

    if (command === "xp" && ["add", "remove", "reset"].includes(args[0])) {
      if (!isAdmin(message.member)) {
        return message.reply("Resistance Commander only.");
      }

      const action = args[0];
      const target = message.mentions.users.first();

      if (!target) return message.reply("Mention a user.");

      ensureUser(target.id, async (user) => {
        let xp = user.xp;

        if (action === "add") {
          const amount = parseInt(args[2]);
          if (isNaN(amount)) return message.reply("Invalid amount.");
          xp += amount;
        }

        if (action === "remove") {
          const amount = parseInt(args[2]);
          if (isNaN(amount)) return message.reply("Invalid amount.");
          xp = Math.max(0, xp - amount);
        }

        if (action === "reset") xp = 0;

        const oldLevel = user.level;
        const newLevel = calculateLevel(xp);

        db.run(
          "UPDATE users SET xp = ?, level = ? WHERE userId = ?",
          [xp, newLevel, target.id]
        );

        const member = await message.guild.members.fetch(target.id);
        await updateRoles(member, newLevel);

        const embed = new EmbedBuilder()
          .setColor(action === "add" ? 0x2ecc71 : 0xe74c3c)
          .setTitle(`XP ${action.toUpperCase()} Complete`)
          .setDescription(
            `${target} is now Level ${newLevel}\nRank: ${getRank(newLevel)}`
          );

        message.reply({ embeds: [embed] });

        if (newLevel > oldLevel && newLevel % 5 === 0) {
          const levelChannel = message.guild.channels.cache.find(
            ch => ch.name === LEVEL_UP_CHANNEL
          );

          if (levelChannel) {
            levelChannel.send(
              `💥 ${target} reached Level ${newLevel}! 💥\nHero Association updated your rank to ${getRank(newLevel)}.\nKeep climbing.`
            );
          }
        }
      });

      return;
    }

    if (command === "leaderboard") {
      db.all(
        "SELECT * FROM users ORDER BY level DESC, xp DESC LIMIT 10",
        [],
        (err, rows) => {
          if (err) return console.error(err);
          if (!rows.length) return message.reply("No heroes yet.");

          const description = rows
            .map(u => `<@${u.userId}> — Level ${u.level}\nRank: ${getRank(u.level)}`)
            .join("\n\n");

          const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle("🏆 Hero Rankings 🏆")
            .setDescription(description);

          message.reply({ embeds: [embed] });
        }
      );
      return;
    }

    if (command === "levelinfo") {
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle("Hero Rank Ladder")
        .setDescription(
          `Level 200 → Broken Limiter.
Level 120 → God.
Level 60 → Dragon.
Level 30 → Demon.
Level 15 → Tiger.
Level 5 → Wolf.
Level 1 → Rookie.`
        );

      message.reply({ embeds: [embed] });
      return;
    }

    return;
  }

  // XP SYSTEM
  if (content.length < 8) return;

  ensureUser(message.author.id, async (user) => {
    const now = Date.now();

    if (now - user.lastMessage < 60000) return;

    const gainedXP = Math.floor(Math.random() * 16) + 20;
    console.log(`${message.author.username} +${gainedXP} XP`);

    const xp = user.xp + gainedXP;
    const oldLevel = user.level;
    const newLevel = calculateLevel(xp);

    db.run(
      "UPDATE users SET xp = ?, level = ?, lastMessage = ? WHERE userId = ?",
      [xp, newLevel, now, message.author.id]
    );

    if (newLevel > oldLevel) {
      await updateRoles(message.member, newLevel);

      if (newLevel % 5 === 0) {
        const levelChannel = message.guild.channels.cache.find(
          ch => ch.name === LEVEL_UP_CHANNEL
        );

        if (levelChannel) {
          levelChannel.send(
            `💥 ${message.author} reached Level ${newLevel}! 💥\nHero Association updated your rank to ${getRank(newLevel)}.\nKeep climbing.`
          );
        }
      }
    }
  });
});

client.login(process.env.TOKEN);