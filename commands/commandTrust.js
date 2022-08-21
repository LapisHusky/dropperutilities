import { isTrusted, addToTrusted, removeFromTrusted, getTrustedList } from "../data/trusted.js"
import { getName, getInfo } from "../mojangApi/identifierHandler.js"

export const name = "trust"
export const aliases = ["trusted"]
export const allowedSources = ["console", "slash", "party"]
export const description = "Configures or views the trusted user list"
export const requireTrust = false
export async function run(usageInstance) {
  if (usageInstance.args.length === 0) {
    usageInstance.reply(`§7Usage: ${usageInstance.prefix}trust list | ${usageInstance.prefix}trust add <user> | ${usageInstance.prefix}trust remove <user>.`)
    return
  }
  if (usageInstance.args[0] === "list") {
    let trustedList = getTrustedList()
    if (trustedList.length === 0) {
      usageInstance.reply(`§7There are no trusted users.`)
      return
    }
    let promises = trustedList.map(uuid => getName(uuid))
    let names
    try {
      names = await Promise.all(promises)
    } catch (error) {
      //as a backup, display UUIDs if name lookup failed
      usageInstance.reply(`§cUnable to fetch usernames. Trusted users: §c${trustedList.join(", ")}§7.`)
      return
    }
    usageInstance.reply(`§7Trusted users: §c${names.join(", ")}§7.`)
  } else if (usageInstance.args[0] === "add") {
    if (!usageInstance.runnerTrusted) {
      usageInstance.reply("§cYou don't have permission to add trusted users.")
      return
    }
    if (usageInstance.args.length < 2) {
      usageInstance.reply(`§7You must specify a user.`)
      return
    }
    let user = usageInstance.args[1]
    let info
    try {
      info = await getInfo(user)
    } catch (error) {
      usageInstance.reply(`§cUnable to fetch Mojang API data. Try again in a second.`)
      return
    }
    if (!info) {
      usageInstance.reply(`§cThat user does not exist.`)
      return
    }
    if (isTrusted(info.uuid)) {
      usageInstance.reply(`§c${info.name} is already trusted.`)
      return
    }
    addToTrusted(info.uuid)
    usageInstance.reply(`§7${info.name} is now trusted.`)
  } else if (usageInstance.args[0] === "remove") {
    if (!usageInstance.runnerTrusted) {
      usageInstance.reply("§cYou don't have permission to remove trusted users.")
      return
    }
    if (usageInstance.args.length < 2) {
      usageInstance.reply(`§7You must specify a user.`)
      return
    }
    let user = usageInstance.args[1]
    let info
    try {
      info = await getInfo(user)
    } catch (error) {
      usageInstance.reply(`§cUnable to fetch Mojang API data. Try again in a second.`)
      return
    }
    if (!info) {
      usageInstance.reply(`§cThat user does not exist.`)
      return
    }
    if (!isTrusted(info.uuid)) {
      usageInstance.reply(`§c${info.name} is not trusted.`)
      return
    }
    removeFromTrusted(info.uuid)
    usageInstance.reply(`§7${info.name} is no longer trusted.`)
  }
}