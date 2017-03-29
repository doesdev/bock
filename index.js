'use strict'

// Setup
const hoy = require('hoy')
const path = require('path')
const appRoot = require('app-root-path').toString()
const writer = path.join(__dirname, 'writer.js')
const errProps = [
  'name',
  'message',
  'fileName',
  'lineNumber',
  'stack',
  'meta'
]

// Helpers
const today = () => {
  let d = hoy()
  return `${d.month}-${d.day}-${d.year}`
}

const levelToInt = (level) => {
  switch (level) {
    case 'info': return 1
    case 'warn': return 2
    case 'fatal': return 3
    default: return 0
  }
}

const initCap = (str) => {
  str = str || ''
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

const boolify = (val, fallback) => {
  if (val && (val === true || val === 'true')) return true
  if (val === false || val === 'false') return false
  return fallback
}

// Export main function
module.exports = (opts = {}) => {
  let appName = opts.appName || 'bock'
  let logLevel = opts.logLevel || 'debug'
  let logBase = opts.logBase || path.join(appRoot, 'logs')
  let toConsole = boolify(opts.toConsole, true)
  let toFile = boolify(opts.toFile, true)
  let whitelist = opts.whitelist
  let fork, commitLogToFile
  if (toFile) {
    try {
      require('fs').mkdirSync(logBase)
    } catch (e) {}
    fork = require('child_process').fork
    commitLogToFile = fork(writer)
    // Get new fork if this one closes
    commitLogToFile.on('close', () => {
      commitLogToFile = fork(writer)
    })
    // If it fails writing to file console log that crap
    commitLogToFile.on('message', console.error)
  }
  let logIt = (err = new Error(), level = 'warn') => {
    if (levelToInt(level) < levelToInt(logLevel)) return
    if (Array.isArray(whitelist)) {
      let name = err.name || err.toString()
      if (name && whitelist.indexOf(name) !== -1) return
    }
    let log = {}
    log.time = Date.now()
    log.level = level
    if (typeof err === 'string') log.message = err
    else {
      Object.assign(log, err)
      errProps.forEach((p) => { if (err[p]) log[p] = err[p] })
    }
    if (!log.name && !log.message) log.message = err
    let logProps = Object.getOwnPropertyNames(log)
    let logText = `${level.toUpperCase()}:`
    logText += `\n  Timestamp: ${new Date(log.time).toLocaleString()}`
    logProps.forEach((k) => {
      if (k === 'time' || k === 'level') return
      let val = typeof log[k] === 'object' ? JSON.stringify(log[k]) : log[k]
      logText += `\n  ${initCap(k)}: ${val}`
    })
    if (toFile) {
      let logFilePath = path.join(logBase, `${appName}-${today()}.json`)
      try {
        commitLogToFile.send({logFilePath, log})
      } catch (e) {
        commitLogToFile = fork(writer)
      }
    }
    if (toConsole) {
      switch (level) {
        case 'info': return console.info(logText)
        case 'warn': return console.warn(logText)
        case 'fatal': return console.error(logText)
        default: return console.log(logText)
      }
    }
  }
  return {
    debug: (err) => logIt(err, 'debug'),
    info: (err) => logIt(err, 'info'),
    warn: (err) => logIt(err, 'warn'),
    fatal: (err) => logIt(err, 'fatal')
  }
}
