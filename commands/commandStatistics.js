import { getPlayerStats, getGlobalStats, getAllMapStats } from "../data/stats.js"
import { formatTime } from "../utils/utils.js"

let globalStats = getGlobalStats()
let mapStats = getAllMapStats()

export const name = "statistics"
export const aliases = ["dropperstats", "dstats"]
export const allowedSources = ["slash"]
export const description = "Shows you your statistics globally in Dropper and for specific maps."
export const requireTrust = false
export async function run(usageInstance) {
  let playerStats = getPlayerStats(usageInstance.clientHandler.userClient.uuid)
  if (!playerStats.synced) {
    usageInstance.clientHandler.userClient.write("chat", {
      position: 1,
      message: JSON.stringify({
        text: "§c§lWarning: Global stats may be innaccurate because they are not synced. Click the dropper NPC in the prototype lobby to sync your stats."
      }),
      sender: "00000000-0000-0000-0000-000000000000"
    })
  }
  let message = "§9DropperUtilities > §7Global statistics: "
  message += `Games Played: §a${playerStats.gamesPlayed}§7, `
  message += `Games Finished: §a${playerStats.gamesFinished}§7, `
  message += `Flawless Games: §a${playerStats.flawlessGames}§7, `
  message += `Maps Completed: §a${playerStats.mapsCompleted}§7, `
  message += `Wins: §a${playerStats.wins}§7, `
  message += `Fails: §c${playerStats.fails}`
  if (playerStats.fastestHypixelTime !== null) {
    message += `§7, Fastest Time: §a${formatTime(playerStats.fastestHypixelTime)}`
  }
  if (globalStats.fastestTicks !== null) {
    message += `§7, Fastest Ticks: §9${globalStats.fastestTicks.value}`
  }
  usageInstance.clientHandler.userClient.write("chat", {
    position: 1,
    message: JSON.stringify({
      text: message
    }),
    sender: "00000000-0000-0000-0000-000000000000"
  })

  if (Object.keys(mapStats).length === 0) {
    usageInstance.clientHandler.userClient.write("chat", {
      position: 1,
      message: JSON.stringify({
        text: "§9DropperUtilities > §7No map statistics recorded yet."
      }),
      sender: "00000000-0000-0000-0000-000000000000"
    })
    return
  }
  usageInstance.clientHandler.userClient.write("chat", {
    position: 1,
    message: JSON.stringify({
      text: "§9DropperUtilities > §7Map Statistics (hover):"
    }),
    sender: "00000000-0000-0000-0000-000000000000"
  })
  let mapsByKey = {}
  for (let mapName in mapStats) {
    let stats = mapStats[mapName]
    let bundledObject = {
      name: mapName,
      stats
    }
    let difficultyMaps = mapsByKey[stats.difficulty]
    if (!difficultyMaps) {
      difficultyMaps = []
      mapsByKey[stats.difficulty] = difficultyMaps
    }
    difficultyMaps.push(bundledObject)
  }
  for (let difficulty in mapsByKey) {
    let color = {
      "easy": "green",
      "medium": "yellow",
      "hard": "red"
    }[difficulty]
    let colorCode = {
      "easy": "a",
      "medium": "e",
      "hard": "c"
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
      let stats = mapData.stats
      let statsText = `§7Your §${colorCode}${name} §7statistics:\n`
      statsText += `Times played: §a${stats.played}§7\n`
      statsText += `Times completed: §a${stats.completed}§7\n`
      statsText += `Times skipped: §c${stats.skipped}`
      if (stats.fastestTime) {
        statsText += `§7\nFastest time: §a${formatTime(stats.fastestTime.value)}`
      }
      if (stats.fastestTicks) {
        statsText += `§7\nFastest ticks: §9${stats.fastestTicks.value}`
      }
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
    usageInstance.clientHandler.userClient.write("chat", {
      position: 1,
      message: JSON.stringify({
        text: "",
        extra: mapsByKey.easy
      }),
      sender: "00000000-0000-0000-0000-000000000000"
    })
  }
  if (mapsByKey.medium) {
    usageInstance.clientHandler.userClient.write("chat", {
      position: 1,
      message: JSON.stringify({
        text: "",
        extra: mapsByKey.medium
      }),
      sender: "00000000-0000-0000-0000-000000000000"
    })
  }
  if (mapsByKey.hard) {
    usageInstance.clientHandler.userClient.write("chat", {
      position: 1,
      message: JSON.stringify({
        text: "",
        extra: mapsByKey.hard
      }),
      sender: "00000000-0000-0000-0000-000000000000"
    })
  }
}