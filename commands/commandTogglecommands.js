export const name = "togglecommands"
export const aliases = ["tc", "partychatcommands", "pccommands", "togglecmds"]
export const allowedSources = ["slash"]
export const description = "Toggles whether commands are active in party chat"
export const requireTrust = true
export async function run(usageInstance) {
  let partyCommands = usageInstance.clientHandler.partyCommands
  partyCommands.commandsActive = !partyCommands.commandsActive
  usageInstance.reply(`§7Party chat commands are now §c${partyCommands.commandsActive ? "enabled" : "disabled"}§7.`)
}