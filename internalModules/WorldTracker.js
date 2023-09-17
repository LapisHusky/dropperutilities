import prismarineChunkModule from "prismarine-chunk"
import Vec3 from "vec3"

export class WorldTracker {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.usesUnloadPacket = this.userClient.protocolVersion >= 107
    this.usesLargeChunks = this.userClient.protocolVersion >= 757
    this.usesNewPortalName = this.userClient.protocolVersion >= 393
    this.PrismarineChunk = prismarineChunkModule(this.userClient.minecraftVersion)

    this.chunks = new Map()

    this.bindEventListeners()
  }

  bindEventListeners() {
    this.proxyClient.on("respawn", () => {
      this.chunks.clear()
    })
    this.proxyClient.on("map_chunk", data => {
      let chunkId = data.x + "," + data.z
      if (data.groundUp && data.bitMap === 0) {
        this.chunks.delete(chunkId)
        return
      }
      //possibly the chunk should be updated or something? not sure if this will ever happen, but it's probably fine to ignore for the simple case of Dropper
      if (this.chunks.has(chunkId)) return
      let chunk
      if (this.usesLargeChunks) {
        chunk = new this.PrismarineChunk({
          minY: -64,
          worldHeight: 384
        })
      } else {
        chunk = new this.PrismarineChunk()
      }
      try {
        if ("bitMap" in data) {
          chunk.load(data.chunkData, data.bitMap)
        } else {
          chunk.load(data.chunkData)
        }
      } catch (error) {
        return
      }
      this.chunks.set(chunkId, chunk)
    })
    if (this.usesUnloadPacket) {
      this.proxyClient.on("unload_chunk", data => {
        let chunkId = data.chunkX + "," + data.chunkZ
        this.chunks.delete(chunkId)
      })
    }
  }

  isPortal(x, y, z) {
    let chunkX = Math.floor(x / 16)
    let chunkZ = Math.floor(z / 16)
    let chunkId = chunkX + "," + chunkZ
    let chunk = this.chunks.get(chunkId)
    if (!chunk) return false
    let block = chunk.getBlock(new Vec3(x & 0xF, y, z & 0xF))
    if (this.usesNewPortalName) {
      return block.name === "nether_portal"
    } else {
      return block.name === "portal"
    }
  }
}