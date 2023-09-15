import { config } from "../config/configHandler.js"

export const name = "discordlink"
export const aliases = ["dl", "disc"]
export const allowedSources = ["slash", "party", "console"]
export const description = "Shows you the dropper community Discord invite link or gives options to send it to others."
export const requireTrust = false
export async function run(usageInstance) {
  if (usageInstance.source === "slash") {
    if (usageInstance.clientHandler.userClient.version >= 573) {
      usageInstance.clientHandler.sendClientMessage({
        text: `§9DropperUtilities > §7Dropper community Discord: `,
        extra: [
          {
            text: "[Copy Link] ",
            clickEvent: {
              action: "copy_to_clipboard",
              value: config["discord-link"]
            },
            hoverEvent: {
              action: "show_text",
              contents: "Click to copy the invite link to your clipboard."
            },
            color: "white"
          },
          {
            text: "[Party Chat] ",
            clickEvent: {
              action: "run_command",
              value: `/pc ${config["discord-link"]}`
            },
            hoverEvent: {
              action: "show_text",
              contents: "Click to send the invite link in party chat."
            },
            color: "blue"
          },
          {
            text: "[Reply] ",
            clickEvent: {
              action: "run_command",
              value: `/r ${config["discord-link"]}`
            },
            hoverEvent: {
              action: "show_text",
              contents: "Click to reply in messages with the invite link."
            },
            color: "light_purple"
          }
        ]
      })
    } else {
      usageInstance.clientHandler.sendClientMessage({
        text: `§9DropperUtilities > §7Dropper community Discord: `,
        extra: [
          {
            text: "[Show Link] ",
            clickEvent: {
              action: "suggest_command",
              value: config["discord-link"]
            },
            hoverEvent: {
              action: "show_text",
              contents: "Click to put the invite link in chat. Ctrl + a, ctrl + c to copy."
            },
            color: "white"
          },
          {
            text: "[Party Chat] ",
            clickEvent: {
              action: "run_command",
              value: `/pc ${config["discord-link"]}`
            },
            hoverEvent: {
              action: "show_text",
              contents: "Click to send the invite link in party chat."
            },
            color: "blue"
          },
          {
            text: "[Reply] ",
            clickEvent: {
              action: "run_command",
              value: `/r ${config["discord-link"]}`
            },
            hoverEvent: {
              action: "show_text",
              contents: "Click to reply in messages with the invite link."
            },
            color: "light_purple"
          }
        ]
      })
    }
  } else {
    usageInstance.reply(`§7Dropper community Discord: §c${config["discord-link"]}`)
  }
}