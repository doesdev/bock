'use strict'

const {
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
} = require('./util')

const instances = {}
let cached

class Bock {
  constructor (id, opts) {
    this[kId] = id
    this[kAppName] = opts.appName || 'bock'
    this[kLogBase] = opts.logBase || defaultBase
    this[kLogLevel] = lvlsInt[opts.logLevel] || lvlsInt.debug
    this[kNewline] = opts.newline !== false
    this[kToConsole] = opts.toConsole !== false
    this[kToFile] = opts.toFile !== false
    this[kWhitelist] = mapWhiteList(opts.whitelist)

    if (this[kToFile]) {
      try {
        require('fs').mkdirSync(this[kLogBase])
      } catch (e) {}
      newWriter()
    }
  }

  get appName () { return this[kAppName] }

  get logLevel () { return lvlsTxt[this[kLogLevel]] }

  set logLevel (logLevel) {
    this[kLogLevel] = lvlsInt[logLevel] || this[kLogLevel] || lvlsInt.debug
  }

  setLogLevel (logLevel) { this.logLevel = logLevel }

  debug (err) { logIt(err, 'debug', this) }

  info (err) { logIt(err, 'info', this) }

  warn (err) { logIt(err, 'warn', this) }

  fatal (err) { logIt(err, 'fatal', this) }

  close () {
    delete instances[this[kId]]
    if (cached === this) cached = undefined
    if (!Object.keys(instances).length) closeForked()
  }
}

const newBock = (opts = {}) => {
  const id = (opts.appName = opts.appName || 'bock') + Date.now() + randar()
  cached = instances[id] = new Bock(id, opts)
  return cached
}

module.exports = newBock

module.exports.cached = (opts) => cached || newBock(opts)
