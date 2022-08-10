import EventEmitter from "events"

export class StateHandler extends EventEmitter {
  constructor(clientHandler) {
    super()

    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.state = "none"
    this.maps = null
    this.startTime = null
    this.lastSegmentTime = null
    this.times = null //waiting, map1, map2, map3, map4, map5
    this.gameState = null
    this.totalTime = null

    this.bindEventListeners()
  }

  bindEventListeners() {
    this.proxyClient.on("chat", data => {
      if (data.position === 2) return
      let parsedMessage = JSON.parse(data.message)
      //my user joining a game
      checks: {
        if (parsedMessage.extra?.length !== 14) break checks
        if (parsedMessage.extra[4].text !== " has joined (") break checks
        if (parsedMessage.extra[4].color !== "yellow") break checks
        this.setState("waiting")
      }
      //game started, map list
      checks: {
        if (parsedMessage.extra?.length !== 10) break checks
        if (parsedMessage.extra[0].text !== "Selected Maps: ") break checks
        if (parsedMessage.extra[0].color !== "gray") break checks
        let maps = [
          parsedMessage.extra[1].text,
          parsedMessage.extra[3].text,
          parsedMessage.extra[5].text,
          parsedMessage.extra[7].text,
          parsedMessage.extra[9].text
        ]
        this.maps = maps
        this.startTime = performance.now()
        this.lastSegmentTime = this.startTime
        this.times = []
        this.setState("game")
        this.gameState = "waiting"
      }
      //countdown done, glass open
      checks: {
        if (parsedMessage.extra?.length !== 1) break checks
        if (parsedMessage.text !== "") break checks
        if (parsedMessage.extra[0].text !== "DROP!") break checks
        if (parsedMessage.extra[0].bold !== true) break checks
        if (parsedMessage.extra[0].color !== "green") break checks
        let time = performance.now()
        let segmentDuration = time - this.lastSegmentTime
        this.lastSegmentTime = time
        this.times.push(segmentDuration)
        this.emit("time", "drop", segmentDuration)
        this.gameState = 1
      }
      //map completed
      checks: {
        if (parsedMessage.extra?.length !== 5) break checks
        if (parsedMessage.text !== "") break checks
        if (!parsedMessage.extra[0].text.startsWith("You finished Map ")) break checks
        if (parsedMessage.extra[0].color !== "gray") break checks
        let time = performance.now()
        let segmentDuration = time - this.lastSegmentTime
        this.lastSegmentTime = time
        this.times.push(segmentDuration)
        this.emit("time", this.times.length - 1, segmentDuration)
        this.gameState++
      }
      //game completed, used to extract Hypixel's time
      checks: {
        if (parsedMessage.extra?.length !== 3) break checks
        if (parsedMessage.text !== "") break checks
        if (parsedMessage.extra[0].text !== "You finished all maps in ") break checks
        if (parsedMessage.extra[0].color !== "gray") break checks
        let timeText = parsedMessage.extra[1].text
        let split = timeText.split(":")
        let minutes = parseInt(split[0])
        let seconds = parseInt(split[1])
        let milliseconds = parseInt(split[2])
        let time = minutes * 60 * 1000 + seconds * 1000 + milliseconds
        this.totalTime = time
      }
    })
    this.proxyClient.on("respawn", () => {
      this.setState("none")
    })
    this.clientHandler.on("destroy", () => {
      this.setState("none")
    })
  }

  setState(state) {
    if (this.state === state) return
    this.state = state
    this.emit("state", state)
    this.emit(state)
    if (state !== "game") {
      this.maps = null
      this.times = null
      this.gameState = null
      this.totalTime = null
    }
  }
}