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
  }

  removeClientHandler(id) {
    this.clients.delete(id)
  }
}