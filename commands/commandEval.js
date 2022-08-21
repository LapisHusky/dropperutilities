//import some common stuff for debugging
import * as trusted from "../data/trusted.js"
import * as identifierHandler from "../mojangApi/identifierHandler.js"
import * as dataHandler from "../data/dataHandler.js"
import * as commands from "./list.js"
import * as commandHandler from "./handler.js"
import * as utils from "../utils/utils.js"
import * as persistentFetch from "../utils/persistentFetch.js"

export const name = "eval"
export const aliases = ["js"]
export const allowedSources = ["console", "e"]
export const description = "Runs arbitrary javascript code"
export const requireTrust = true
export async function run(usageInstance) {
  let proxy = usageInstance.proxy
  //use console.log directly to bypass formatting
  try {
    console.log(eval(usageInstance.argsString))
  } catch (error) {
    console.log(error)
  }
}