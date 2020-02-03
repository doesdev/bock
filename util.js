'use strict'

const path = require('path')
const hoy = require('hoy')
const appRoot = require('app-root-path').toString()

const lvlsInt = { debug: 1, info: 2, warn: 3, fatal: 4 }
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
const kTrack = Symbol('track')

// globals
const completionCallbacks = {}
let commitLogToFile

const fireCallbackIfNeeded = (id) => {
  const capturedCb = completionCallbacks[id]
  if (!capturedCb) return
  delete completionCallbacks[id]
  capturedCb()
}

const writer = (toWrite, cb) => {
  if (!commitLogToFile || !commitLogToFile.connected) {
    const fork = require('child_process').fork
    const writerWorker = path.join(__dirname, 'writer.js')

    if (commitLogToFile && commitLogToFile.removeAllListeners) {
      commitLogToFile.removeAllListeners('close')
      commitLogToFile.removeAllListeners('message')
      if (commitLogToFile.kill) try { commitLogToFile.kill() } catch (ex) {}
      if (commitLogToFile.unfref) try { commitLogToFile.unfref() } catch (ex) {}
    }

    commitLogToFile = fork(writerWorker)
    commitLogToFile.on('close', () => writer())
    commitLogToFile.on('message', (msg) => {
      const msgTypes = { error: true, done: true }
      const [id, msgType, ...body] = msg.split('|')
      if (!msgTypes[msgType]) return console.error(new Error(msg))
      if (msgType === 'error') console.error(new Error(body.join('|')))
      fireCallbackIfNeeded(id)
    })
  }

  if (!toWrite) return

  if (cb) {
    const id = toWrite.id = `${Date.now()}-${randar()}`
    completionCallbacks[id] = cb
    setTimeout(() => fireCallbackIfNeeded(id), 30000)
  }

  commitLogToFile.send(toWrite)
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
  const toReturn = instance[kTrack] ? Promise.resolve() : null
  if (lvlsInt[level] < lvlsInt[instance[kLogLevel]]) return toReturn

  if (typeof err === 'function') err = err()

  const appName = instance[kAppName]
  const toFile = instance[kToFile]
  const toConsole = instance[kToConsole]
  const newline = instance[kNewline]
  const name = err.name || err.toString()
  const whitelist = instance[kWhitelist]

  if (whitelist.has(name) || whitelist.has(err.message)) return toReturn

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

  if (toConsole) {
    const alias = { debug: 'log', fatal: 'error' }
    const logFunc = console[alias[level] || level] || console.log
    logFunc(logText)
  }

  if (toFile) {
    const logBase = instance[kLogBase]
    const logFilePath = path.join(logBase, `${appName}-${today()}.json`)

    if (instance[kTrack]) {
      return new Promise((resolve, reject) => {
        writer({ logFilePath, log: stringer(log), newline }, () => resolve())
      })
    }

    writer({ logFilePath, log: stringer(log), newline })
  }

  return toReturn
}

const closeForked = () => {
  if (!(commitLogToFile && commitLogToFile.connected)) return
  commitLogToFile.removeListener('message', console.error)
  commitLogToFile.removeListener('close', writer)
  commitLogToFile.disconnect()
}

module.exports = {
  lvlsInt,
  defaultBase,
  writer,
  randar,
  kId,
  kAppName,
  kLogBase,
  kLogLevel,
  kNewline,
  kToConsole,
  kToFile,
  kWhitelist,
  kTrack,
  mapWhiteList,
  logIt,
  closeForked
}
