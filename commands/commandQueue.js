export const name = "queue"
export const aliases = ["requeue", "rq", "req", "q", "dropper"]
export const allowedSources = ["slash", "party"]
export const description = "Sends you to a game of Dropper"
export const requireTrust = true
export async function run(usageInstance) {
  usageInstance.clientHandler.autoQueue.queueNewGame()
  usageInstance.reply(`§7Queueing a game of Dropper...`)
}