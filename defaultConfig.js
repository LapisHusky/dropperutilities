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
    - Well, Time, Sewer, Floating Islands, Iris
    - Well, Time, Floating Islands, Sewer, Iris
  noskip:
    - Space, Toilet, Sewer, Ravine, Iris
  balloons:
    - Well, Balloons, Sewer, Floating Islands, Iris
    - Well, Balloons, Floating Islands, Sewer, Iris
# Displayed in the discordlink command. Change if you wish.
discord-link: https://discord.gg/Sqbj9Nb835`