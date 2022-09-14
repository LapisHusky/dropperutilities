//import some common stuff for debugging
import * as trustedImport from "../data/trusted.js"
import * as identifierHandlerImport from "../mojangApi/identifierHandler.js"
import * as dataHandlerImport from "../data/dataHandler.js"
import * as commandsImport from "./list.js"
import * as commandHandlerImport from "./handler.js"
import * as utilsImport from "../utils/utils.js"
import * as persistentFetchImport from "../utils/persistentFetch.js"

export const name = "eval"
export const aliases = ["js"]
export const allowedSources = ["console", "e"]
export const description = "Runs arbitrary javascript code"
export const requireTrust = true
export async function run(usageInstance) {
  //put stuff into variables so eval can see it
  let trusted = trustedImport
  let identifierHandler = identifierHandlerImport
  let dataHandler = dataHandlerImport
  let commands = commandsImport
  let commandHandler = commandHandlerImport
  let utils = utilsImport
  let persistentFetch = persistentFetchImport
  let proxy = usageInstance.proxy
  //use console.log directly to bypass formatting
  try {
    console.log(eval(usageInstance.argsString))
  } catch (error) {
    console.log(error)
  }
}