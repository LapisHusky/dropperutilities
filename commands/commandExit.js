import { saveData } from "../data/dataHandler.js"
//import { saveChunks } from "../data/chunkCacheHandler.js"

export const name = "exit"
export const aliases = ["quit", "end", "q"]
export const allowedSources = ["console"]
export const description = "Ends the proxy process"
export const requireTrust = true
export async function run(usageInstance) {
  usageInstance.reply("§7Exiting...")
  await saveData()
  //await saveChunks()
  process.exit()
}