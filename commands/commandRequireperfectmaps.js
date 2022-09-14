export const name = "requireperfectmaps"
export const aliases = ["rpm"]
export const allowedSources = ["slash", "party"]
export const description = "Toggles whether to automatically re-queue when maps aren't optimal"
export const requireTrust = true
export async function run(usageInstance) {
  let autoQueue = usageInstance.clientHandler.autoQueue
  if (autoQueue.requirePerfectMaps && !usageInstance.argsString) {
    autoQueue.disablePerfectMapRequirement()
    usageInstance.reply("§7Perfect map requirement is now §cdisabled§7.")
  } else {
    let configName = usageInstance.argsString
    if (configName) configName = configName.toLowerCase()
    let result = autoQueue.enablePerfectMapRequirement(configName)
    switch (result.status) {
      case "invalid": {
        usageInstance.reply("§7Invalid map config. Using default instead.")
        break
      }
      case "noinput": {
        if (usageInstance.source !== "slash") break
        usageInstance.reply("§7No map config entered. Using default.")
        break
      }
    }
    let mapLists = result.list
    mapLists = mapLists.map(string => {
      let splitMaps = string.split(", ")
      return `§a${splitMaps[0]}§7, §a${splitMaps[1]}§7, §e${splitMaps[2]}§7, §e${splitMaps[3]}§7, §c${splitMaps[4]}`
    })
    let text = mapLists.join("§7 or ")
    usageInstance.reply(`§7Perfect map requirement is now §cenabled§7 with maps ${text}§7.`)
  }
}