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
    debug: (err, transform) => logIt(err, 'debug', instOpts, transform),
    info: (err, transform) => logIt(err, 'info', instOpts, transform),
    warn: (err, transform) => logIt(err, 'warn', instOpts, transform),
    fatal: (err, transform) => logIt(err, 'fatal', instOpts, transform),
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
