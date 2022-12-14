import EventEmitter from "events"
import { createClient, states } from "minecraft-protocol"
import { CustomCommands } from "./internalModules/CustomCommands.js"
import { AutoQueue } from "./internalModules/AutoQueue.js"
import { StateHandler } from "./internalModules/StateHandler.js"
import { PartyCommands } from "./internalModules/PartyCommands.js"
import { PartyChatThrottle } from "./internalModules/PartyChatThrottle.js"
import { TimeDetail } from "./internalModules/TimeDetail.js"
import { BetterGameInfo } from "./internalModules/BetterGameInfo.js"
import { ConsoleLogger } from "./internalModules/ConsoleLogger.js"
import { TickCounter } from "./internalModules/TickCounter.js"
import { WorldTracker } from "./internalModules/WorldTracker.js"
import { ServerAgeTracker } from "./internalModules/ServerAgeTracker.js"
import { CustomModules } from "./internalModules/CustomModules.js"
import { ChunkPreloader } from "./internalModules/ChunkPreloader.js"
import { StatsTracker } from "./internalModules/StatsTracker.js"

/*//chunk scraping
//REMOVE LATER!!!!!!!!!!!!!!!
import fs from "fs/promises"
let chunks = JSON.parse(await fs.readFile("./chunks.json"))
let paintings = JSON.parse(await fs.readFile("./paintings.json"))
//REMOVE LATER!!!!!!!!!!!!!!!
*/

export class ClientHandler extends EventEmitter {
  constructor(userClient, proxy, id) {
    super()

    this.userClient = userClient
    this.proxy = proxy
    this.id = id
    this.proxyClient = createClient({
      host: "hypixel.net",
      username: userClient.username,
      keepAlive: false,
      version: userClient.protocolVersion,
      auth: "microsoft",
      hideErrors: true
    })

    //add trimmed UUIDs
    this.userClient.trimmedUUID = this.userClient.uuid.replaceAll("-", "")
    this.proxyClient.trimmedUUID = this.userClient.trimmedUUID

    this.destroyed = false

    this.outgoingModifiers = []
    this.incomingModifiers = []

    //due to issues with chunk parsing on 1.18, this does not currently support tick counting on 1.18.
    this.disableTickCounter = userClient.protocolVersion >= 757

    if (!this.disableTickCounter) this.worldTracker = new WorldTracker(this)
    this.stateHandler = new StateHandler(this)
    if (!this.disableTickCounter) {
      this.tickCounter = new TickCounter(this)
      this.stateHandler.bindTickCounter()
    }
    //previously used just for party chat, now it throttles every party command
    this.partyChatThrottle = new PartyChatThrottle(this)
    this.customCommands = new CustomCommands(this)
    this.autoQueue = new AutoQueue(this)
    this.partyCommands = new PartyCommands(this)
    this.timeDetail = new TimeDetail(this)
    this.betterGameInfo = new BetterGameInfo(this)
    this.consoleLogger = new ConsoleLogger(this)
    this.serverAgeTracker = new ServerAgeTracker(this)
    this.statsTracker = new StatsTracker(this)
    this.chunkPreloader = new ChunkPreloader(this)
    this.customModules = new CustomModules(this)

    this.bindEventListeners()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.proxy.removeClientHandler(this.id)
    this.emit("destroy")
  }

