export default `# Config version, used to quickly validate the config and make sure it will have all of the necessary information in it. Do not change this unless you know what you're doing.
config-version: 3
# Port to host the server on. Usually you can leave this on 25565, which is Minecraft's default port.
server-port: 25565
# The server's host. Recommended to leave this on 127.0.0.1.
server-host: 127.0.0.1
# Perfect map configurations for automatic requeueing if the maps are incorrect. If /rpm is used with no argument, "default" is chosen.
# As with the rest of the config, make sure this stays in the same general format if you modify it otherwise it may break.
# There MUST be a default config.
perfect-maps:
  default:
    - Well, Time, Sewer, Floating Islands, Iris
    - Well, Time, Floating Islands, Sewer, Iris
  noskip:
    - Space, Toilet, Sewer, Ravine, Iris
  balloons:
    - Well, Balloons, Sewer, Floating Islands, Iris
    - Well, Balloons, Floating Islands, Sewer, Iris
# Displayed in the discordlink command. Change if you wish.
discord-link: https://discord.gg/Sqbj9Nb835
# CHUNK CACHING IS DISABLED TEMPORARILY DUE TO THE RELEASE BREAKING IT
# THIS IS CURRENTLY NON-FUNCTIONAL
# Dropper Utilities can give your client a small portion of the world around you when you teleport to a new map, prior to receiving it from Hypixel over the network.
# This can reduce load times when switching between maps by ~175ms on my setup, it may vary for you.
# Chunks near teleportation spots are saved in the file chunks.json which is placed in the same folder as this program.
# Saved chunks are built up over time as you play maps, don't expect this to kick into action immediately.
# This feature is experimental and comes with a small risk of watchdog bans.
# A watchdog ban could occur if this program sends outdated chunks to your client, your client moves using the outdated blocks, and Hypixel picks up on the incorrect movement.
# This program does attempt to override cached chunks with Hypixel's chunks once they're received, so any incorrect movement should only last a small fraction of a second and be safe.
# If Hypixel updates dropper's maps, I recommend deleting the chunks.json file to reset saved chunks and prevent any potential conflict.
# I have tested this for a few hours and found no issues, but enable it at your own risk by changing "false" to "true" below, then restarting Dropper Utilities.
chunk-caching: false`