import { formatTime } from "../utils/utils.js"

export class BetterGameInfo {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler
    if (!this.clientHandler.disableTickCounter) this.tickCounter = clientHandler.tickCounter

    this.sendInterval = null

    this.bindEventListeners()
    this.bindModifiers()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (meta.name === "chat") {
      if (data.position !== 2) return
      if (this.stateHandler.state === "game") return {
        type: "cancel"
      }
    }
    if (meta.name === "system_chat") {
      if (data.type !== 2 && !data.isActionBar) return
      if (this.stateHandler.state === "game") return {
        type: "cancel"
      }
    }
  }

  bindEventListeners() {
    this.stateHandler.on("state", state => {
      if (state === "game") {
        if (!this.sendInterval) {
          this.sendInterval = setInterval(() => {
            this.sendActionBar()
          }, 10)
        }
      } else {
        if (this.sendInterval) {
          clearInterval(this.sendInterval)
          this.sendInterval = null
        }
      }
    })
    if (!this.clientHandler.disableTickCounter) {
      this.tickCounter.on("tick", () => {
        this.sendActionBar()
      })
      this.tickCounter.on("tickReset", () => {
        this.sendActionBar()
      })
    }
  }

  sendActionBar() {
    let text = "§a"
    let state = this.stateHandler.gameState
    if (state === "waiting") {
      state = "Waiting"
    } else if (state === 5) {
      state = "Finished"
    }
    if (state === "Waiting") {
      text += "Countdown§8"
    } else if (state === "Finished") {
      text += "Finished§8"
    } else {
      text += "Map " + (state + 1) + "§8"
    }
    text += " -§f"
    let runTime
    if (state === "Finished") {
      if (this.stateHandler.totalTime !== null) {
        runTime = formatTime(this.stateHandler.totalTime)
      } else {
        //estimate the total time from a sum of each segment if we haven't gotten the chat message with Hypixel's time yet
        let totalTime = this.stateHandler.times.reduce((partialSum, a) => partialSum + a, 0)
        runTime = formatTime(totalTime)
      }
    } else if (state === "Waiting") {
      runTime = "00:00.000"
    } else {
      runTime = formatTime(performance.now() - this.stateHandler.startTime)
    }
    text += " Total Time: §a" + runTime + "§f"
    if (state === "Finished") {
      let realTime = this.stateHandler.realTime
      text += " Real Time: §a" + formatTime(realTime) + "§f"
    }
    if (state !== "Waiting" && state !== "Finished") {
      let mapTime = formatTime(performance.now() - this.stateHandler.lastSegmentTime)
      text += " Map Time: §a" + mapTime + "§f"
      if (!this.clientHandler.disableTickCounter) {
        text += " Ticks: §9" + this.tickCounter.currentTickCount + "§f"
      }
    } else if (state === "Finished" && !this.clientHandler.disableTickCounter) {
      text += " Ticks: §9" + this.tickCounter.tickCounts.reduce((partialSum, a) => partialSum + a, 0) + "§f"
    }
    this.clientHandler.sendClientActionBar({
      text
    })
  }
}