  bindEventListeners() {
    let userClient = this.userClient
    let proxyClient = this.proxyClient
    userClient.on("packet", (data, meta, buffer) => {
      let replaced = false
      for (let modifier of this.outgoingModifiers) {
        let result = modifier(data, meta)
        if (result) {
          let type = result.type
          if (type === "cancel") {
            return
          } else if (type === "replace") {
            data = result.data
            meta = result.meta
            replaced = true
          }
        }
      }
      if (replaced) {
        proxyClient.write(meta.name, data, meta)
      } else {
        proxyClient.writeRaw(buffer)
      }
    })
    proxyClient.on("packet", (data, meta, buffer) => {
      let replaced = false
      for (let modifier of this.incomingModifiers) {
        let result = modifier(data, meta)
        if (result) {
          let type = result.type
          if (type === "cancel") {
            return
          } else if (type === "replace") {
            data = result.data
            meta = result.meta
            replaced = true
          }
        }
      }
      if (meta.state !== states.PLAY) return
      if (replaced) {
        userClient.write(meta.name, data)
      } else {
        userClient.writeRaw(buffer)
      }
    })
    userClient.on("end", (reason) => {
      proxyClient.end()
      this.destroy()
    })
    proxyClient.on("end", (reason) => {
      userClient.end(`§cProxy lost connection to Hypixel: §r${reason}`)
    })
    userClient.on("error", () => {})
    proxyClient.on("error", () => {})
    //if the proxy client gets kicked while logging in, kick the user client
    proxyClient.once("disconnect", data => {
      userClient.write("kick_disconnect", data)
    })
    /*//chunk scraping
    //REMOVE LATER!!!!!!!!!!!!!!!
    let tempMap = new Map()
    let tempPaintings = new Map()
    proxyClient.on("map_chunk", (packet) => {
      if (packet.bitMap === 0) return
      if (this.stateHandler.state === "game") {
        chunks[packet.x + "," + packet.z] = {
          bitMap: packet.bitMap,
          chunkData: packet.chunkData.toString("base64")
        }
        return
      }
      tempMap.set(packet.x + "," + packet.z, {
        bitMap: packet.bitMap,
        chunkData: packet.chunkData.toString("base64")
      })
    })
    proxyClient.on("spawn_entity_painting", packet => {
      let position = packet.location.x + "," + packet.location.y + "," + packet.location.z + "," + packet.direction
      if (this.stateHandler.state === "game") {
        paintings[position] = packet.title
        return
      }
      tempPaintings.set(position, packet.title)
    })
    proxyClient.on("update_sign", packet => {
      if (this.stateHandler.state === "game") {
        let chunkData = chunks[Math.floor(packet.location.x / 16) + "," + Math.floor(packet.location.z / 16)]
        if (!chunkData) {
          console.log("alert a")
          return
        }
        let signs = chunkData.signs
        if (!signs) {
          signs = chunkData.signs = {}
        }
        signs[packet.location.x + "," + packet.location.y + "," + packet.location.z] = [packet.text1, packet.text2, packet.text3, packet.text4]
        return
      }
      let chunkData = tempMap.get(Math.floor(packet.location.x / 16) + "," + Math.floor(packet.location.z / 16))
      if (!chunkData) {
        console.log("alert b")
        return
      }
      let signs = chunkData.signs
      if (!signs) {
        signs = chunkData.signs = {}
      }
      signs[packet.location.x + "," + packet.location.y + "," + packet.location.z] = [packet.text1, packet.text2, packet.text3, packet.text4]
    })
    proxyClient.on("tile_entity_data", packet => {
      if (this.stateHandler.state === "game") {
        let chunkData = chunks[Math.floor(packet.location.x / 16) + "," + Math.floor(packet.location.z / 16)]
        if (!chunkData) {
          console.log("alert c")
          return
        }
        let tileData = chunkData.tileData
        if (!tileData) {
          tileData = chunkData.tileData = {}
        }
        tileData[packet.location.x + "," + packet.location.y + "," + packet.location.z] = {action: packet.action, nbtData: packet.nbtData}
        return
      }
      let chunkData = tempMap.get(Math.floor(packet.location.x / 16) + "," + Math.floor(packet.location.z / 16))
      if (!chunkData) {
        console.log("alert d")
        return
      }
      let tileData = chunkData.tileData
      if (!tileData) {
        tileData = chunkData.tileData = {}
      }
      tileData[packet.location.x + "," + packet.location.y + "," + packet.location.z] = {action: packet.action, nbtData: packet.nbtData}
    })
    proxyClient.on("login", () => {
      fs.writeFile("./chunks.json", JSON.stringify(chunks))
      tempMap.clear()
      fs.writeFile("./paintings.json", JSON.stringify(paintings))
      tempPaintings.clear()
    })
    this.stateHandler.on("game", () => {
      for (let [key, value] of tempMap.entries()) {
        chunks[key] = value
      }
      tempMap.clear()
      for (let [key, value] of tempPaintings.entries()) {
        paintings[key] = value
      }
      tempPaintings.clear()
    })
    //REMOVE LATER!!!!!!!!!!!!!!!
    */
    /*
    proxyClient.on("packet", (data, meta) => {
      return
      if (["map_chunk", "world_particles", "entity_head_rotation", "animation", "entity_teleport", "rel_entity_move", "player_info", "entity_equipment", "update_attributes", "update_metadata", "entity_move_look", "entity_velocity", "spawn_entity", "update_time", "entity_metadata", "scoreboard_team", "entity_look", "named_sound_effect", "entity_destroy"].includes(meta.name)) return
      console.log("incoming", meta.name, data)
    })
    userClient.on("packet", (data, meta) => {
      if ([].includes(meta.name)) return
      console.log("outgoing", meta.name, data)
    })
    */
    /*
    proxyClient.on("statistics", data => {
      console.log("statistics", data, JSON.stringify(data))
    })
    userClient.on("client_command", data => {
      console.log("client_command", data, JSON.stringify(data))
    })
    */
  }
}