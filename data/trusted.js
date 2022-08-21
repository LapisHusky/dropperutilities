import { data } from "./dataHandler.js"

export function isTrusted(uuid) {
  return data.trusted.includes(uuid)
}

export function addToTrusted(uuid) {
  data.trusted.push(uuid)
}

export function removeFromTrusted(uuid) {
  data.trusted.splice(data.trusted.indexOf(uuid), 1)
}

export function getTrustedList() {
  return data.trusted
}