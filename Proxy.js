import { createServer } from "minecraft-protocol"
import { ClientHandler } from "./ClientHandler.js"
import faviconText from "./favicon.js"
import minecraftData from "minecraft-data"

export class Proxy {
  constructor() {
    this.proxyServer = createServer({
      "online-mode": true,
      keepAlive: false,
      version: false,
      port: 25565,
      host: "localhost",
      motd: "§a§lHypixel Dropper Proxy §7(Version 1.2)\n§bNow with a Tick Counter",
      favicon: faviconText,
      hideErrors: true,
      beforePing: this.handlePing.bind(this)
    })
    this.clientId = 0
    this.clients = new Map()

    this.destroyed = false
    
    this.bindEventListeners()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.proxyServer.close()
  }

  bindEventListeners() {
    this.proxyServer.on("connection", client => {
      client.once("set_protocol", data => {
        //check if newer than 1.18.2
        if (client.protocolVersion > 758) {
          client.incompatible = true
          if (data.nextState === 1) return
          console.log("A connection attempt was made with a newer Minecraft version than supported. Please use 1.8, 1.11, 1.12, 1.14, 1.15, 1.16, 1.17, or 1.18.\nSubversions (for example 1.18.2) are also supported.")
          client.end("§cYou're using a newer Minecraft version than currently supported.\nPlease use 1.8, 1.11, 1.12, 1.14, 1.15, 1.16, 1.17, or 1.18.\nSubversions (for example 1.18.2) are also supported.")
          return
        }
        //check if older than 1.8
        if (client.protocolVersion < 47) {
          client.incompatible = true
          if (data.nextState === 1) return
          console.log("A connection attempt was made with an older Minecraft version than supported. Please use 1.8, 1.11, 1.12, 1.14, 1.15, 1.16, 1.17, or 1.18.\nSubversions (for example 1.18.2) are also supported.")
          client.end("§cYou're using an older Minecraft version than currently supported.\nPlease use 1.8, 1.11, 1.12, 1.14, 1.15, 1.16, 1.17, or 1.18.\nSubversions (for example 1.18.2) are also supported.")
          return
        }
      
        let versionData = minecraftData(client.protocolVersion)
        if (versionData) {
          client.minecraftVersion = versionData.version.minecraftVersion
        } else {
          client.incompatible = true
          if (data.nextState === 1) return
          console.log("A connection attempt was made with an unsupported Minecraft version. Please use 1.8, 1.11, 1.12, 1.14, 1.15, 1.16, 1.17, or 1.18.\nSubversions (for example 1.18.2) are also supported.")
          client.end("§cYou're using an unsupported Minecraft version.\nPlease use 1.8, 1.11, 1.12, 1.14, 1.15, 1.16, 1.17, or 1.18.\nSubversions (for example 1.18.2) are also supported.")
          return
        }
        if (!["1.8", "1.11", "1.12", "1.14", "1.15", "1.16", "1.17", "1.18"].includes(versionData.version.majorVersion)) {
          client.incompatible = true
          if (data.nextState === 1) return
          client.end("§cHypixel doesn't support this Minecraft version.\nPlease use 1.8, 1.11, 1.12, 1.14, 1.15, 1.16, 1.17, or 1.18.\nSubversions (for example 1.18.2) are also supported.")
          return
        }
      })
    })
    this.proxyServer.on("login", userClient => {
      let handler = new ClientHandler(userClient, this, this.clientId)
      this.clients.set(this.clientId, handler)
      this.clientId++
    })
    this.proxyServer.on("error", error => {
      if (error.code === "EADDRINUSE") {
        console.log("Proxy was unable to start, port 25565 is already in use.")
        console.log("Make sure you don't have this already open in another window, and make sure you don't have any real Minecraft servers running on your computer.")
      } else {
        throw error
      }
    })
    this.proxyServer.on("listening", () => {
      console.log("Proxy started. You may now join localhost in Minecraft. Keep this window open in the background.")
    })
  }

  handlePing(response, client) {
    if (client.incompatible) {
      response.version.name = "1.8-1.8.9, 1.11-1.12.2, 1.14-1.18.2"
      response.version.protocol = -1
    }
    return response
  }

  removeClientHandler(id) {
    this.clients.delete(id)
  }
}