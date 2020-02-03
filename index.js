'use strict'

const {
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
} = require('./util')

const instances = {}
let cached

const bock = (id, opts) => {
  const needsOpts = !opts
  opts = opts || {}

  const instOpts = {
    [kAppName]: opts.appName || 'bock',
    [kLogBase]: opts.logBase || defaultBase,
    [kLogLevel]: lvlsInt[opts.logLevel] ? opts.logLevel : 'debug',
    [kNewline]: opts.newline !== false,
    [kToConsole]: opts.toConsole !== false,
    [kToFile]: opts.toFile !== false,
    [kWhitelist]: mapWhiteList(opts.whitelist),
    [kTrack]: opts.track === true
  }

  if (instOpts[kToFile]) {
    try {
      require('fs').mkdirSync(instOpts[kLogBase])
    } catch (e) {}
    writer()
  }

  const bockInstance = {
    [kId]: id,
    get appName () { return instOpts[kAppName] },
    get logLevel () { return instOpts[kLogLevel] },
    set logLevel (ll) {
      instOpts[kLogLevel] = lvlsInt[ll] ? ll : instOpts[kLogLevel] || 'debug'
    },
    setLogLevel (logLevel) { bockInstance.logLevel = logLevel },
    debug: (err) => logIt(err, 'debug', instOpts),
    info: (err) => logIt(err, 'info', instOpts),
    warn: (err) => logIt(err, 'warn', instOpts),
    fatal: (err) => logIt(err, 'fatal', instOpts),
    close () {
      delete instances[id]
      if (cached && cached[kId] === id) cached = undefined
      if (!Object.keys(instances).length) closeForked()
    },
    needsOpts
  }

  return bockInstance
}

const newBock = (opts) => {
  const id = `${(opts || {}).appName || 'bock'}-${Date.now()}-${randar()}`
  return (instances[id] = bock(id, opts))
}

module.exports = newBock

module.exports.cached = (opts) => {
  if (cached && cached.needsOpts && opts) return (cached = newBock(opts))
  return (cached = cached || newBock(opts))
}
