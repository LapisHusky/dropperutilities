import { getPlayerStats } from "../dropperApi/fullStats.js"
import { formatTime } from "../utils/utils.js"
import { mapDifficulties } from "../utils/mapDifficulties.js"

export const name = "statistics"
export const aliases = ["dropperstats", "dstats"]
export const allowedSources = ["slash"]
export const description = "Shows player's statistics in Dropper."
export const requireTrust = false
export async function run(usageInstance) {
  let username
  if (usageInstance.argsString !== "") {
    username = usageInstance.argsString
  } else {
    username = usageInstance.clientHandler.userClient.username
  }
  let playerStats = await getPlayerStats(username)
  if (!playerStats) {
    return "§7Player not found."
  }
  username = playerStats.username
  let message = `§9DropperUtilities > §c${username}§7's statistics: `
  message += `Wins: §a${playerStats.wins}§7, `
  message += `Fails: §c${playerStats.fails}§7, `
  message += `Games Finished: §a${playerStats.finishedGames}§7, `
  message += `Games Played: §a${playerStats.playedGames}§7, `
  message += `Flawless Games: §a${playerStats.flawlessGames}§7, `
  message += `Maps Completed: §a${playerStats.mapsCompleted}`
  if (playerStats.fastestGame) {
    message += `§7, Fastest Time: §a${formatTime(playerStats.fastestGame)}`
  }
  usageInstance.clientHandler.sendClientMessage(message)
  return //map stats are too big
  if (playerStats.maps.length === 0) {
    usageInstance.clientHandler.sendClientMessage("§9DropperUtilities > §7No map statistics recorded yet.")
    return
  }
  usageInstance.clientHandler.sendClientMessage("§9DropperUtilities > §7Map Statistics (hover):")
  let mapsByKey = {}
  for (let map of playerStats.maps) {
    let difficulty = mapDifficulties[map.name]
    let difficultyMaps = mapsByKey[difficulty]
    if (!difficultyMaps) {
      difficultyMaps = []
      mapsByKey[difficulty] = difficultyMaps
    }
    difficultyMaps.push(map)
  }
  for (let difficulty in mapsByKey) {
    let color = {
      "easy": "green",
      "medium": "yellow",
      "hard": "red",
      "undefined": "gray"
    }[difficulty]
    let colorCode = {
      "easy": "a",
      "medium": "e",
      "hard": "c",
      "undefined": "7"
    }[difficulty]
    let list = mapsByKey[difficulty]
    list = list.sort((a, b) => {
      if (a.name >= b.name) return 1
      return -1
    })
    let messageExtraList = []
    for (let i = 0; i < list.length; i++) {
      let mapData = list[i]
      let name = mapData.name
      let statsText = `§${colorCode}${name} §7statistics:\n`
      statsText += `Fastest time: §a${formatTime(mapData.time)}§7` //\n
      /*
      statsText += `Times completed: §a${stats.completed}§7\n`
      statsText += `Times skipped: §c${stats.skipped}`
      if (stats.fastestTime) {
        statsText += `§7\nFastest time: §a${formatTime(stats.fastestTime.value)}`
      }
      if (stats.fastestTicks) {
        statsText += `§7\nFastest ticks: §9${stats.fastestTicks.value}`
      }*/
      messageExtraList.push({
        text: `[${name}]`,
        color,
        hoverEvent: {
          action: "show_text",
          contents: statsText
        }
      })
      if (i < list.length - 1) {
        messageExtraList.push({
          text: ", ",
          color: "gray"
        })
      }
    }
    mapsByKey[difficulty] = messageExtraList
  }
  if (mapsByKey.easy) {
    usageInstance.clientHandler.sendClientMessage({
      text: "",
      extra: mapsByKey.easy
    })
  }
  if (mapsByKey.medium) {
    usageInstance.clientHandler.sendClientMessage({
      text: "",
      extra: mapsByKey.medium
    })
  }
  if (mapsByKey.hard) {
    usageInstance.clientHandler.sendClientMessage({
      text: "",
      extra: mapsByKey.hard
    })
  }
  if (mapsByKey.undefined) {
    usageInstance.clientHandler.sendClientMessage({
      text: "",
      extra: mapsByKey.undefined
    })
  }
}