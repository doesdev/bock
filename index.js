'use strict'

// Setup
const hoy = require('hoy')
const path = require('path')
const appRoot = require('app-root-path').toString()
const writer = path.join(__dirname, 'writer.js')
const lvls = {debug: 0, info: 1, warn: 2, fatal: 3}
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

const initCap = (str) => {
  str = str || ''
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

const boolify = (val, fallback) => {
  if (val && (val === true || val === 'true')) return true
  if (val === false || val === 'false') return false
  return fallback
}

const stringer = (obj) => {
  try {
    return JSON.stringify(obj)
  } catch (ex) {
    let newObj = {}
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

// Export main function
module.exports = (opts = {}) => {
  let logLevel = opts.logLevel || 'debug'
  let setLogLevel = (ll) => {
    logLevel = ll || opts.logLevel || 'debug'
    if (!lvls.hasOwnProperty(logLevel)) logLevel = 'debug'
  }
  let appName = opts.appName || 'bock'
  if (!lvls.hasOwnProperty(logLevel)) logLevel = 'debug'
  let logBase = opts.logBase || path.join(appRoot, 'logs')
  let toConsole = boolify(opts.toConsole, true)
  let toFile = boolify(opts.toFile, true)
  let newline = boolify(opts.newline, true)
  let wl = {}
  let wlAry = Array.isArray(opts.whitelist) ? opts.whitelist : [opts.whitelist]
  wlAry.forEach((m) => { if (m) wl[m] = true })
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
    if ((lvls[level] || 0) < (lvls[logLevel] || 0)) return
    let name = err.name || err.toString()
    if (wl[name] || wl[err.message]) return
    let log = {}
    log.time = Date.now()
    log.level = level
    if (typeof err === 'string') {
      log.message = err
    } else {
      Object.assign(log, err)
      errProps.forEach((p) => { if (err[p]) log[p] = err[p] })
    }
    if (!log.name && !log.message) log.message = err
    let logProps = Object.getOwnPropertyNames(log)
    let logText = `${level.toUpperCase()}:`
    logText += `\n  Timestamp: ${new Date(log.time).toLocaleString()}`
    logProps.forEach((k) => {
      if (k === 'time' || k === 'level') return
      let val = typeof log[k] === 'object' ? stringer(log[k]) : log[k]
      logText += `\n  ${initCap(k)}: ${val}`
    })
    if (toFile) {
      let logFilePath = path.join(logBase, `${appName}-${today()}.json`)
      try {
        commitLogToFile.send({logFilePath, log: stringer(log), newline})
      } catch (e) {
        commitLogToFile = fork(writer)
      }
    }
    if (!toConsole) return
    let alias = {debug: 'log', fatal: 'error'}
    return (console[alias[level] || level] || console.log)(logText)
  }
  return {
    setLogLevel,
    debug: (err) => logIt(err, 'debug'),
    info: (err) => logIt(err, 'info'),
    warn: (err) => logIt(err, 'warn'),
    fatal: (err) => logIt(err, 'fatal')
  }
}
