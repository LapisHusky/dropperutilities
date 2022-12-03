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
    if (meta.name !== "chat") return
    if (data.position === 2) return
    let parsedMessage
    try {
      parsedMessage = JSON.parse(data.message)
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
      if (parsedMessage.extra[0].color !== "gray") break checks
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
        this.userClient.write("chat", {
          position: 1,
          message: JSON.stringify({
            extra,
            text: ""
          }),
          sender: "00000000-0000-0000-0000-000000000000"
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
      this.userClient.write("chat", {
        position: 1,
        message: JSON.stringify({
          extra,
          text: ""
        }),
        sender: "00000000-0000-0000-0000-000000000000"
      })
    })
    this.stateHandler.on("gameEnd", info => {
      let extra = [
        {
          color: "gray",
          text: "You finished all maps in "
        },
        {
          color: "gold",
          text: formatTime(info.hypixelTime)
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
      this.userClient.write("chat", {
        position: 1,
        message: JSON.stringify({
          extra,
          text: ""
        }),
        sender: "00000000-0000-0000-0000-000000000000"
      })
    })
  }
}