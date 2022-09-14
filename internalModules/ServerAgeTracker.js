export class ServerAgeTracker {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient

    this.recentUpdates = []

    this.bindEventListeners()
  }

  bindEventListeners() {
    this.proxyClient.on("respawn", () => {
      this.recentUpdates = []
    })
    this.proxyClient.on("update_time", (data) => {
      let age = data.age
      let now = performance.now()
      this.recentUpdates.push({
        time: now,
        age
      })
      //delete anything older than 15 minutes
      while (now - this.recentUpdates[0]?.time > 900000) {
        this.recentUpdates.shift()
      }
    })
  }

  getTps(period) {
    if (this.recentUpdates.length < 2) return null
    let now = performance.now()
    let firstNewEnough = this.recentUpdates.findIndex(update => now - update.time <= period)
    if (firstNewEnough === -1) firstNewEnough = 0
    let intialUpdate = this.recentUpdates[firstNewEnough]
    let lastUpdate = this.recentUpdates[this.recentUpdates.length - 1]
    if (lastUpdate.age <= intialUpdate.age) return null
    let tps = Number(lastUpdate.age - intialUpdate.age) / (lastUpdate.time - intialUpdate.time) * 1000
    if (tps > 50) return null //???
    if (tps < 0) return null //???
    if (tps > 20) return 20 //hopefully just slight lag causing this
    return tps
  }
}