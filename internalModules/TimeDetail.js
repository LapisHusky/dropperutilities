import { formatTime } from "../utils/utils.js"

export class TimeDetail {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler

    this.bindEventListeners()
    this.bindModifiers()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    let actualMessage
    if (meta.name === "chat") {
      if (data.position === 2) return
      actualMessage = data.message
    } else if (meta.name === "system_chat") {
      if ("type" in data && data.type !== 1) return
      if ("isActionBar" in data && data.isActionBar === true) return
      actualMessage = data.content
    } else return
    let parsedMessage
    try {
      parsedMessage = JSON.parse(actualMessage)
    } catch (error) {
      //invalid JSON, Hypixel sometimes sends invalid JSON with unescaped newlines
      return
    }
    //map completed
    checks: {
      if (this.stateHandler.state !== "game") break checks
      if (parsedMessage.extra?.length !== 5) break checks
      if (parsedMessage.text !== "") break checks
      if (!parsedMessage.extra[0].text.startsWith("You finished Map ")) break checks
      if (parsedMessage.extra[0].color !== "gray") break checks
      return {
        type: "cancel"
      }
    }
    //game completed
    checks: {
      if (this.stateHandler.state !== "game") break checks
      if (parsedMessage.extra?.length !== 3) break checks
      if (parsedMessage.text !== "") break checks
      if (parsedMessage.extra[0].text !== "You finished all maps in ") break checks
      if (parsedMessage.extra[0].color !== "green") break checks
      return {
        type: "cancel"
      }
    }
    //map skipped
    checks: {
      if (this.stateHandler.state !== "game") break checks
      if (parsedMessage.extra?.length !== 3) break checks
      if (parsedMessage.text !== "") break checks
      if (!parsedMessage.extra[0].text.startsWith("You have skipped ahead to Map ")) break checks
      if (parsedMessage.extra[0].color !== "gray") break checks
      return {
        type: "cancel"
      }
    }
  }

  bindEventListeners() {
    this.stateHandler.on("time", info => {
      if (info.skipped) {
        let mapColor = ["green", "green", "yellow", "yellow", "red"][info.number]
        let extra = [
          {
            color: "gray",
            text: `You skipped Map ${info.number + 1} (`
          },
          {
            color: mapColor,
            text: info.name
          },
          {
            color: "gray",
            text: ") after "
          },
          {
            color: "gold",
            text: formatTime(info.duration)
          },
          {
            color: "gray",
            text: "!"
          }
        ]
        this.clientHandler.sendClientMessage({
          extra,
          text: ""
        })
        return
      }
      let mapColor = ["green", "green", "yellow", "yellow", "red"][info.number]
      let extra = [
        {
          color: "gray",
          text: `You finished Map ${info.number + 1} (`
        },
        {
          color: mapColor,
          text: info.name
        },
        {
          color: "gray",
          text: ") in "
        },
        {
          color: "gold",
          text: formatTime(info.duration)
        },
        {
          color: "gray",
          text: "!"
        }
      ]
      if (!this.clientHandler.disableTickCounter) {
        extra.push({
          color: "gray",
          text: " Ticks: "
        },
        {
          color: "blue",
          text: info.ticks.toString()
        })
      }
      this.clientHandler.sendClientMessage({
        extra,
        text: ""
      })
    })
    this.stateHandler.on("gameEnd", info => {
      let extra = [
        {
          color: "green",
          text: "You finished all maps in "
        },
        {
          color: "gold",
          text: formatTime(info.hypixelTime)
        },
        {
          color: "green",
          text: "!"
        }
      ]
      if (!this.clientHandler.disableTickCounter) {
        extra.push({
          color: "green",
          text: " Ticks: "
        },
        {
          color: "blue",
          text: info.ticks.toString()
        })
      }
      this.clientHandler.sendClientMessage({
        extra,
        text: ""
      })
    })
  }
}