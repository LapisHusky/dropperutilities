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

process.on("unhandledRejection", (reason, promise) => {
  console.error(reason)
})

const proxy = new Proxy()