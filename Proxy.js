import { createServer } from "minecraft-protocol"
import { ClientHandler } from "./ClientHandler.js"
import faviconText from "./favicon.js"

export class Proxy {
  constructor() {
    this.proxyServer = createServer({
      "online-mode": true,
      keepAlive: false,
      version: "1.16.1",
      port: 25565,
      host: "localhost",
      motd: "§a§lHypixel Dropper Proxy",
      favicon: faviconText
    })
    this.clientId = 0
    this.clients = new Map()
    
    this.bindEventListeners()
  }

  bindEventListeners() {
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

  removeClientHandler(id) {
    this.clients.delete(id)
  }
}