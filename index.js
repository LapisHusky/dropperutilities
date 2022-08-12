process.on("unhandledRejection", (reason, promise) => {
  console.log("--- An error occurred, please report this to Lapis#7110 on Discord ---")
  console.error(reason)
  console.log("--- An error occurred, please report this to Lapis#7110 on Discord ---")
})

process.on("uncaughtException", (error, origin) => {
  if (error.code !== "CUSTOM_NOLOG") {
    console.log("--- An exception occurred, please report this to Lapis#7110 on Discord ---")
    console.error(error)
    console.log("--- An exception occurred, please report this to Lapis#7110 on Discord ---")
  }
  try {
    rl.close()
    proxy.destroy()
  } catch (error) {
    
  }
  //keep process alive so the window doesn't close if this is being ran in the .exe
  setInterval(() => {}, 9999999)
})

import "./hideWarning.js"
import { Proxy } from "./Proxy.js"
import readline from "readline"

if (process.stopExecution) {
  //something in the imports had an error, so don't start the proxy
  let errorThrowing = new Error()
  errorThrowing.code = "CUSTOM_NOLOG"
  throw errorThrowing
}

console.log("Starting proxy...")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
rl.on("line", handleLine)
rl.on("SIGINT", handleSigint)
function handleLine(line) {
  try {
    console.log(eval(line))
  } catch (error) {
    console.log(error)
  }
}
async function handleSigint() {
  rl.close()
  process.exit()
}

const proxy = new Proxy()