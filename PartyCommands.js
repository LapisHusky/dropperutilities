import fs from "fs/promises"

let trusted = await fs.readFile("./trusted.txt", "utf8")
trusted = trusted.split("\n")
trusted = trusted.map(string => string.substring(0, 36))

export class PartyCommands {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.partyChatThrottle = clientHandler.partyChatThrottle

    this.bindEventListeners()
  }

  bindEventListeners() {
    this.proxyClient.on("chat", async (data) => {
      if (data.position === 2) return
      let parsedMessage = JSON.parse(data.message)
      if (parsedMessage.extra?.length !== 2) return
      if (!parsedMessage.extra[0].text.startsWith("§9Party §8> ")) return
      let sender = parsedMessage.extra[0].clickEvent.value.substring(13)
      let message = parsedMessage.extra[1].text.trim()
      let isTrusted = trusted.includes(sender)
      if (!message.startsWith("!")) return
      let fullCmd = message.substring(1)
      let split = fullCmd.split(" ")
      let command = split[0].toLowerCase()
      let args = split.slice(1)
      try {
        await this.handleCommand(command, args, sender, isTrusted)
      } catch (error) {
        console.log(error)
        try {
          this.sendChat("There was an error running that command.")
        } catch (error) {
          console.log(error)
        }
      }
    })
  }

  sendChat(message) {
    this.partyChatThrottle.addToQueue("/pc " + message)
  }
  
  async handleCommand(command, args, sender, isTrusted) {
    if (command === "h" || command === "help") {
      this.sendChat("Commands: !help (h), !requeuetime (rqt), !autorequeue (arq), !requireperfectmaps (rpm), !addtrust (at), !removetrust (rt), !requeue (rq), !takeownership (to), !lobbyalerts (la)")
      return
    }
    if (command === "rqt" || command === "requeuetime") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      if (args.length !== 1) {
        this.sendChat("Usage: !requeuetime <time in seconds (10-600)>")
        return
      }
      let time = parseInt(args[0])
      if (isNaN(time) || time < 10 || time > 600) {
        this.sendChat("Usage: !requeuetime <time in seconds (10-600)>")
        return
      }
      this.clientHandler.autoQueue.reQueueTime = time * 1000
      this.sendChat(`Set requeue time to ${time} seconds.`)
      return
    }
    if (command === "arq" || command === "autorequeue") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      this.clientHandler.autoQueue.autoRequeueEnabled = !this.clientHandler.autoQueue.autoRequeueEnabled
      this.sendChat(`Auto requeue is now ${this.clientHandler.autoQueue.autoRequeueEnabled ? "enabled" : "disabled"}.`)
      return
    }
    if (command === "rpm" || command === "requireperfectmaps") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      this.clientHandler.autoQueue.requirePerfectMaps = !this.clientHandler.autoQueue.requirePerfectMaps
      this.sendChat(`Perfect map requirement is now ${this.clientHandler.autoQueue.requirePerfectMaps ? "enabled" : "disabled"}.`)
      return
    }
    if (command === "at" || command === "addtrust") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      if (args.length !== 1) {
        this.sendChat("Usage: !addtrust <non-trimmed UUID>")
        return
      }
      let uuid = args[0]
      if (!/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(uuid)) {
        this.sendChat("Usage: !addtrust <non-trimmed UUID>")
        return
      }
      uuid = uuid.toLowerCase()
      if (!trusted.includes(uuid)) {
        await fs.appendFile("./trusted.txt", "\n" + uuid)
        trusted.push(uuid)
        this.sendChat(`${uuid} is now trusted.`)
      } else {
        this.sendChat(`${uuid} is already trusted.`)
      }
      return
    }
    if (command === "rt" || command === "removetrust") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      if (args.length !== 1) {
        this.sendChat("Usage: !removetrust <non-trimmed UUID>")
        return
      }
      let uuid = args[0]
      if (!/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(uuid)) {
        this.sendChat("Usage: !removetrust <non-trimmed UUID>")
        return
      }
      uuid = uuid.toLowerCase()
      if (trusted.includes(uuid)) {
        trusted = trusted.filter(string => string !== uuid)
        this.sendChat(`${uuid} is no longer trusted. Remove this user from the trusted users file manually.`)
      } else {
        this.sendChat(`${uuid} is not trusted.`)
      }
      return
    }
    if (command === "rq" || command === "requeue") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      this.sendChat("Requeuing...")
      this.clientHandler.autoQueue.queueNewGame()
      return
    }
    if (command === "to" || command === "takeownership") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      this.sendChat("Attempting to give you party ownership...")
      this.partyChatThrottle.addToQueue("/p transfer " + sender)
    }
    if (command === "la" || command === "lobbyalerts") {
      if (!isTrusted) {
        this.sendChat("You must be trusted to use this command.")
        return
      }
      this.clientHandler.countdownAlerts.alertsEnabled = !this.clientHandler.countdownAlerts.alertsEnabled
      this.sendChat(`Flame and laggy lobby alerts are now ${this.clientHandler.countdownAlerts.alertsEnabled ? "enabled" : "disabled"}. Alert threshold is 0.1 seconds.`)
      return
    }
  }
}