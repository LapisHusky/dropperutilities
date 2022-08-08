import EventEmitter from "events"
import { createClient, states } from "minecraft-protocol"
import { CustomCommands } from "./CustomCommands.js"
import { AutoQueue } from "./AutoQueue.js"
import { StateHandler } from "./StateHandler.js"
import { PartyCommands } from "./PartyCommands.js"
import { PartyChatThrottle } from "./PartyChatThrottle.js"
import { TimeDetail } from "./TimeDetail.js"
import { CountdownAlerts } from "./CountdownAlerts.js"

export class ClientHandler extends EventEmitter {
  constructor(userClient, proxy, id) {
    super()

    this.userClient = userClient
    this.proxy = proxy
    this.id = id
    this.proxyClient = createClient({
      host: "mc.hypixel.net",
      username: userClient.username,
      keepAlive: false,
      version: "1.16.1",
      auth: "microsoft"
    })

    this.destroyed = false

    this.outgoingModifiers = []
    this.incomingModifiers = []

    this.stateHandler = new StateHandler(this)
    //previously used just for party chat, also used for party transfer now
    this.partyChatThrottle = new PartyChatThrottle(this)
    this.customCommands = new CustomCommands(this)
    this.autoQueue = new AutoQueue(this)
    this.partyCommands = new PartyCommands(this)
    this.timeDetail = new TimeDetail(this)
    this.countdownAlerts = new CountdownAlerts(this)

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
    userClient.on("end", () => {
      proxyClient.end()
      this.destroy()
    })
    proxyClient.on("end", () => {
      userClient.end()
    })
    userClient.on("error", () => {})
    proxyClient.on("error", () => {})
  }
}