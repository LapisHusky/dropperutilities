export class CustomCommands {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.bindModifiers()
  }

  bindModifiers() {
    this.clientHandler.outgoingModifiers.push(this.handleOutgoingPacket.bind(this))
  }

  handleOutgoingPacket(data, meta) {
    if (meta.name !== "chat") return
    let trim = data.message.trim()
    if (!trim.startsWith("/")) return
    let split = trim.substring(1).split(" ")
    let command = split[0].toLowerCase()
    let args = split.slice(1)
    if (command === "dropper" || command === "q" || command === "rq") {
      this.clientHandler.autoQueue.queueNewGame()
      return {
        type: "cancel"
      }
    }
    if (command === "togglecommands" || command === "tc") {
      this.clientHandler.partyCommands.commandsActive = !this.clientHandler.partyCommands.commandsActive
      this.userClient.write("chat", {
        position: 1,
        message: JSON.stringify({
          italic: false,
          extra: [
            {
              color: "gray",
              text: "Party chat commands are now "
            },
            {
              color: "red",
              text: this.clientHandler.partyCommands.commandsActive ? "enabled" : "disabled"
            },
            {
              color: "gray",
              text: "."
            }
          ],
          text: ""
        }),
        sender: "00000000-0000-0000-0000-000000000000"
      })
      return {
        type: "cancel"
      }
    }
  }
}