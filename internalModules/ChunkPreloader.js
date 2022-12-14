import { chunks } from "../data/chunkCacheHandler.js"
import { serialize, deserialize } from "v8"
import { deflateRawSync, inflateRawSync } from "zlib"
import { config } from "../config/configHandler.js"

export class ChunkPreloader {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.active = false

    this.loadedChunks = new Set()

    this.chunkData = chunks.versions[this.userClient.protocolVersion]
    if (!this.chunkData) this.chunkData = chunks.versions[this.userClient.protocolVersion] = {}

    this.lastTpChunkX = null
    this.lastTpChunkZ = null

    this.bindModifiers()
    this.bindEventListeners()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (meta.name === "map_chunk") {
      let key = data.x + "," + data.z
      if (data.bitMap === 0) {
        this.loadedChunks.delete(key)
        return
      }
      this.loadedChunks.add(key)
      if (!this.active) return
      if (Math.abs(data.x - this.lastTpChunkX) > 1 || Math.abs(data.z - this.lastTpChunkZ) > 1) return //only save chunks near teleportation spots
      this.chunkData[key] = serializeChunkData(data)
    }
    if (meta.name === "unload_chunk") {
      let key = data.x + "," + data.z
      this.loadedChunks.delete(key)
    }
    if (meta.name === "position") {
      let chunkX = Math.floor(data.x / 16)
      let chunkZ = Math.floor(data.z / 16)
      this.lastTpChunkX = chunkX
      this.lastTpChunkZ = chunkZ
      if (!this.active || !config["chunk-caching"]) return
      for (let relativeX = -1; relativeX <= 1; relativeX++) {
        for (let relativeZ = -1; relativeZ < 1; relativeZ++) {
          let key = (chunkX + relativeX) + "," + (chunkZ + relativeZ)
          let data = this.chunkData[key]
          if (!data) continue
          if (this.loadedChunks.has(key)) continue
          this.loadedChunks.add(key)
          data = deserializeChunkData(data)
          this.userClient.write("map_chunk", data)
        }
      }
    }
    if (meta.name === "login") {
      this.loadedChunks.clear()
    }
  }

  bindEventListeners() {
    this.clientHandler.stateHandler.on("game", () => {
      setTimeout(() => {
        if (this.clientHandler.stateHandler.state !== "game") return
        this.active = true
      }, 1000)
    })
    this.clientHandler.stateHandler.on("state", (state) => {
      if (state !== "game") this.active = false
    })
  }
}

function serializeChunkData(data) {
  return deflateRawSync(serialize(data)).toString("base64")
}

function deserializeChunkData(data) {
  return deserialize(inflateRawSync(Buffer.from(data, "base64")))
}