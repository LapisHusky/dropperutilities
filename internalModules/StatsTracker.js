import { getPlayerStats, getGlobalStats, getMapStats } from "../data/stats.js"

let globalStats = getGlobalStats()

export class StatsTracker {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler
    this.playerStats = getPlayerStats(this.userClient.uuid)
    if (!this.clientHandler.disableTickCounter) this.tickCounter = clientHandler.tickCounter

    this.usesNewStatsFormat = this.userClient.protocolVersion >= 393 //old when less than 1.12.2, new when 1.14 or greater, can't test within 1.13 because hypixel doesn't support it. so i put the threshold as 1.13

    this.bindEventListeners()
  }

  bindEventListeners() {
    this.stateHandler.on("game", () => {
      globalStats.gamesPlayed++
      this.playerStats.gamesPlayed++
    })
    this.stateHandler.on("time", info => {
      //get next map stats to increment played count
      if (info.number !== 4) {
        let nextMapNumber
        if (info.type === "drop") {
          nextMapNumber = 0
        } else {
          nextMapNumber = info.number + 1
        }
        let nextMap
        nextMap = this.stateHandler.maps[nextMapNumber]
        let nextMapStats = getMapStats(nextMap)
        nextMapStats.played++
        globalStats.mapsPlayed++
        nextMapStats.difficulty = ["easy", "easy", "medium", "medium", "hard"][nextMapNumber]
      }

      globalStats.totalTime += info.duration
      if (info.type === "drop") {
        return
      }
      let mapStats = getMapStats(info.name)
      mapStats.totalTime += info.duration
      if (info.skipped) {
        mapStats.skipped++
        globalStats.mapsSkipped++
      } else {
        mapStats.completed++
        this.playerStats.mapsCompleted++
        globalStats.mapsCompleted++
        let newBestTime = false
        let newBestTicks = false
        if (mapStats.fastestTime === null || info.duration < mapStats.fastestTime.value) {
          if (mapStats.fastestTime !== null) newBestTime = true
          mapStats.fastestTime = {
            value: info.duration,
            time: Date.now()
          }
        }
        if (!this.disableTickCounter && (mapStats.fastestTicks === null || info.ticks < mapStats.fastestTicks.value)) {
          if (mapStats.fastestTicks !== null) newBestTicks = true
          mapStats.fastestTicks = {
            value: info.ticks,
            time: Date.now()
          }
        }
        if (newBestTime || newBestTicks) {
          let messageText
          if (newBestTime && newBestTicks) {
            messageText = "time & ticks"
          } else if (newBestTime) {
            messageText = "time"
          } else {
            messageText = "ticks"
          }
          let mapColor = ["green", "green", "yellow", "yellow", "red"][info.number]
          this.userClient.write("chat", {
            position: 1,
            message: JSON.stringify({
              text: "New best ",
              extra: [
                {
                  text: info.name,
                  color: mapColor
                },
                {
                  text: ` ${messageText}!`,
                  color: "light_purple"
                }
              ],
              color: "light_purple"
            }),
            sender: "00000000-0000-0000-0000-000000000000"
          })
        }
      }
    })
    this.stateHandler.on("gameEnd", info => {
      globalStats.gamesFinished++
      this.playerStats.gamesFinished++
      if (info.place === 0) {
        this.playerStats.wins++
        globalStats.wins++
      }
      if (this.playerStats.fastestHypixelTime === null || info.hypixelTime < this.playerStats.fastestHypixelTime) {
        this.playerStats.fastestHypixelTime = info.hypixelTime
      }
      if (info.fails === 0) {
        globalStats.flawlessGames++
        this.playerStats.flawlessGames++
      }
      let newBestTime = false
      let newBestTicks = false
      if (globalStats.fastestHypixelTime === null || info.hypixelTime < globalStats.fastestHypixelTime.value) {
        if (globalStats.fastestHypixelTime !== null) newBestTime = true
        globalStats.fastestHypixelTime = {
          value: info.hypixelTime,
          time: Date.now()
        }
      }
      if (globalStats.fastestRealTime === null || info.realTime < globalStats.fastestRealTime.value) {
        globalStats.fastestRealTime = {
          value: info.realTime,
          time: Date.now()
        }
      }
      if (!this.disableTickCounter && !info.hasSkip && (globalStats.fastestTicks === null || info.ticks < globalStats.fastestTicks.value)) {
        if (globalStats.fastestTicks !== null) newBestTicks = true
        globalStats.fastestTicks = {
          value: info.ticks,
          time: Date.now()
        }
      }
      if (newBestTime || newBestTicks) {
        let messageText
        if (newBestTime && newBestTicks) {
          messageText = "time & ticks"
        } else if (newBestTime) {
          messageText = "time"
        } else {
          messageText = "ticks"
        }
        this.userClient.write("chat", {
          position: 1,
          message: JSON.stringify({
            text: `New best ${messageText}!`,
            color: "light_purple"
          }),
          sender: "00000000-0000-0000-0000-000000000000"
        })
      }
    })
    this.stateHandler.on("fail", () => {
      globalStats.fails++
      this.playerStats.fails++
    })
    this.proxyClient.on("set_slot", data => {
      if (data.slot !== 44) return
      let item = data.item
      if (item.itemCount !== 1) return
      if (!item.nbtData) return
      let nbtData = item.nbtData
      if (nbtData.type !== "compound") return
      let nbtDataObject = nbtData.value
      if (nbtDataObject.display?.type !== "compound") return
      let nbtDisplayObject = nbtDataObject.display.value
      if (nbtDisplayObject.Lore?.type !== "list") return
      let loreObject = nbtDisplayObject.Lore.value
      if (loreObject.type !== "string") return
      let loreList = loreObject.value
      if (loreList.length !== 12) return
      let gamesPlayed, gamesFinished, flawlessGames, mapsCompleted, wins, fails, fastestTime
      if (this.usesNewStatsFormat) {
        let parsed
        try {
          parsed = loreList.map(JSON.parse)
        } catch (error) {
          return
        }
        if (loreList[0] !== '{"italic":false,"text":""}') return
        if (parsed[1].extra?.length !== 2) return
        if (parsed[1].extra[0].text !== "Games Played: ") return
        gamesPlayed = parseInt(parsed[1].extra[1].text)
        if (isNaN(gamesPlayed)) return
        if (parsed[2].extra?.length !== 2) return
        if (parsed[2].extra[0].text !== "Games Finished: ") return
        gamesFinished = parseInt(parsed[2].extra[1].text)
        if (isNaN(gamesFinished)) return
        if (parsed[3].extra?.length !== 2) return
        if (parsed[3].extra[0].text !== "Flawless Games: ") return
        flawlessGames = parseInt(parsed[3].extra[1].text)
        if (isNaN(flawlessGames)) return
        if (parsed[4].extra?.length !== 2) return
        if (parsed[4].extra[0].text !== "Maps Completed: ") return
        mapsCompleted = parseInt(parsed[4].extra[1].text)
        if (isNaN(mapsCompleted)) return
        if (loreList[5] !== '{"italic":false,"text":""}') return
        if (parsed[6].extra?.length !== 2) return
        if (parsed[6].extra[0].text !== "Wins: ") return
        wins = parseInt(parsed[6].extra[1].text)
        if (isNaN(wins)) return
        if (parsed[7].extra?.length !== 2) return
        if (parsed[7].extra[0].text !== "Fails: ") return
        fails = parseInt(parsed[7].extra[1].text)
        if (isNaN(fails)) return
        if (parsed[8].extra?.length !== 2) return
        if (parsed[8].extra[0].text !== "Fastest Game: ") return
        let timeText = parsed[8].extra[1].text
        let split = timeText.split(":")
        let minutes = parseInt(split[0])
        let seconds = parseInt(split[1])
        let milliseconds = parseInt(split[2])
        fastestTime = minutes * 60 * 1000 + seconds * 1000 + milliseconds
        if (loreList[9] !== '{"italic":false,"text":""}') return
        if (loreList[10] !== '{"italic":false,"extra":[{"color":"gray","text":""},{"color":"red","text":"WARNING: Statistics may be"}],"text":""}') return
        if (loreList[11] !== '{"italic":false,"extra":[{"color":"red","text":"reset at any time!"}],"text":""}') return
      } else {
        if (loreList[0] !== "") return
        if (!loreList[1].startsWith("§7Games Played: §a")) return
        gamesPlayed = parseInt(loreList[1].substring(18))
        if (isNaN(gamesPlayed)) return
        if (!loreList[2].startsWith("§7Games Finished: §a")) return
        gamesFinished = parseInt(loreList[2].substring(20))
        if (isNaN(gamesFinished)) return
        if (!loreList[3].startsWith("§7Flawless Games: §a")) return
        flawlessGames = parseInt(loreList[3].substring(20))
        if (isNaN(flawlessGames)) return
        if (!loreList[4].startsWith("§7Maps Completed: §a")) return
        mapsCompleted = parseInt(loreList[4].substring(20))
        if (isNaN(mapsCompleted)) return
        if (loreList[5] !== "") return
        if (!loreList[6].startsWith("§7Wins: §a")) return
        wins = parseInt(loreList[6].substring(10))
        if (isNaN(wins)) return
        if (!loreList[7].startsWith("§7Fails: §c")) return
        fails = parseInt(loreList[7].substring(11))
        if (isNaN(fails)) return
        if (!loreList[8].startsWith("§7Fastest Game: §e")) return
        let timeText = loreList[8].substring(18)
        let split = timeText.split(":")
        let minutes = parseInt(split[0])
        let seconds = parseInt(split[1])
        let milliseconds = parseInt(split[2])
        fastestTime = minutes * 60 * 1000 + seconds * 1000 + milliseconds
      }
      
      this.playerStats.synced = true
      this.playerStats.gamesPlayed = gamesPlayed
      this.playerStats.gamesFinished = gamesFinished
      this.playerStats.flawlessGames = flawlessGames
      this.playerStats.mapsCompleted = mapsCompleted
      this.playerStats.wins = wins
      this.playerStats.fails = fails
      this.playerStats.fastestHypixelTime = fastestTime
    })
  }
}