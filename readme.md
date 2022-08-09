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

## FAQ
### How do I change trusted users?
Edit trusted.txt with a list of dashed UUIDs separated by a newline. You can get UUIDs from https://namemc.com Any text may go after the UUID, such as their name or a note.

### How do I change the perfect map list?
At the moment the optimal map list is being debated, some believe Floating Islands first is better and others believe Sewer first is better. In the code this is currently set to Floating Islands first, but you may change it to anything you want inside of AutoQueue.js

### Why do I need to login?
Minecraft's protocol is encrypted to help keep everyone secure. When you login to a server in online mode such as Hypixel, everything sent between your Minecraft client and the Hypixel server is encrypted and can't be read or changed by this proxy.
In order for this proxy to work, it acts as a regular Minecraft server and let you log in to it, then this proxy logs into Hypixel, effectively setting up 2 separate encryption systems.
This allows it to view packet content, modify, and inject packets for chat and command automation.
None of your login info is sent to anything except Mojang/Microsoft. If you do not trust this code and can't review it yourself, don't run it.

### Can I use a version other than 1.16.1?
Possibly. In its current state, this only supports 1.16.1. You may change the version inside of Proxy.js and ClientHandler.js. Make sure you change BOTH.
I have tested this on 1.8.9 and 1.16.1 and confirmed it works there. I have not tested any other version, and I will not fix bugs in versions other than 1.16.1.

### Will I get banned for using this?
I don't know. I have used it for a few days without getting banned, but it is something you could be banned for using. Because of that risk, I strongly recommend using an account you would be fine with getting banned on.
