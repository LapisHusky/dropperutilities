export class PartyChatThrottle {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.lastMessageTime = 0
    this.queue = []
    this.nextMessageTimeout = null
    this.throttleDelay = 250

    this.bindModifiers()
    this.bindEventListeners()
  }

  bindModifiers() {
    this.clientHandler.outgoingModifiers.push(this.handleOutgoingPacket.bind(this))
  }

  bindEventListeners() {
    this.clientHandler.on("destroy", () => {
      this.clearQueue()
    })
  }

  handleOutgoingPacket(data, meta) {
    if (meta.name !== "chat") return
    let trim = data.message.trim()
    if (!trim.startsWith("/")) return
    let split = trim.substring(1).split(" ")
    let command = split[0].toLowerCase()
    let args = split.slice(1)
    if (["pc", "pl", "party", "p"].includes(command)) {
      this.addToQueue(trim)
      return {
        type: "cancel"
      }
    }
  }

  clearQueue() {
    this.queue = []
    clearTimeout(this.nextMessageTimeout)
    this.nextMessageTimeout = null
  }

  addToQueue(command) {
    if (performance.now() - this.lastMessageTime > this.throttleDelay && this.queue.length === 0) {
      this.proxyClient.write("chat", {
        message: command
      })
      this.lastMessageTime = performance.now()
      return
    }
    this.queue.push(command)
    if (this.queue.length === 1) {
      this.nextMessageTimeout = setTimeout(() => {
        this.sendNextMessage()
      }, (this.lastMessageTime + this.throttleDelay) -performance.now())
    }
  }

  sendNextMessage() {
    if (this.queue.length === 0) return
    this.proxyClient.write("chat", {
      message: this.queue.shift()
    })
    this.lastMessageTime = performance.now()
    if (this.queue.length > 0) {
      this.nextMessageTimeout = setTimeout(() => {
        this.sendNextMessage()
      }, this.throttleDelay)
    }
  }
}