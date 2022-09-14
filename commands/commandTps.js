export const name = "tps"
export const aliases = ["tickspersecond"]
export const allowedSources = ["slash", "party"]
export const description = "View an approximation of the server's ticks per second"
export const requireTrust = false
export async function run(usageInstance) {
  let serverAgeTracker = usageInstance.clientHandler.serverAgeTracker
  let shortTps = serverAgeTracker.getTps(5000)
  let mediumTps = serverAgeTracker.getTps(30000)
  let longTps = serverAgeTracker.getTps(120000)
  let coloredShortTps
  if (shortTps === null) {
    coloredShortTps = "§8?"
  } else {
    coloredShortTps = `§${getColorCode(shortTps)}${shortTps.toFixed(1)}`
  }
  let coloredMediumTps
  if (mediumTps === null) {
    coloredMediumTps = "§8?"
  } else {
    coloredMediumTps = `§${getColorCode(mediumTps)}${mediumTps.toFixed(1)}`
  }
  let coloredLongTps
  if (longTps === null) {
    coloredLongTps = "§8?"
  } else {
    coloredLongTps = `§${getColorCode(longTps)}${longTps.toFixed(1)}`
  }
  usageInstance.reply(`§7TPS from last 5s, 30s, 2m: ${coloredShortTps}§7, ${coloredMediumTps}§7, ${coloredLongTps}`)
}

function getColorCode(tps) {
  if (tps <= 13) return "c"
  if (tps <= 18) return "e"
  return "a"
}