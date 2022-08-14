import EventEmitter from "events"

export class TickCounter extends EventEmitter {
  constructor(clientHandler) {
    super()

    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler
    this.worldTracker = clientHandler.worldTracker

    this.newMultiBlockFormat = this.userClient.protocolVersion >= 755

    this.tpsAwaitingAccept = []

    this.currentTickCount = null
    this.tickCounts = null
    this.startedCounting = null
    this.inMap = false
    this.doorOpened = null

    this.lastPos = {
      x: null,
      y: null,
      z: null
    }

    this.bindEventListeners()
  }

  bindEventListeners() {
    this.stateHandler.on("game", () => {
      //reset ticks
      this.currentTickCount = 0
      this.tickCounts = []
      this.startedCounting = false
      this.inMap = true
      this.doorOpened = false
      this.doorEditCount = 0
    })
    this.stateHandler.on("state", (state) => {
      if (state !== "game") {
        this.currentTickCount = null
        this.tickCounts = null
        this.startedCounting = null
        this.inMap = false
        this.doorOpened = null
      }
    })
    this.stateHandler.on("time", (type, duration) => {
      this.startedCounting = false
      if (type === 5) {
        //last map completed, stop tracking
        this.hypixelMapEnd(type)
        this.currentTickCount = null
        this.startedCounting = null
        this.inMap = false
        this.doorOpened = null
      } else {
        if (type !== "drop") this.hypixelMapEnd(type)
        this.currentTickCount = 0
        this.startedCounting = false
        this.inMap = true
      }
    }) 
    this.proxyClient.on("position", data => {
      let posData = {
        x: data.x,
        y: data.y,
        z: data.z,
        yaw: data.yaw,
        pitch: data.pitch,
      }
      posData = JSON.stringify(posData)
      this.tpsAwaitingAccept.push(posData)
    })
    this.proxyClient.on("respawn", () => {
      this.tpsAwaitingAccept = []
      this.lastPos = {
        x: null,
        y: null,
        z: null
      }
    })
    this.proxyClient.on("multi_block_change", data => {
      if (this.stateHandler.state !== "game") return
      if (this.doorOpened) return
      //sometimes multi_block_change is sent when it's not the door? possibly a bug somewhere in hypixel?
      //this should filter out anything that isn't the door opening
      if (this.newMultiBlockFormat) {
        let airCount = 0
        for (let record of data.records) {
          if (record >> 12 === 0) airCount++
        }
        if (airCount < 9) return
      } else {
        let airCount = 0
        for (let record of data.records) {
          if (record.blockId === 0) airCount++
        }
        if (airCount < 9) return
      }
      this.doorOpened = true
      this.startCounting()
    })
    this.userClient.on("position", data => {
      let isStandstill = data.x === this.lastPos.x && data.y === this.lastPos.y && data.z === this.lastPos.z
      if (!isStandstill) {
        this.lastPos = {
          x: data.x,
          y: data.y,
          z: data.z
        }
        this.movementTick(data)
      }
      this.handlePosition(data.x, data.y, data.z)
    })
    this.userClient.on("position_look", data => {
      let isStandstill = data.x === this.lastPos.x && data.y === this.lastPos.y && data.z === this.lastPos.z
      if (!isStandstill) this.lastPos = {
        x: data.x,
        y: data.y,
        z: data.z
      }
      let posData = {
        x: data.x,
        y: data.y,
        z: data.z,
        yaw: data.yaw,
        pitch: data.pitch,
      }
      posData = JSON.stringify(posData)
      let isTpConfirm = false
      if (this.tpsAwaitingAccept.includes(posData)) {
        this.tpsAwaitingAccept.splice(this.tpsAwaitingAccept.indexOf(posData), 1)
        isTpConfirm = true
      }
      if (isTpConfirm) {
        this.tpConfirm(data.y >= 200)
      } else if (!isStandstill) {
        this.movementTick(data)
      }
      this.handlePosition(data.x, data.y, data.z)
    })
    this.userClient.on("look", data => {
      this.movementTick(data)
    })
  }

  startCounting() {
    this.startedCounting = true
  }

  tpConfirm(isHighTp) {
    if (this.stateHandler.state !== "game") return
    if (this.inMap && !this.startedCounting && isHighTp && this.doorOpened) this.startCounting()
  }

  movementTick() {
    if (this.stateHandler.state !== "game") return
    if (this.startedCounting) {
      this.currentTickCount++
    }
    this.emit("tick")
  }

  //called once Hypixel tells us the map is finished
  hypixelMapEnd(type) {
    this.tickCounts.push(this.currentTickCount)
    this.currentTickCount = 0
    this.startedCounting = false
  }

  handlePosition(x, y, z) {
    if (!this.startedCounting) return
    let floorX = Math.floor(x)
    let floorY = Math.floor(y)
    let floorZ = Math.floor(z)
    let decimalX = x - floorX
    let decimalY = y - floorY
    let decimalZ = z - floorZ
    let minX = floorX, maxX = floorX
    let minY = floorY, maxY = floorY + 1 //player is taller than 1 block
    let minZ = floorZ, maxZ = floorZ
    if (decimalX < 0.3) minX--
    if (decimalX > 0.7) maxX++
    if (decimalZ < 0.3) minZ--
    if (decimalZ > 0.7) maxZ++
    //this is close enough, doesn't account for sneaking but that shouldn't matter
    if (decimalY > 0.2) maxY++

    let touchingPortal = false
    loops: for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (y < 0 || y > 255) continue
        for (let z = minZ; z <= maxZ; z++) {
          if (this.worldTracker.isPortal(x, y, z)) {
            touchingPortal = true
            break loops
          }
        }
      }
    }
    if (touchingPortal) this.mapEnd()
  }

  //called once we enter the portal client-side
  //don't immediately end because there's a chance we took fall damage or something before entering the portal
  mapEnd() {
    this.startedCounting = false
  }
}