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
import { TabListHandler } from "./internalModules/TabListHandler.js"
import { random64BitBigInt } from "./utils/utils.js"

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
    this.chunkPreloader = new ChunkPreloader(this)
    this.customModules = new CustomModules(this)
    this.tabListHandler = new TabListHandler(this)

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
  }

  sendClientMessage(content) {
    if (this.userClient.protocolVersion < 759) {
      this.userClient.write("chat", {
        position: 1,
        message: JSON.stringify(content),
        sender: "00000000-0000-0000-0000-000000000000"
      })
    } else if (this.userClient.protocolVersion < 760) {
      this.userClient.write("system_chat", {
        content: JSON.stringify(content),
        type: 1
      })
    } else {
      this.userClient.write("system_chat", {
        content: JSON.stringify(content),
        isActionBar: false
      })
    }
  }

  sendClientActionBar(content) {
    if (this.userClient.protocolVersion < 759) {
      this.userClient.write("chat", {
        position: 2,
        message: JSON.stringify(content),
        sender: "00000000-0000-0000-0000-000000000000"
      })
    } else if (this.userClient.protocolVersion < 760) {
      this.userClient.write("system_chat", {
        content: JSON.stringify(content),
        type: 2
      })
    } else {
      this.userClient.write("system_chat", {
        content: JSON.stringify(content),
        isActionBar: true
      })
    }
  }

  sendServerCommand(content) {
    if (this.userClient.protocolVersion < 759) {
      this.proxyClient.write("chat", {
        message: "/" + content
      })
    } else if (this.userClient.protocolVersion < 760) {
      this.proxyClient.write("chat_command", {
        command: content,
        timestamp: BigInt(Date.now()),
        salt: 0n,
        argumentSignatures: [],
        signedPreview: false
      })
    } else if (this.userClient.protocolVersion < 761) {
      this.proxyClient.write("chat_command", {
        command: content,
        timestamp: BigInt(Date.now()),
        salt: random64BitBigInt(),
        argumentSignatures: [],
        signedPreview: false,
        previousMessages: [],
        lastRejectedMessage: undefined
      })
    } else {
      this.proxyClient.write("chat_command", {
        command: content,
        timestamp: BigInt(Date.now()),
        salt: random64BitBigInt(),
        argumentSignatures: [],
        messageCount: 0,
        acknowledged: Buffer.alloc(3)
      })
    }
  }
}

