# 🏆 Hero XP Discord Bot

A custom Discord leveling bot built with **Node.js**, **discord.js**, and **SQLite**.
Hero XP Bot tracks user activity, awards XP, levels up members, automatically assigns rank roles, announces milestone level-ups, and includes a powerful terminal console for sending messages, uploading images, switching channels, and managing servers.

Simple to run, lightweight, and perfect for community servers.

---

# 📦 Requirements

Download and install:

* Node.js (LTS version recommended)
* Git
* Visual Studio Code (recommended)

Check installation:

```bash id="p1"
node -v
npm -v
git --version
```

If versions appear, setup is complete.

---

# ⚙️ Setup

## 1) Clone project

```bash id="p2"
git clone https://github.com/YOUR_USERNAME/SreyanDev.git
cd SreyanDev
```

---

## 2) Install packages

Initialize project:

```bash id="p3"
npm init -y
```

Install required packages:

```bash id="p4"
npm install discord.js sqlite3 dotenv
```

This installs:

* **discord.js** → Discord bot framework
* **sqlite3** → local database storage
* **dotenv** → secure token storage

---

## 3) Create `.env`

Create a file named:

```text id="p5"
.env
```

Inside it:

```env id="p6"
TOKEN=YOUR_BOT_TOKEN
```

Paste your Discord bot token there.

---

## 4) Run bot

```bash id="p7"
node index.js
```

Bot will start.

---

# 🤖 Create & Invite Bot

Go to Discord Developer Portal

## Create bot

* Create New Application
* Open **Bot** tab
* Click **Add Bot**
* Copy token → paste into `.env`

---

## Invite bot

Go to:

```text id="p8"
OAuth2 → URL Generator
```

Select scopes:

```text id="p9"
bot
applications.commands
```

Enable permissions:

```text id="p10"
View Channels
Send Messages
Embed Links
Attach Files
Manage Roles
Read Message History
Mention Everyone
```

Open generated invite link → add bot to your server.

---

# 💬 Discord Commands

```text id="p11"
!xp
```

Show current XP / Level / Rank

---

```text id="p12"
!leaderboard
```

Show top players

---

```text id="p13"
!levelinfo
```

Show rank ladder

---

Admin only:

```text id="p14"
!xp add @user amount
!xp remove @user amount
!xp reset @user
!xp resetall
!confirmreset
```

---

# 🖥 Terminal Commands

After running:

```bash id="p15"
node index.js
```

Choose channel, then use:

```text id="p16"
msg
```

Enter multiline message mode

Finish with:

```text id="p17"
send
```

Send message

---

```text id="p18"
upload
```

Upload image from PC

---

```text id="p19"
switch
```

Switch channel

Supports:

```text id="p20"
channel-name
channel-id
<#channel-id>
```

---

```text id="p21"
servers
```

List servers using bot

---

```text id="p22"
exit
```

Close terminal mode

---

# 🏅 Rank Roles

* Rookie
* Wolf
* Tiger
* Demon
* Dragon
* God
* Broken Limiter

---

# 🛠 Tech Stack

* Node.js
* discord.js
* SQLite
* dotenv

---

Made by **SreyanDev** 🚀
