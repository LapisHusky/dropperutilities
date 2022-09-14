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
    this.proxyClient.on("chat", async (data) => {
      if (!this.commandsActive) return
      if (data.position === 2) return
      let parsedMessage
      try {
        parsedMessage = JSON.parse(data.message)
      } catch (error) {
        //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
        return
      }
      if (parsedMessage.extra?.length !== 2) return
      if (!parsedMessage.extra[0].text.startsWith("§9Party §8> ")) return
      let sender = parsedMessage.extra[0].clickEvent.value.substring(13)
      let message = parsedMessage.extra[1].text
      if (!message.startsWith("!")) return
      let string = message.substring(1)
      handleCommand(this.clientHandler, string, sender, "party", this.clientHandler.proxy)
    })
  }
}