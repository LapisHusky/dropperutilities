import { handleCommand } from "../commands/handler.js"

export class PartyCommands {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.commandsActive = false

    this.bindEventListeners()
  }

  bindEventListeners() {
    this.proxyClient.on("packet", async (data, meta) => {
      if (!this.commandsActive) return
      let actualMessage
      if (meta.name === "chat") {
        if (data.position === 2) return
        actualMessage = data.message
      } else if (meta.name === "system_chat") {
        if ("type" in data && data.type !== 1) return
        if ("isActionBar" in data && data.isActionBar === true) return
        actualMessage = data.content
      } else return
      let parsedMessage
      try {
        parsedMessage = JSON.parse(actualMessage)
      } catch (error) {
        //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
        return
      }
      if (parsedMessage.extra?.length !== 2) return
      if (!parsedMessage.extra[0].text.startsWith("§9Party §8> ")) return
      let sender = parsedMessage.extra[0].clickEvent.value.substring(13)
      //trim UUID
      sender = sender.replaceAll("-", "")
      let message = parsedMessage.extra[1].text
      if (!message.startsWith("!")) return
      let string = message.substring(1)
      handleCommand(this.clientHandler, string, sender, "party", this.clientHandler.proxy)
    })
  }
}