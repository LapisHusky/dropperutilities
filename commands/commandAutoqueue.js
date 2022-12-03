export const name = "autoqueue"
export const aliases = ["aq", "autorequeue", "arq"]
export const allowedSources = ["slash", "party"]
export const description = "Configures automatic re-queueing"
export const requireTrust = false
export async function run(usageInstance) {
  let autoQueue = usageInstance.clientHandler.autoQueue
  if (usageInstance.args.length === 0) {
    if (autoQueue.requeueOnFinish) {
      usageInstance.reply(`§7Automatic re-queueing is currently set to §crequeue on finish§7.`)
    } else if (autoQueue.requeueAfterTime) {
      usageInstance.reply(`§7Automatic re-queueing is currently set to §crequeue after ${autoQueue.reQueueTime / 1000} seconds§7.`)
    } else {
      usageInstance.reply(`§7Automatic re-queueing is currently §cdisabled§7.`)
    }
    if (usageInstance.runnerTrusted) {
      usageInstance.reply(`§7Usage: ${usageInstance.prefix}aq off | ${usageInstance.prefix}aq time <time in seconds> | ${usageInstance.prefix}aq finish.`)
    }
    return
  }
  if (!usageInstance.runnerTrusted) {
    usageInstance.reply("§cYou don't have permission to configure automatic requeueing.")
    return
  }
  if (usageInstance.args[0] === "off") {
    autoQueue.setConfig("off")
    usageInstance.reply(`§7Automatic re-queueing is now §cdisabled§7.`)
  } else if (usageInstance.args[0] === "time") {
    if (usageInstance.args.length < 2) {
      usageInstance.reply(`§7You must specify a time.`)
      return
    }
    let time = parseFloat(usageInstance.args[1])
    if (isNaN(time) || time < 10 || time > 600) {
      usageInstance.reply(`§7You must specify a valid time.`)
      return
    }
    autoQueue.setConfig("time", time * 1000)
    usageInstance.reply(`§7Automatic re-queueing is now set to §crequeue after ${time} seconds§7.`)
  } else if (usageInstance.args[0] === "finish") {
    autoQueue.setConfig("finish")
    usageInstance.reply(`§7Automatic re-queueing is now set to §crequeue on finish§7.`)
  } else {
    usageInstance.reply(`§cInvalid subcommand.`)
  }
}