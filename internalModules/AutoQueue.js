import { config } from "../config/configHandler.js"

let perfectMapsLists = config["perfect-maps"]

export class AutoQueue {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler

    this.isQueueing = false
    this.queueInterval = null
    this.requirePerfectMaps = false
    this.perfectMaps = null
    
    this.requeueAfterTime = false
    this.reQueueTimeout = null
    this.reQueueTime = 45000

    this.requeueOnFinish = false

    this.bindEventListeners()
  }

  disablePerfectMapRequirement() {
    this.requirePerfectMaps = false
  }

  enablePerfectMapRequirement(config) {
    let status
    let list = perfectMapsLists[config]
    if (list) {
      status = "success"
    } else {
      list = perfectMapsLists.default
      if (config) {
        status = "invalid"
      } else {
        status = "noinput"
      }
    }
    this.requirePerfectMaps = true
    this.perfectMaps = list
    return {
      status,
      list
    }
  }

  setConfig(type, value) {
    if (type === "off") {
      this.endRequeueTimeout()
      this.requeueAfterTime = false
      this.requeueOnFinish = false
    } else if (type === "time") {
      this.endRequeueTimeout()
      this.requeueAfterTime = true
      this.requeueOnFinish = false
      this.reQueueTime = value
      if (this.stateHandler.startTime !== null) {
        this.reQueueTimeout = setTimeout(() => {
          this.queueNewGame()
        //requeue after requeueTime - timeElapsed
        }, this.reQueueTime - (performance.now() - this.stateHandler.startTime))
      }
    } else if (type === "finish") {
      this.endRequeueTimeout()
      this.requeueAfterTime = false
      this.requeueOnFinish = true
    }
  }

  queueNewGame() {
    if (this.isQueueing) return
    this.isQueueing = true
    this.proxyClient.write("chat", {
      message: "/play prototype_dropper"
    })
    this.queueInterval = setInterval(() => {
      this.proxyClient.write("chat", {
        message: "/play prototype_dropper"
      })
    }, 5200)
  }

  stopQueueing() {
    if (!this.isQueueing) return
    this.isQueueing = false
    clearInterval(this.queueInterval)
    this.queueInterval = null
  }

  endRequeueTimeout() {
    if (!this.reQueueTimeout) return
    clearTimeout(this.reQueueTimeout)
    this.reQueueTimeout = null
  }

  bindEventListeners() {
    this.stateHandler.on("waiting", () => {
      this.stopQueueing()
    })
    this.stateHandler.on("game", () => {
      if (this.requirePerfectMaps) {
        if (!this.perfectMaps.includes(this.stateHandler.maps.join(", "))) {
          this.queueNewGame()
          return
        }
      }
    })
    this.stateHandler.on("drop", () => {
      if (this.requeueAfterTime) {
        this.reQueueTimeout = setTimeout(() => {
          this.queueNewGame()
        }, this.reQueueTime)
      }
    })
    this.stateHandler.on("gameEnd", () => {
      if (this.requeueOnFinish) {
        this.queueNewGame()
      }
    })
    this.stateHandler.on("state", state => {
      if (state !== "game") {
        this.endRequeueTimeout()
      }
    })
    this.proxyClient.on("chat", data => {
      if (data.position === 2) return
      let parsedMessage
      try {
        parsedMessage = JSON.parse(data.message)
      } catch (error) {
        //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
        return
      }
      checks: {
        if (parsedMessage.extra?.length < 3) break checks
        if (parsedMessage.text !== "Your party can't queue for ") break checks
        if (parsedMessage.color !== "red") break checks
        if (parsedMessage.extra[parsedMessage.extra.length - 1].text !== "isn't online!") break checks
        this.proxyClient.write("chat", {
          message: "/p kickoffline"
        })
      }
    })
    this.clientHandler.on("destroy", () => {
      this.stopQueueing()
    })
  }
}
