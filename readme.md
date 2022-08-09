# Hypixel Dropper Speedrun Party Bot
This is a bot that automates some functions of running a dropper speedrun party.

Note that because this project automates chat functionality, there is a risk of getting muted or banned on Hypixel. I recommend using this on an alternate account that you are fine with getting banned on.

How to use:
- Install [Node.js](https://nodejs.org/en/download/)
- Download this repo to a folder on your computer
- Open Windows Powershell or an equivalent command prompt
- Navigate to the folder using the `cd` command: for example `cd C:/users/Lapis/Desktop/dropperpartybot`
- Run `npm install` to download this project's dependencies
- Run `npm start` to start this
- Add a multiplayer server with the IP `localhost` in Minecraft 1.16.1 multiplayer
- Join the server
- Check your command prompt. You may need to follow login instructions there the first time you run this, afterwards login credentials are saved.
- Create or join a party
- Run `/party chat !help` for a list of commands
- To stop the bot, have your command prompt in focus, and press ctrl+c. This will disconnect you if you're still logged into Minecraft.

## Recent Updates
- Fixed an issue where editing trusted.txt with some editors on Windows added a special character that my program failed to parse

## FAQ
### How do I change trusted users?
Edit trusted.txt with a list of dashed UUIDs separated by a newline. You can get UUIDs from https://namemc.com Any text may go after the UUID, such as their name or a note.

### Can I run this without the bot, just for the timer and /q shortcut?
Yes. Edit ClientHandler.js and on lines 33 and 36 you will see these 2 lines of code:
- `this.partyChatThrottle = new PartyChatThrottle(this)`
- `this.partyCommands = new PartyCommands(this)`
Put `//` before both of them, so they become:
- `//this.partyChatThrottle = new PartyChatThrottle(this)`
- `//this.partyCommands = new PartyCommands(this)`
Use ctrl+c to exit the process and restart it with `npm start`, then you should have a botless version running.

### How do I change the perfect map list?
At the moment the optimal map list is being debated, some believe Floating Islands first is better and others believe Sewer first is better. In the code this is currently setup so both may be first, but you may change it to anything you want inside of AutoQueue.js

### Why do I need to login?
Minecraft's protocol is encrypted to help keep everyone secure. When you login to a server in online mode such as Hypixel, everything sent between your Minecraft client and the Hypixel server is encrypted and can't be read or changed by this proxy.
In order for this proxy to work, it acts as a regular Minecraft server and your Minecraft client logs in to it, then this proxy logs into Hypixel, effectively setting up 2 separate encryption systems.
This allows it to view packet content, modify, and inject packets for chat and command automation.
None of your login info is sent to anything except Mojang/Microsoft. If you do not trust this code and can't review it yourself, don't run it.

### Can I use a version other than 1.16.1?
Possibly. In its current state, this only supports 1.16.1. You may change the version inside of Proxy.js and ClientHandler.js. Make sure you change BOTH.
I have tested this on 1.8.9 and 1.16.1 and confirmed it works there. I have not tested any other version, and I will not fix bugs in versions other than 1.16.1.

### Will I get banned for using this?
I don't know. I have used it for a few days without getting banned, but it is something you could be banned for using. Because of that risk, I strongly recommend using an account you would be fine with getting banned on.

### Can you add X?
I'm not taking feature requests for this bot. You are welcome to make your own changes if you know how to. This is just a personal project that I released because others wanted to use it as well.
