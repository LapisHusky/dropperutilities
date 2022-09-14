export const name = "takeownership"
export const aliases = ["to"]
export const allowedSources = ["party"]
export const description = "Gives you ownership of the party"
export const requireTrust = true
export async function run(usageInstance) {
  if (usageInstance.runnerUUID === usageInstance.clientHandler.userClient.trimmedUUID) {
    usageInstance.reply("§cYou can't do this!")
    return
  }
  usageInstance.reply(`§7Attempting to give you party ownership...`)
  usageInstance.clientHandler.partyChatThrottle.addToQueue(`/p transfer ${usageInstance.runnerUUID}`)
}