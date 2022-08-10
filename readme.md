# Hypixel Dropper Speedrun Party Bot
This was originally intended to run a Hypixel Dropper speedrun party automatically, but its functionality has been extended to include general utilities for speedrunners as well such as precise timing.

**Warning: Because this project automates chat/command functionality, there is a risk of getting muted or banned on Hypixel. By using this, you accept that risk.**

## Features
- `/dropper`, `/q`, and `/rq` can be used as a shortcut to play Dropper, instead of the long `/play prototype_dropper`.
- The precise time the countdown took is said in the `DROP!` message in chat. It should be 7 seconds exactly, but will vary slightly from server lag or ping variation.
- The precise time you spend on maps is said in chat when you complete a map. This is based on the time your client receives chat messages, and can vary slightly from Hypixel's time due to ping variation.
- The action bar (text above your hotbar) displays more information about your run.
  - The map you're on, or if you're still waiting for the countdown, or if you've finished, is displayed at the start.
  - If you've finished, the run time and real time (time without countdown) is displayed next to it.
  - Otherwise, the current run time and the time you've spent on the current map is displayed next to it.
- Automatic requeuing can be enabled with `!arq` in party chat. By default, it will queue another game of Dropper after 50 seconds.
- That time can be configured with `!rqt <time in seconds>`, for example `!rqt 60` for 1 minute.
- `!rpm` can be used to automatically requeue when the bot detects unoptimal speedrun maps. The optimal maps programmed in are `Well, Time, Sewer, Floating Islands, Factory` and `Well, Time, Floating Islands, Sewer, Factory`.
- `!at <UUID>` can be used to add a trusted user. Only trusted users can use most bot commands to prevent random users in the party from messing it up. The bot's operator (you) is always considered trusted and always has access to every command.
- `!rt <UUID>` can be used to remove a trusted user. You should edit `trusted.txt` and remove their UUID manually there too, the bot does not do this automatically.
- `!rq` can be used to immediately requeue to another game of Dropper. This is intended for if the bot operator is AFK and a trusted user needs to get out of a laggy/broken lobby.
- `!to` can be used by another trusted user to get ownership of the party. This is useful if you're the party owner and you're AFK, but a trusted user needs to do something like kick a player.
- `!la` is used to enable automatic alerts for laggy/flame lobbies. These alerts are sent in party chat at the end of the countdown in a game. Only cases where the countdown is off-time by more than 1/10th of a second are alerted. When the countdown is off-time like this, the end run time will also be inaccurate from Hypixel's end, and it may disqualify runs.

## How to use (Standard and easiest method)
- Download the zip file from [releases](https://github.com/LapisHusky/dropperpartybot/releases) for your operating system (probably Windows)
- Extract it to anywhere you want
- Run start.exe to start the proxy if you're on Windows, a new blank window should pop up
- Add a multiplayer server with the IP `localhost` in Minecraft 1.16.1 multiplayer
- Join the server
- Check the window from earlier. You may need to follow login instructions there the first time you run this, afterwards login information is saved.
- Once you're in Hypixel, you can use `/tc` or `/togglecommands` to toggle party chat commands on or off. By default, they are deactivated.
- Create or join a party
- Run `/party chat !help` for a list of commands
- To stop the bot, close the window. This will disconnect you if you're still logged into Minecraft.

## Run without using the pre-built executable
- Install [Node.js](https://nodejs.org/en/download/)
- Download this repo to a folder on your computer
- Open Windows Powershell or an equivalent command prompt
- Navigate to the folder using the `cd` command: for example `cd C:/users/Lapis/Desktop/dropperpartybot`
- Run `npm install` to download this project's dependencies
- Run `npm start` to start this
- The proxy is now up and running, follow the above instructions to use it in Minecraft.

## Build an executable yourself
- Install [Node.js](https://nodejs.org/en/download/)
- Download this repo to a folder on your computer
- Open Windows Powershell or an equivalent command prompt
- Navigate to the folder using the `cd` command: for example `cd C:/users/Lapis/Desktop/dropperpartybot`
- Run `npm install` to download this project's dependencies
- Run `npm i -g esbuild pkg` to download the tools needed to build the executable
- Run `esbuild ./ --outfile=out.js --bundle --platform=node` to bundle the project into a single file
- Run `pkg ./out.js --public` to convert that into executables for Windows, Linux, and MacOS

## Recent Updates
- The project is now built as a standalone executable (still requires a `trusted.txt` file)
- The localhost server's favicon is now Among Us as suggested by i77_
- The bot operator (you) is always considered trusted in party commands, even if their UUID is not in the trusted users file
- The action bar (text above hotbar) now displays precise timing and map information throughout the game
- Party chat commands are now disabled by default and can be toggled with /tc or /togglecommands
- Perfect Map Requirement now accepts Sewer or Floating Islands first
- Fixed an issue where editing trusted.txt with some editors on Windows added a special character that this failed to parse

## FAQ
### How do I change trusted users?
Edit trusted.txt with a list of dashed UUIDs separated by a newline. You can get UUIDs from https://namemc.com Any text may go after the UUID, such as their name or a note.\
After editing this list, you must restart the program. Alternatively, you can use !addtrust and !removetrust in party chat to add/remove UUIDs from this list while it's running.

### Can I run this without the bot, just for the timer and other features?
Yes, simply don't activate party chat commands when you join the server, don't run `/tc` or `/togglecommands`.

### How do I change the perfect map list?
At the moment the optimal map list is being debated, some believe Floating Islands first is better and others believe Sewer first is better. In the code this is currently setup so both may be first, but you may change it to anything you want inside of AutoQueue.js. If you edit the source code this way, the executable will not be up-to-date, so you will need to [run the source code yourself](#Run-without-using-the-pre-built-executable).

### Why do I need to login?
Minecraft's protocol is encrypted to help keep everyone secure. When you join a server like Hypixel, your client, Hypixel, and Mojang all agree to an encryption scheme. Nothing between you and Hypixel will be able to read what's being sent or modify it because of that encryption. In order for this proxy to work, it has to sit between you and Hypixel, and it has to decrypt and re-encrypt everything being sent. In order to re-encrypt everything going out to Hypixel, this needs to login to Hypixel. It can't do that unless you give it access.\
Your login information is not sent to anything except Mojang/Microsoft. If you don't trust this code and can't review it yourself, don't run it.

### Can I use a version other than 1.16.1?
Possibly. In its current state, this only supports 1.16.1. You may change the version inside of Proxy.js and ClientHandler.js. Make sure you change BOTH. If you edit the source code this way, the executable will not be up-to-date, so you will need to [run the source code yourself](#Run-without-using-the-pre-built-executable).\
I have tested this on 1.8.9 and 1.16.1 and confirmed it works there, although command responses may have issues in versions below 1.11 because of the lower chat length limit. I have not tested any other version, and I will not fix bugs in versions other than 1.16.1.

### Will I get banned for using this?
I don't know. I have used it for a few days without getting banned, but it is something you could be banned for using. Because of that risk, I recommend using an account you would be fine with getting banned on.

### Can you add X?
I'm not currently taking feature requests for this bot. You are welcome to make your own changes if you know how to. This is just a personal project that I released because others wanted to use it as well.