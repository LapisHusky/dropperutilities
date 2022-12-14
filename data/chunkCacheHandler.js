import fs from "fs"
import fsPromises from "fs/promises"

export let chunks = {}
export let chunksFileWorking = false
try {
  let tempChunks = fs.readFileSync("./chunks.json", "utf8")
  tempChunks = JSON.parse(tempChunks)
  replaceChunks(tempChunks)
  chunksFileWorking = true
} catch (error) {
  console.log("No valid chunks.json found. Creating a new file. (Error code: " + error.code + ")")
  //create fresh data
  let tempChunks = {
    versions: {}
  }
  replaceChunks(tempChunks)
  try {
    fs.writeFileSync("./chunks.json", JSON.stringify(chunks, null, 2))
    chunksFileWorking = true
  } catch (error) {
    console.log("Unable to create chunks.json. (Error code: " + error.code + ")")
    console.log("Make sure this executable is being ran inside of a folder that it can write to.")
    console.log("Cached chunks will not be saved on restart.")
  }
}

export let saveInterval = setInterval(() => {
  saveChunks()
}, 60000)

export async function saveChunks() {
  JSON.stringify(chunks, null, 2)
  if (chunksFileWorking) await fsPromises.writeFile("./chunks.json", JSON.stringify(chunks, null, 2))
}

//replaces contents of data without replacing the reference so imports still work
function replaceChunks(newChunks) {
  for (let key in chunks) {
    delete chunks[key]
  }
  for (let key in newChunks) {
    chunks[key] = newChunks[key]
  }
}