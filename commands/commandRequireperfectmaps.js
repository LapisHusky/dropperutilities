export const name = "requireperfectmaps"
export const aliases = ["rpm"]
export const allowedSources = ["slash", "party"]
export const description = "Toggles whether to automatically re-queue when maps aren't optimal"
export const requireTrust = true
export async function run(usageInstance) {
  let autoQueue = usageInstance.clientHandler.autoQueue
  autoQueue.requirePerfectMaps = !autoQueue.requirePerfectMaps
  usageInstance.reply(`§7Perfect map requirement is now §c${autoQueue.requirePerfectMaps ? "enabled" : "disabled"}§7.`)
}