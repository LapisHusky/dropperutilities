export class CountdownAlerts {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler
    this.partyChatThrottle = clientHandler.partyChatThrottle

    this.alertsEnabled = false

    this.bindEventListeners()
  }

  sendChat(message) {
    this.partyChatThrottle.addToQueue("/pc " + message)
  }

  bindEventListeners() {
    this.stateHandler.on("time", (type, duration) => {
      if (type !== "drop") return
      if (!this.alertsEnabled) return
      if (Math.abs(duration - 7000) < 100) return //change 0 to 100
      let lobbyType = duration > 7000 ? "Laggy" : "Flame"
      let diff = Math.abs(duration - 7000)
      let seconds = Math.round(diff) / 1000
      this.sendChat(`${lobbyType} lobby detected; countdown time was ${seconds} seconds ${lobbyType === "Laggy" ? "slower": "faster"} than normal.`)
    })
  }
}