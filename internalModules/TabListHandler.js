import { config } from "../config/configHandler.js"
import { getStats } from "../dropperApi/statsHandler.js"
import { randomString } from "../utils/utils.js"

let enabled = config["fetch-player-stats"]

export class TabListHandler {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.stateHandler = this.clientHandler.stateHandler

    this.teams = new Map()
    this.players = new Map()
    this.teamOverrides = new Map()

    if (enabled) {
      this.bindModifiers()
      this.bindEventListeners()
    }
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (meta.name === "teams" || meta.name === "scoreboard_team") {
      return this.handleTeamPacket(data, meta)
    }
  }

  bindEventListeners() {
    this.proxyClient.on("player_info", data => {
      let action = data.action
      for (let playerInfo of data.data) {
        if (this.userClient.protocolVersion < 761 && action === 4) {
          this.players.delete(playerInfo.UUID) //always uppercase UUID for versions < 761
          if (this.teamOverrides.has(playerInfo.UUID)) {
            this.removeTeamOverride(playerInfo.UUID)
          }
        } else {
          let object
          if (playerInfo.uuid) {
            object = this.players.get(playerInfo.uuid)
          } else {
            object = this.players.get(playerInfo.UUID)
          }
          if (!object) object = {}
          if (playerInfo.player !== undefined) object.player = playerInfo.player
          if (playerInfo.chatSession !== undefined) object.chatSession = playerInfo.chatSession
          if (playerInfo.gamemode !== undefined) object.gamemode = playerInfo.gamemode
          if (playerInfo.uuid !== undefined) object.uuid = playerInfo.uuid
          if (playerInfo.UUID !== undefined) object.uuid = playerInfo.UUID //use lowercase anyways
          if (playerInfo.listed !== undefined) object.listed = playerInfo.listed
          if (playerInfo.latency !== undefined) object.latency = playerInfo.latency
          if (playerInfo.displayName !== undefined) object.displayName = playerInfo.displayName
          if (playerInfo.name !== undefined) object.name = playerInfo.name
          if (playerInfo.properties !== undefined) object.properties = playerInfo.properties
          if (playerInfo.ping !== undefined) object.ping = playerInfo.ping
          if (playerInfo.crypto !== undefined) object.crypto = playerInfo.crypto
          if (playerInfo.ping > 1 || playerInfo.latency > 1) object.hadPing = true
          this.players.set(object.uuid, object)
        }
      }
      if (this.stateHandler.state === "waiting") this.checkPlayerList()
    })
    this.proxyClient.on("player_remove", data => {
      for (let uuid of data.players) {
        this.players.delete(uuid)
        if (this.teamOverrides.has(uuid)) {
          this.removeTeamOverride(uuid)
        }
      }
    })
    this.stateHandler.on("state", state => {
      if (state === "waiting") {
        this.checkPlayerList()
      } else {
        for (let key of this.teamOverrides.keys()) {
          this.removeTeamOverride(key)
        }
      }
    })
  }

  handleTeamPacket(data, meta) {
    let team = data.team
    let mode = data.mode
    switch (mode) {
      case 0: {
        let object = {}
        if ("name" in data) object.name = data.name
        if ("prefix" in data) object.prefix = data.prefix
        if ("suffix" in data) object.suffix = data.suffix
        if ("friendlyFire" in data) object.friendlyFire = data.friendlyFire
        if ("nameTagVisibility" in data) object.nameTagVisibility = data.nameTagVisibility
        if ("collisionRule" in data) object.collisionRule = data.collisionRule
        if ("color" in data) object.color = data.color
        if ("formatting" in data) object.formatting = data.formatting
        if ("players" in data && data.players) {
          object.players = data.players
        } else {
          object.players = []
        }
        this.teams.set(team, object)
        break
      }
      case 1: {
        let existing = this.teams.get(team)
        this.teams.delete(team)
        if (existing) {
          for (let player of existing.players) {
            let uuid = null
            for (let [key, value] of this.teamOverrides.entries()) {
              if (value.username === player) uuid = key
            }
            if (uuid) {
              this.replaceTeamOverride(uuid)
            }
          }
        }
        break
      }
      case 2: {
        let object = this.teams.get(team)
        if ("name" in data) object.name = data.name
        if ("prefix" in data) object.prefix = data.prefix
        if ("suffix" in data) object.suffix = data.suffix
        if ("friendlyFire" in data) object.friendlyFire = data.friendlyFire
        if ("nameTagVisibility" in data) object.nameTagVisibility = data.nameTagVisibility
        if ("collisionRule" in data) object.collisionRule = data.collisionRule
        if ("color" in data) object.color = data.color
        if ("formatting" in data) object.formatting = data.formatting
        if ("players" in data && data.players) object.players = data.players //should never happen, players only sent in 0, 3, and 4
        for (let player of object.players) {
          let uuid = null
          for (let [key, value] of this.teamOverrides.entries()) {
            if (value.username === player) uuid = key
          }
          if (uuid) {
            this.replaceTeamOverride(uuid)
          }
        }
        break
      }
      case 3: {
        let object = this.teams.get(team)
        object.players.push(...data.players)
        let playersToRemove = []
        for (let player of data.players) {
          let uuid = null
          for (let [key, value] of this.teamOverrides.entries()) {
            if (value.username === player) uuid = key
          }
          if (uuid) {
            this.replaceTeamOverride(uuid)
            playersToRemove.push(player)
          }
        }
        if (playersToRemove.length) {
          for (let player of playersToRemove) {
            data.players.splice(data.players.indexOf(player), 1)
          }
          return {
            type: "replace",
            meta,
            data
          }
        }
        break
      }
      case 4: {
        let object = this.teams.get(team)
        for (let player of data.players) {
          object.players.splice(object.players.indexOf(player), 1)
          let uuid = null
          for (let [key, value] of this.teamOverrides.entries()) {
            if (value.username === player) uuid = key
          }
          if (uuid) {
            this.replaceTeamOverride(uuid)
          }
        }
        break
      }
    }
  }

  getActualPlayers() {
    let players = []
    for (let player of this.players.values()) {
      if (!player.gamemode) continue
      if ("displayName" in player) continue
      if (player.hadPing) continue
      if (player.uuid[14] !== "4") {
        this.nickedPlayer(player.uuid)
        continue
      }
      players.push(player.uuid)
    }
    return players
  }

  checkPlayerList() {
    let list = this.getActualPlayers()
    for (let uuid of list) {
      if (this.teamOverrides.has(uuid)) continue
      (async () => {
        let userData = await getStats(uuid)
        if (this.stateHandler.state !== "waiting") return
        if (!this.players.has(uuid)) return
        if (this.teamOverrides.has(uuid)) return
        let player = this.players.get(uuid)
        if (!player) return
        let username
        if (player.player) {
          username = player.player.name
        } else {
          username = player.name
        }
        this.addTeamOverride(uuid, username, userData)
      })()
    }
  }

  nickedPlayer(uuid) {
    if (this.stateHandler.state !== "waiting") return
    if (this.teamOverrides.has(uuid)) return
    let player = this.players.get(uuid)
    if (!player) return
    let username
    if (player.player) {
      username = player.player.name
    } else {
      username = player.name
    }
    this.addTeamOverride(uuid, username, {nicked: true})
  }

  addTeamOverride(uuid, username, data) {
    let colorCode
    let colorName
    let colors = new Map([
      [20000, {color: "§1", formattedColor: "dark_blue"}],
      [15000, {color: "§9", formattedColor: "blue"}],
      [10000, {color: "§5", formattedColor: "dark_purple"}],
      [5000, {color: "§d", formattedColor: "light_purple"}],
      [3000, {color: "§3", formattedColor: "dark_aqua"}],
      [2000, {color: "§b", formattedColor: "aqua"}],
      [1500, {color: "§4", formattedColor: "dark_red"}],
      [1000, {color: "§c", formattedColor: "red"}],
      [500, {color: "§6", formattedColor: "gold"}],
      [250, {color: "§e", formattedColor: "yellow"}],
      [100, {color: "§2", formattedColor: "dark_green"}],
      [50, {color: "§a", formattedColor: "green"}],
      [0, {color: "§f", formattedColor: "white"}],
    ])
    for (let [key, value] of colors) {
      if (data.wins >= key) {
        colorCode = value.color
        colorName = value.formattedColor
        break
      }
    }
    let orderingNums
    let serverTeamValue = null
    for (let [key, value] of this.teams.entries()) {
      if (value.players.includes(username)) {
        orderingNums = key.substring(0, 3)
        serverTeamValue = value
        if (this.userClient.protocolVersion < 107) {
          this.userClient.write("scoreboard_team", {
            team: key,
            mode: 4,
            players: [username]
          })
        } else {
          this.userClient.write("teams", {
            team: key,
            mode: 4,
            players: [username]
          })
        }
      }
    }
    let newTeamKey = (orderingNums || "") + randomString(13)
    if (this.userClient.protocolVersion < 107) {
      let extraText
      if (data.nicked) {
        extraText = "§c NICKED"
      } else {
        extraText = "§8 [" + colorCode + data.wins.toString() +"§8]"
      }
      let newSuffix
      if (serverTeamValue?.suffix) {
        newSuffix = serverTeamValue.suffix + extraText
      } else {
        newSuffix = extraText
      }
      this.userClient.write("scoreboard_team", {
        team: newTeamKey,
        mode: 0,
        name: newTeamKey,
        prefix: serverTeamValue?.prefix || "",
        suffix: newSuffix,
        friendlyFire: 3,
        nameTagVisibility: "always",
        color: 15,
        players: [username]
      })
    } else {
      let newSuffix
      let extraObject
      if (data.nicked) {
        extraObject = {
          color: "red",
          text: " NICKED"
        }
      } else {
        extraObject = {
          color: colorName,
          text: "§8 [" + colorCode + data.wins.toString() + "§8]"
        }
      }
      if (serverTeamValue?.suffix) {
        let parsed = JSON.parse(serverTeamValue.suffix)
        if (parsed.extra) {
          parsed.extra.push(extraObject)
        } else {
          parsed.extra = [extraObject]
        }
        newSuffix = JSON.stringify(parsed)
      } else {
        newSuffix = JSON.stringify({
          italic: false,
          text: "",
          extra: [extraObject]
        })
      }
      let name
      if (serverTeamValue && "name" in serverTeamValue) {
        name = serverTeamValue.name
      } else {
        //this probably works?
        name = JSON.stringify({
          italic: false,
          text: ""
        })
      }
      let prefix
      if (serverTeamValue && "prefix" in serverTeamValue) {
        prefix = serverTeamValue.prefix
      } else {
        //this probably works?
        prefix = JSON.stringify({
          italic: false,
          text: ""
        })
      }
      let formatting
      if (serverTeamValue && "formatting" in serverTeamValue) {
        formatting = serverTeamValue.formatting
      } else {
        formatting = 15
      }
      this.userClient.write("teams", {
        team: newTeamKey,
        mode: 0,
        name: name,
        prefix: prefix,
        suffix: newSuffix,
        friendlyFire: 3,
        nameTagVisibility: "always",
        collisionRule: "never",
        formatting: formatting,
        players: [username]
      })
    }
    this.teamOverrides.set(uuid, {
      username,
      teamKey: newTeamKey,
      data
    })
  }

  removeTeamOverride(uuid) {
    let existingOverride = this.teamOverrides.get(uuid)
    if (this.userClient.protocolVersion < 107) {
      this.userClient.write("scoreboard_team", {
        team: existingOverride.teamKey,
        mode: 1
      })
    } else {
      this.userClient.write("teams", {
        team: existingOverride.teamKey,
        mode: 1
      })
    }
    this.teamOverrides.delete(uuid)
  }

  replaceTeamOverride(uuid) { //mmm
    let existingOverride = this.teamOverrides.get(uuid)
    this.removeTeamOverride(uuid)
    this.addTeamOverride(uuid, existingOverride.username, existingOverride.data)
  }
}
