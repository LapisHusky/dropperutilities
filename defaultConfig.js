export default `# Config version, used to quickly validate the config and make sure it will have all of the necessary information in it. Do not change this unless you know what you're doing.
config-version: 2
# Port to host the server on. Usually you can leave this on 25565, which is Minecraft's default port.
server-port: 25565
# The server's host. Recommended to leave this on localhost.
server-host: localhost
# Perfect map configurations for automatic requeueing if the maps are incorrect. If /rpm is used with no argument, "default" is chosen.
# As with the rest of the config, make sure this stays in the same general format if you modify it otherwise it may break.
# There MUST be a default config.
perfect-maps:
  default:
    - Well, Time, Sewer, Floating Islands, Factory
    - Well, Time, Floating Islands, Sewer, Factory
  noskip:
    - Space, Toilet, Sewer, Ravine, Factory
  balloons:
    - Well, Balloons, Sewer, Floating Islands, Factory
    - Well, Balloons, Floating Islands, Sewer, Factory
# How far away a countdown must be from 7 seconds before it alerts if lobbyalerts are enabled. This is in milliseconds, 1000 = 1 second.
countdown-alert-threshold: 100
# Displayed in the discordlink command. Change if you wish.
discord-link: https://discord.gg/Sqbj9Nb835`