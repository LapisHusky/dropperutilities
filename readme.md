# Hypixel Dropper Utilities
This is a script that's like a mod for Dropper, adding a couple helpful features, but instead of going into your mods folder it acts as a proxy. This means you'll join a local server with this running, and it will sit between your Minecraft client and Hypixel.

**Warning: Because this project automates chat/command functionality, there is a risk of getting muted or banned on Hypixel. It does not, however, give any in-game advantage. You may choose not to use any of those features (party chat commands, auto requeueing, and lobby alerts) to stay safe.**

## How to use (Standard and easiest method)
- Note: if you're not on Windows, there's a good chance this won't work for you. Currently I'm unable to test the linux build and I don't know how to get the MacOS build working. If you know how to get either of those to work, please DM me on Discord: Lapis#7110
- Download the file from [releases](https://github.com/LapisHusky/dropperutilities/releases) for your operating system (probably Windows)
- You may move the downloaded file to a separate folder, or leave it where it was.
- Run the .exe file to start the proxy if you're on Windows. This program is not officially approved by Microsoft, so Windows may present a security warning. You can click More Info and find a Run Anyway button. A new window should pop up. If everything goes as it should, you should see the text: `Proxy started. You may now join localhost in Minecraft. Keep this window open in the background.`
- Add a multiplayer server with the IP `localhost` in Minecraft 1.8-1.18.2. Modded Minecraft versions are supported.
- Join the server
- Check the window from earlier. You may need to follow login instructions there the first time you run this, afterwards login information is saved. [Why do I need to login?](#Why-do-I-need-to-login)
- Once you're in Hypixel, you can use `/tc` or `/togglecommands` to toggle party chat commands on or off. By default, they are deactivated.
- Create or join a party
- Run `/party chat !help` or `/commands` for a list of commands
- To stop the program, close the window. This will disconnect you if you're still logged into Minecraft.

## Run without using the pre-built executable
- Install [Node.js](https://nodejs.org/en/download/)
- Download this repo to a folder on your computer
- Open Windows Powershell or an equivalent command prompt
- Navigate to the folder using the `cd` command: for example `cd C:/users/Lapis/Desktop/dropperutilities`
- Run `npm install` to download this project's dependencies
- Run `npm start` to start this
- The proxy is now up and running, follow the above instructions to use it in Minecraft.
- To stop the program, type `exit` in the command prompt, or close the window.

## Build an executable yourself
- Install [Node.js](https://nodejs.org/en/download/)
- Download this repo to a folder on your computer
- Open Windows Powershell or an equivalent command prompt
- Navigate to the folder using the `cd` command: for example `cd C:/users/Lapis/Desktop/dropperutilities`
- Run `npm install` to download this project's dependencies
- Run `npm i -g esbuild pkg` to download the tools needed to build the executable
- Run `esbuild ./ --outfile=out.js --bundle --platform=node --minify-whitespace --minify-syntax` to bundle the project into a single file
- Run `pkg ./out.js --public --compress=Brotli` to convert that into executables for Windows, Linux, and MacOS. This may take a while, you can do it without `--compress=Brotli` to speed it up.

## Features
- `/dropper`, `/q`, and `/rq` can be used as a shortcut to play Dropper, instead of the long `/play prototype_dropper`.
- The precise time the countdown took is said in the `DROP!` message in chat. It should be 7 seconds exactly, but will vary slightly from server lag or ping variation.
- The precise time you spend on maps is said in chat when you complete a map. This is based on the time your client receives chat messages, and can vary slightly from Hypixel's time due to ping variation.
- The amount of ticks you spend on each map (and all maps in total) is displayed. This is a network/server lag independent way to measure your time. (not yet supported on 1.18-1.18.2)
- The action bar (text above your hotbar) displays more information about your run.
  - The map you're on, or if you're still waiting for the countdown, or if you've finished, is displayed at the start.
  - If you've finished, the run time and real time (time without countdown) is displayed next to it.
  - Otherwise, the current run time and the time you've spent on the current map is displayed next to it.
  - Displays number of ticks taken on the current map or the whole run.
- Automatic requeuing can be enabled with `/arq`. You can configure the amount of time to requeue after, or requeue when you finish.
- `/tc` will toggle party chat commands, allowing trusted users to control the bot while it's hosting a party.
- `/cmds` to view a list of slash commands.
- `/rpm` can be used to automatically requeue when the bot detects unoptimal speedrun maps. The optimal maps programmed in are `Well, Time, Sewer, Floating Islands, Factory` and `Well, Time, Floating Islands, Sewer, Factory`.
- `/trust add <user>` can be used to add a trusted user. Only trusted users can use most bot commands to prevent random users in the party from messing it up. The bot's operator (you) is always considered trusted and always has access to every command.
- `/trust remove <user>` can be used to remove a trusted user.
- `/trust list <user>` can be used to list trusted users.
- `!takeownership` can be used by another trusted user to get ownership of the party. This is useful if you're the party owner and you're AFK, but a trusted user needs to do something like kick a player.
- `/la` is used to enable automatic alerts for laggy/flame lobbies. These alerts are sent in party chat at the end of the countdown in a game. Only cases where the countdown is off-time by more than 1/10th of a second are alerted. When the countdown is off-time like this, the end run time will also be inaccurate from Hypixel's end, and it may disqualify runs.
- Most commands that work as slash commands also work in party chat if you have enabled party chat commands with `/tc`. Commands in party chat begin with `!` instead of `/`. To view a list of party chat commands, use `!help`. 

## FAQ

### Can I run this without the bot, just for the timer and other features?
Yes, simply don't activate party chat commands when you join the server, don't run `/tc` or `/togglecommands`.

### How do I change the perfect map list?
You can edit the list in `config.yml` and restart the program.

### Why do I need to login?
Minecraft's protocol is encrypted to help keep everyone secure. When you join a server like Hypixel, your client, Hypixel, and Mojang all agree to an encryption scheme. Nothing between you and Hypixel will be able to read what's being sent or modify it because of that encryption. In order for this proxy to work, it has to sit between you and Hypixel, and it has to decrypt and re-encrypt everything being sent. In order to re-encrypt everything going out to Hypixel, this needs to login to Hypixel. It can't do that unless you give it access.\
Your login information is not sent to anything except Mojang/Microsoft. If you don't trust this code and can't review it yourself, don't run it.

### What versions does this support?
This supports versions between 1.8 and 1.18.2, including all subversions. Versions 1.9, 1.10, and 1.13 are not supported because Hypixel has dropped support for them. Support for later versions will be added once [this library](https://github.com/PrismarineJS/node-minecraft-protocol) adds support for them.

### Will I get banned for using this?
I don't know for sure, but me and many others have been using this for a few weeks without getting banned.

### Can you add X?
I'm not actively working on making this high-quality, but if you propose a feature and I like it, I may add it. You are welcome to make your own changes if you know how to. This was originally a personal project that I released publicly because others wanted to use it as well, so it's not as clean as it could be.
