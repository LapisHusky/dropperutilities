import EventEmitter from "events"
import { removeFormattingCodes } from "../utils/utils.js"

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
    this.lastFails = null
    this.hasSkip = null
    this.gameFails = null
    this.otherFinishCount = null

    this.bindEventListeners()
  }

  //called from ClientHandler once tickCounter has been created
  //a weird system like this has to be used because of a circular dependency between stateHandler and tickCounter
  bindTickCounter() {
    this.tickCounter = this.clientHandler.tickCounter
  }

  bindEventListeners() {
    this.proxyClient.on("chat", data => {
      if (data.position === 2) return
      let parsedMessage
      try {
        parsedMessage = JSON.parse(data.message)
      } catch (error) {
        //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
        return
      }
      //my user joining a game
      checks: {
        if (parsedMessage.extra?.length !== 14) break checks
        if (parsedMessage.extra[4].text !== " has joined (") break checks
        if (parsedMessage.extra[4].color !== "yellow") break checks
        this.setState("waiting")
      }
      //game started, map list
      checks: {
        if (this.state !== "waiting") break checks
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
        this.lastFails = 0
        this.hasSkip = false
        this.gameFails = 0
        this.otherFinishCount = 0
        this.setState("game")
        this.gameState = "waiting"
      }
      //countdown done, glass open
      checks: {
        if (this.state !== "game") break checks
        if (parsedMessage.extra?.length !== 1) break checks
        if (parsedMessage.text !== "") break checks
        if (parsedMessage.extra[0].text !== "DROP!") break checks
        if (parsedMessage.extra[0].bold !== true) break checks
        if (parsedMessage.extra[0].color !== "green") break checks
        let time = performance.now()
        //saved in a variable for info object
        let startTime = this.lastSegmentTime
        let segmentDuration = time - this.lastSegmentTime
        this.lastSegmentTime = time
        this.times.push(segmentDuration)

        let infoObject = {
          type: "drop",
          startTime,
          endTime: time,
          duration: segmentDuration
        }
        this.emit("time", infoObject)
        this.gameState = 1
      }
      //map completed
      checks: {
        if (this.state !== "game") break checks
        if (parsedMessage.extra?.length !== 5) break checks
        if (parsedMessage.text !== "") break checks
        if (!parsedMessage.extra[0].text.startsWith("You finished Map ")) break checks
        if (parsedMessage.extra[0].color !== "gray") break checks
        this.lastFails = 0
        let time = performance.now()
        //saved in a variable for info object
        let startTime = this.lastSegmentTime
        let segmentDuration = time - this.lastSegmentTime
        this.lastSegmentTime = time
        this.times.push(segmentDuration)

        let mapNumber = this.times.length - 2
        let mapName = this.maps[mapNumber]
        let mapDifficulty = ["easy", "easy", "medium", "medium", "hard"][mapNumber]
        let infoObject = {
          type: "map",
          number: mapNumber,
          name: mapName,
          difficulty: mapDifficulty,
          startTime,
          endTime: time,
          duration: segmentDuration,
          skipped: false
        }
        if (!this.clientHandler.disableTickCounter) {
          let ticks = this.tickCounter.hypixelMapEnd(mapNumber)
          infoObject.ticks = ticks
        }
        this.emit("time", infoObject)
        this.gameState++
      }
      //game completed, used to extract Hypixel's time
      checks: {
        if (this.state !== "game") break checks
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

        let localTime = this.times.reduce((partialSum, a) => partialSum + a, 0)
        let realTime = localTime - this.times[0]
        let infoObject = {
          hypixelTime: time,
          localTime,
          realTime,
          startTime: this.startTime,
          endTime: this.lastSegmentTime,
          hasSkip: this.hasSkip,
          fails: this.gameFails,
          place: this.otherFinishCount
        }
        if (!this.clientHandler.disableTickCounter) {
          infoObject.ticks = this.tickCounter.tickCounts.reduce((partialSum, a) => partialSum + a, 0)
        }
        this.emit("gameEnd", infoObject)
      }
      //map skipped
      checks: {
        if (this.state !== "game") break checks
        if (parsedMessage.extra?.length !== 3) break checks
        if (parsedMessage.text !== "") break checks
        if (!parsedMessage.extra[0].text.startsWith("You have skipped ahead to Map ")) break checks
        if (parsedMessage.extra[0].color !== "gray") break checks
        this.hasSkip = true
        this.lastFails = 0
        let time = performance.now()
        //saved in a variable for info object
        let startTime = this.lastSegmentTime
        let segmentDuration = time - this.lastSegmentTime
        this.lastSegmentTime = time
        this.times.push(segmentDuration)

        let mapNumber = this.times.length - 2
        let mapName = this.maps[mapNumber]
        let mapDifficulty = ["easy", "easy", "medium", "medium", "hard"][mapNumber]
        let infoObject = {
          type: "map",
          number: mapNumber,
          name: mapName,
          difficulty: mapDifficulty,
          startTime,
          endTime: time,
          duration: segmentDuration,
          skipped: true
        }
        if (!this.clientHandler.disableTickCounter) {
          let ticks = this.tickCounter.hypixelMapEnd(mapNumber)
          infoObject.ticks = ticks
        }
        this.emit("time", infoObject)
        this.gameState++
      }
      //another user finishing
      checks: {
        if (this.state !== "game") break checks
        if (!parsedMessage.extra) break checks
        if (parsedMessage.extra.length < 5) break checks
        if (parsedMessage.text !== "") break checks
        if (parsedMessage.extra[parsedMessage.extra.length - 1].text !== "!") break checks
        if (parsedMessage.extra[parsedMessage.extra.length - 1].color !== "gray") break checks
        if (parsedMessage.extra[parsedMessage.extra.length - 2].color !== "gold") break checks
        if (parsedMessage.extra[parsedMessage.extra.length - 3].text !== "finished all maps in ") break checks
        if (parsedMessage.extra[parsedMessage.extra.length - 3].color !== "gray") break checks
        this.otherFinishCount++
      }
    })
    this.proxyClient.on("chat", data => {
      if (data.position !== 2) return
      let parsedMessage
      try {
        parsedMessage = JSON.parse(data.message)
      } catch (error) {
        //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
        return
      }
      //game info bar, checked for fail count
      //this is not the best way to detect fails:
      //it's not instant, the game info bar only updates around every half second
      //if a skip ever exists for a hard level (e.g. if a new map is added) this may not detect when you fail at the end of that (assuming Hypixel counts fails at the end of the game)
      checks: {
        if (this.state !== "game") break checks
        if (!parsedMessage.text.startsWith("§fCurrent Time: §a")) break checks
        let split = parsedMessage.text.split(" ")
        if (split.length !== 6) break checks
        let last = split[split.length - 1]
        let noFormatting = removeFormattingCodes(last)
        let failCount = parseInt(noFormatting)
        if (failCount <= this.lastFails) break checks
        let difference = failCount - this.lastFails
        this.lastFails = failCount
        for (let i = 0; i < difference; i++) {
          this.emit("fail")
          this.gameFails++
        }
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
      this.startTime = null
      this.lastFails = null
      this.hasSkip = null
      this.gameFails = null
      this.otherFinishCount = null
    }
  }
}