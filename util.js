'use strict'

const path = require('path')
const hoy = require('hoy')
const writer = path.join(__dirname, 'writer.js')
const appRoot = require('app-root-path').toString()

const lvlsInt = { debug: 0, info: 1, warn: 2, fatal: 3 }
const lvlsTxt = Object.fromEntries(Object.keys(lvlsInt).map((v, i) => [i, v]))
const defaultBase = path.join(appRoot, 'logs')
const errProps = [
  'name',
  'message',
  'fileName',
  'lineNumber',
  'stack',
  'meta'
]

const kId = Symbol('id')
const kAppName = Symbol('appName')
const kLogBase = Symbol('logBase')
const kLogLevel = Symbol('logLevel')
const kNewline = Symbol('newline')
const kToConsole = Symbol('toConsole')
const kToFile = Symbol('toFile')
const kWhitelist = Symbol('whitelist')

// globals
let commitLogToFile

const newWriter = (toWrite) => {
  if (commitLogToFile && commitLogToFile.connected) return commitLogToFile

  const fork = require('child_process').fork
  commitLogToFile = fork(writer)
  // Get new fork if this one closes
  commitLogToFile.on('close', newWriter)
  // If it fails writing to file console log that crap
  commitLogToFile.on('message', console.error)

  if (toWrite) commitLogToFile.send(toWrite)

  return commitLogToFile
}

const today = () => {
  const d = hoy()
  return `${d.month}-${d.day}-${d.year}`
}

const initCap = (str) => {
  str = str || ''
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

const randar = () => {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2)
  ).substring(0, 16)
}

const stringer = (obj) => {
  try {
    return JSON.stringify(obj)
  } catch (ex) {
    const newObj = {}
    try {
      Object.keys(obj).forEach((k) => {
        try {
          newObj[k] = JSON.parse(JSON.stringify(obj[k]))
        } catch (ex) {}
      })
      return JSON.stringify(newObj)
    } catch (ex) {
      return '{"bockError":"JSON.stringify failed for error"}'
    }
  }
}

const mapWhiteList = (wl) => {
  if (!wl) return new Map()
  return new Map((Array.isArray(wl) ? wl : [wl]).map((k) => [k]))
}

const logIt = (err = new Error(), level = 'warn', instance) => {
  if (lvlsInt[level] < instance[kLogLevel]) return

  if (typeof err === 'function') err = err()

  const appName = instance[kAppName]
  const toFile = instance[kToFile]
  const toConsole = instance[kToConsole]
  const newline = instance[kNewline]
  const name = err.name || err.toString()
  const whitelist = instance[kWhitelist]

  if (whitelist.has(name) || whitelist.has(err.message)) return

  const log = {}
  log.time = Date.now()
  log.level = level

  if (typeof err === 'string') {
    log.message = err
  } else {
    Object.assign(log, err)
    errProps.forEach((p) => { if (err[p]) log[p] = err[p] })
  }

  if (!log.name && !log.message) log.message = err

  const logProps = Object.getOwnPropertyNames(log)

  let logText = `${level.toUpperCase()}:`
  logText += `\n  Timestamp: ${new Date(log.time).toLocaleString()}`

  logProps.forEach((k) => {
    if (k === 'time' || k === 'level') return
    const val = typeof log[k] === 'object' ? stringer(log[k]) : log[k]
    logText += `\n  ${initCap(k)}: ${val}`
  })

  if (toFile) {
    const logBase = instance[kLogBase]
    const logFilePath = path.join(logBase, `${appName}-${today()}.json`)
    const toWrite = { logFilePath, log: stringer(log), newline }
    try {
      commitLogToFile.send(toWrite)
    } catch (e) {
      newWriter(toWrite)
    }
  }

  if (!toConsole) return

  const alias = { debug: 'log', fatal: 'error' }

  return (console[alias[level] || level] || console.log)(logText)
}

const closeForked = () => {
  if (!(commitLogToFile && commitLogToFile.connected)) return
  commitLogToFile.removeListener('message', console.error)
  commitLogToFile.removeListener('close', newWriter)
  commitLogToFile.disconnect()
}

module.exports = {
  lvlsInt,
  lvlsTxt,
  defaultBase,
  newWriter,
  randar,
  kId,
  kAppName,
  kLogBase,
  kLogLevel,
  kNewline,
  kToConsole,
  kToFile,
  kWhitelist,
  mapWhiteList,
  logIt,
  closeForked
}
