import { data } from "./dataHandler.js"

let stats = data.stats
if (!stats) stats = data.stats = {
  players: {},
  maps: {},
  global: {
    gamesPlayed: 0,
    gamesFinished: 0,
    flawlessGames: 0,
    mapsCompleted: 0,
    mapsSkipped: 0,
    mapsPlayed: 0,
    wins: 0,
    fails: 0,
    fastestHypixelTime: null,
    fastestRealTime: null,
    fastestTicks: null,
    totalTime: 0
  }
}

export function getPlayerStats(uuid) {
  let playerStats = stats.players[uuid]
  if (!playerStats) {
    playerStats = {
      gamesPlayed: 0,
      gamesFinished: 0,
      flawlessGames: 0,
      mapsCompleted: 0,
      wins: 0,
      fails: 0,
      fastestHypixelTime: null,
      synced: false
    }
    stats.players[uuid] = playerStats
  }
  return playerStats
}

export function getGlobalStats() {
  return stats.global
}

export function getMapStats(map) {
  let mapStats = stats.maps[map]
  if (!mapStats) {
    mapStats = {
      played: 0,
      completed: 0,
      skipped: 0,
      fastestTime: null,
      fastestTicks: null,
      totalTime: 0
    }
    stats.maps[map] = mapStats
  }
  return mapStats
}

export function getAllMapStats() {
  return stats.maps
}