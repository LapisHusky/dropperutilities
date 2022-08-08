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
  }
}