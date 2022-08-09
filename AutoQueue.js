export class AutoQueue {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler

    this.isQueueing = false
    this.queueInterval = null
    this.requirePerfectMaps = false
    this.perfectMaps = [
      "Well, Time, Sewer, Floating Islands, Factory",
      "Well, Time, Floating Islands, Sewer, Factory"
    ]
    this.autoRequeueEnabled = false
    this.reQueueTimeout = null
    this.reQueueTime = 50000

    this.bindEventListeners()
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
      if (this.autoRequeueEnabled) {
        this.reQueueTimeout = setTimeout(() => {
          this.queueNewGame()
        }, this.reQueueTime)
      }
    })
    this.stateHandler.on("state", state => {
      if (state !== "game") {
        this.endRequeueTimeout()
      }
    })
    this.proxyClient.on("chat", data => {
      if (data.position === 2) return
      let parsedMessage = JSON.parse(data.message)
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
