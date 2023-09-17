import { config } from "../config/configHandler.js"
import { getStats } from "../dropperApi/identifierHandler.js"

let enabled = config["fetch-player-stats"]

export class TabListHandler {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.stateHandler = this.clientHandler.stateHandler

    this.teams = new Map()
    this.players = new Map()

    if (enabled) {
      this.bindModifiers()
      this.bindEventListeners()
    }

    /*setInterval(() => {
      console.dir(this.teams, {colors: true, depth:100})
      console.dir(this.players, {colors: true, depth:100})
    }, 5000)*/
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (!([
      "named_entity_spawn",
      "player_info",
      "entity_metadata",
      "scoreboard_objective",
      "scoreboard_score",
      "scoreboard_display_objective",
      "scoreboard_team"
    ]).includes(meta.name)) return
    //also look at named_entity_spawn, player_info, entity_metadata, scoreboard_objective, scoreboard_score, scoreboard_display_objective, scoreboard_team
    //console.dir([meta.name, data], {depth: 100, colors: true})
  }

  bindEventListeners() {
    /*this.proxyClient.on("login", () => {
      for (let i = 0; i < 1000; i++) console.log("AAAAAAAAAAAAAAAA")
      console.clear()
    })*/




    this.proxyClient.on("teams", data => {
      this.handleTeamPacket(data)
    })
    this.proxyClient.on("scoreboard_team", data => {
      this.handleTeamPacket(data)
    })
    this.proxyClient.on("player_info", data => {
      let action = data.action
      for (let playerInfo of data.data) {
        if (this.userClient.protocolVersion < 761 && action === 4) {
          this.players.delete(playerInfo.UUID) //always uppercase UUID for versions < 761
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
      if (this.stateHandler.state !== "none") this.checkPlayerList()
    })
    this.proxyClient.on("player_remove", data => {
      for (let uuid of data.players) {
        this.players.delete(uuid)
      }
    })
    this.stateHandler.on("state", state => {
      if (state === "none") return
      this.checkPlayerList()
    })
  }

  handleTeamPacket(data) {
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
        this.teams.delete(team)
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
        if ("players" in data && data.players) object.players = data.players
        break
      }
      case 3: {
        let object = this.teams.get(team)
        object.players.push(...data.players)
        break
      }
      case 4: {
        let object = this.teams.get(team)
        for (let player of data.players) {
          object.players.splice(object.players.indexOf(player), 1)
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
      players.push(player.uuid)
      //console.log(player)
    }
    return players
  }

  checkPlayerList() {
    let list = this.getActualPlayers()
    for (let uuid of list) {
      (async () => {
        let userData = await getStats(uuid)
        if (this.stateHandler.state === "none") return
        if (!this.players.has(uuid)) return
        //console.log(uuid, userData)
      })()
    }
  }
}