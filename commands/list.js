export let list = []
export function commandListString(source, prefix) {
  let commands = list.filter(c => c.allowedSources.includes(source))
  commands = commands.sort((a, b) => a.name.localeCompare(b.name))
  return commands.map(c => prefix + c.name).join(", ")
}

import * as commandHelp from "./commandHelp.js"
list.push(commandHelp)
import * as commandHelp2 from "./commandHelp2.js"
list.push(commandHelp2)
import * as commandTogglecommands from "./commandTogglecommands.js"
list.push(commandTogglecommands)
import * as commandQueue from "./commandQueue.js"
list.push(commandQueue)
import * as commandAutoqueue from "./commandAutoqueue.js"
list.push(commandAutoqueue)
import * as commandRequireperfectmaps from "./commandRequireperfectmaps.js"
list.push(commandRequireperfectmaps)
import * as commandTakeownership from "./commandTakeownership.js"
list.push(commandTakeownership)
import * as commandTrust from "./commandTrust.js"
list.push(commandTrust)
import * as commandEval from "./commandEval.js"
list.push(commandEval)
import * as commandExit from "./commandExit.js"
list.push(commandExit)
import * as commandTps from "./commandTps.js"
list.push(commandTps)
import * as commandDiscordlink from "./commandDiscordlink.js"
list.push(commandDiscordlink)
import * as commandPing from "./commandPing.js"
list.push(commandPing)
import * as commandStatistics from "./commandStatistics.js"
list.push(commandStatistics)