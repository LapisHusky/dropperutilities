import { config } from "./config/configHandler.js"

export class CountdownAlerts {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler
    this.partyChatThrottle = clientHandler.partyChatThrottle

    this.alertsEnabled = false
    this.alertThreshold = config["countdown-alert-threshold"]

    this.bindEventListeners()
  }

  sendChat(message) {
    this.partyChatThrottle.addToQueue("/pc " + message)
  }

  bindEventListeners() {
    this.stateHandler.on("time", (type, duration) => {
      if (type !== "drop") return
      if (!this.alertsEnabled) return
      if (Math.abs(duration - 7000) < this.alertThreshold) return
      let lobbyType = duration > 7000 ? "Laggy" : "Flame"
      let diff = Math.abs(duration - 7000)
      let seconds = Math.round(diff) / 1000
      this.sendChat(`${lobbyType} lobby detected; countdown time was ${seconds} seconds ${lobbyType === "Laggy" ? "longer": "shorter"} than normal.`)
    })
  }
}