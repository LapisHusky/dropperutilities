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
    this.times = null //map1, map2, map3, map4, map5
    this.gameState = null
    this.totalTime = null
    this.lastFails = null
    this.hasSkip = null
    this.gameFails = null
    this.otherFinishCount = null
    this.realTime = null

    this.bindEventListeners()
  }

  //called from ClientHandler once tickCounter has been created
  //a weird system like this has to be used because of a circular dependency between stateHandler and tickCounter
  bindTickCounter() {
    this.tickCounter = this.clientHandler.tickCounter
  }

  bindEventListeners() {
    this.proxyClient.on("packet", (data, meta) => {
      let actualMessage
      if (meta.name === "chat") {
        if (data.position === 2) return
        actualMessage = data.message
      } else if (meta.name === "system_chat") {
        if ("type" in data && data.type !== 1) return
        if ("isActionBar" in data && data.isActionBar === true) return
        actualMessage = data.content
      } else return
      let parsedMessage
      try {
        parsedMessage = JSON.parse(actualMessage)
      } catch (error) {
        //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
        return
      }
      //my user joining a game
      checks: {
        if (this.state !== "none") break checks
        if (parsedMessage.extra?.length !== 14) break checks
        if (parsedMessage.extra[4].text !== " has joined (") break checks
        if (parsedMessage.extra[4].color !== "yellow") break checks
        this.setState("waiting")
      }
      //game started, map list
      checks: {
        //in rare cases, a join message can be sent after the game starts, meaning this won't work unless this check is removed
        //if (this.state !== "waiting") break checks
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

        this.startTime = performance.now()
        this.lastSegmentTime = this.startTime

        this.gameState = 0

        this.emit("drop")
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
        let timeText = parsedMessage.extra[3].text
        let split = timeText.split(":")
        let minutes = parseInt(split[0])
        let seconds = parseInt(split[1])
        let milliseconds = parseInt(split[2])
        let duration = minutes * 60000 + seconds * 1000 + milliseconds
        this.times.push(duration)
        this.lastSegmentTime = time

        let mapNumber = this.times.length - 1
        let mapName = this.maps[mapNumber]
        let mapDifficulty = ["easy", "easy", "medium", "medium", "hard"][mapNumber]
        let infoObject = {
          type: "map",
          number: mapNumber,
          name: mapName,
          difficulty: mapDifficulty,
          duration,
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
        if (parsedMessage.extra[0].color !== "green") break checks
        let timeText = parsedMessage.extra[1].text
        let split = timeText.split(":")
        let minutes = parseInt(split[0])
        let seconds = parseInt(split[1])
        let milliseconds = parseInt(split[2])
        let time = minutes * 60000 + seconds * 1000 + milliseconds
        this.totalTime = time

        let realTime = performance.now() - this.startTime
        this.realTime = realTime
        let infoObject = {
          hypixelTime: time,
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

        let mapNumber = this.times.length - 1
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
    this.proxyClient.on("packet", (data, meta) => {
      let actualMessage
      if (meta.name === "chat") {
        if (data.position !== 2) return
        actualMessage = data.message
      } else if (meta.name === "system_chat") {
        if (data.type !== 2 && !data.isActionBar) return
        actualMessage = data.content
      } else return
      let parsedMessage
      try {
        parsedMessage = JSON.parse(actualMessage)
      } catch (error) {
        //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
        return
      }
      //game info bar, checked for fail count
      checks: {
        if (this.state !== "game") break checks
        if (!parsedMessage.text.startsWith("§fMap Time: §a") && !parsedMessage.text.startsWith("§fTotal Time: §a")) break checks
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
      this.realTime = null
    }
  }
}