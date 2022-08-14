import { formatTime } from "./utils.js"

export class TimeDetail {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler
    if (!this.clientHandler.disableTickCounter) this.tickCounter = clientHandler.tickCounter

    this.bindEventListeners()
    this.bindModifiers()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (meta.name !== "chat") return
    if (data.position === 2) return
    let parsedMessage = JSON.parse(data.message)
    //countdown done, glass open
    checks: {
      if (parsedMessage.extra?.length !== 1) break checks
      if (parsedMessage.text !== "") break checks
      if (parsedMessage.extra[0].text !== "DROP!") break checks
      if (parsedMessage.extra[0].bold !== true) break checks
      if (parsedMessage.extra[0].color !== "green") break checks
      return {
        type: "cancel"
      }
    }
    //map completed
    checks: {
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
      if (parsedMessage.extra?.length !== 3) break checks
      if (parsedMessage.text !== "") break checks
      if (parsedMessage.extra[0].text !== "You finished all maps in ") break checks
      if (parsedMessage.extra[0].color !== "gray") break checks
      return {
        type: "cancel"
      }
    }
  }

  bindEventListeners() {
    this.stateHandler.on("time", (type, duration) => {
      if (type === "drop") {
        this.userClient.write("chat", {
          position: 1,
          message: JSON.stringify({
            italic: false,
            extra: [
              {
                bold: true,
                color: "green",
                text: "DROP!"
              },
              {
                color: "gray",
                text: " Countdown time "
              },
              {
                color: "gold",
                text: formatTime(duration)
              }
            ],
            text: ""
          }),
          sender: "00000000-0000-0000-0000-000000000000"
        })
        return
      }
      let mapDifficulty = [0, 0, 1, 1, 2][type - 1]
      let mapColor = ["green", "yellow", "red"][mapDifficulty]
      let extra = [
        {
          color: "gray",
          text: `You finished Map ${type} (`
        },
        {
          color: mapColor,
          text: this.stateHandler.maps[type - 1]
        },
        {
          color: "gray",
          text: ") in "
        },
        {
          color: "gold",
          text: formatTime(duration)
        },
        {
          color: "gray",
          text: "!"
        }
      ]
      if (!this.clientHandler.disableTickCounter) {
        let tickCount = this.tickCounter.tickCounts[type - 1]
        extra.push({
          color: "gray",
          text: " Ticks: "
        },
        {
          color: "blue",
          text: tickCount.toString()
        })
      }
      this.userClient.write("chat", {
        position: 1,
        message: JSON.stringify({
          italic: false,
          extra,
          text: ""
        }),
        sender: "00000000-0000-0000-0000-000000000000"
      })
    })
    this.stateHandler.on("gameEnd", time => {
      let extra = [
        {
          color: "gray",
          text: "You finished all maps in "
        },
        {
          color: "gold",
          text: formatTime(time)
        },
        {
          color: "gray",
          text: "!"
        }
      ]
      if (!this.clientHandler.disableTickCounter) {
        let tickCount = this.tickCounter.tickCounts.reduce((partialSum, a) => partialSum + a, 0)
        extra.push({
          color: "gray",
          text: " Ticks: "
        },
        {
          color: "blue",
          text: tickCount.toString()
        })
      }
      this.userClient.write("chat", {
        position: 1,
        message: JSON.stringify({
          italic: false,
          extra,
          text: ""
        }),
        sender: "00000000-0000-0000-0000-000000000000"
      })
    })
  }
}