export function formatTime(ms) {
  //round to milliseconds, no micro or nano
  ms = Math.round(ms)
  //correct units
  let s = Math.floor(ms / 1000)
  let m = Math.floor(s / 60)
  //modulo
  ms = ms % 1000
  s = s % 60
  let paddedMs = ms.toString().padStart(3, "0")
  let paddedS = s.toString().padStart(2, "0")
  let paddedM = m.toString().padStart(2, "0")
  return `${paddedM}:${paddedS}.${paddedMs}`
}