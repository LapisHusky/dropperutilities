process.on("unhandledRejection", (reason, promise) => {
  console.log("--- An error occurred, please report this to Lapis#7110 on Discord ---")
  console.error(reason)
  console.log("--- An error occurred, please report this to Lapis#7110 on Discord ---")
})

process.on("uncaughtException", (error, origin) => {
  if (origin !== "uncaughtException") return
  console.log("--- An exception occurred, please report this to Lapis#7110 on Discord ---")
  console.error(error)
  console.log("--- An exception occurred, please report this to Lapis#7110 on Discord ---")
  //freeze process so the window doesn't close immediately
  while (1) {}
})

import "./hideWarning.js"
import { Proxy } from "./Proxy.js"
import readline from "readline"

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