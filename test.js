'use strict'

const test = require('mvt')
const fs = require('fs')
const path = require('path')
const bock = require('./index')
const getOpts = (override = {}) => Object.assign({}, {
  appName: 'bocktest',
  logBase: path.join(__dirname, '_logs'),
  logLevel: 'debug',
  toConsole: false,
  newline: false,
  track: true
}, override)

const clearAll = (logger, clearDir) => {
  const logBase = getOpts().logBase
  try {
    const logFiles = fs.readdirSync(logBase).map((f) => path.join(logBase, f))
    logFiles.forEach((f) => { try { fs.unlinkSync(f) } catch (ex) {} })
    if (clearDir) fs.rmdirSync(getOpts().logBase)
  } catch (ex) {}

  if (logger) logger.close()
}

test.before(() => clearAll(null, true))

test.after(() => clearAll(null, true))

test('proper JSON array', async (assert) => {
  const opts = getOpts({ appName: 'json-array' })
  const logger = bock(opts)

  await logger.debug(new Error('debug'))
  await logger.info(new Error('info'))
  await logger.warn(new Error('warn'))
  await logger.fatal(new Error('fatal'))

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const log = require(logFile)

  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'info')
  assert.is(log[2].level, 'warn')
  assert.is(log[3].level, 'fatal')

  clearAll(logger)
})

test('newline delimited JSON', async (assert) => {
  const opts = getOpts({ appName: 'newline', newline: true })
  const logger = bock(opts)

  await logger.debug(new Error('debug'))
  await logger.info(new Error('info'))
  await logger.warn(new Error('warn'))
  await logger.fatal(new Error('fatal'))

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const nld = fs.readFileSync(logFile, 'utf8').trim().split('\n').join(',')
  const log = JSON.parse(`[${nld}]`)

  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'info')
  assert.is(log[2].level, 'warn')
  assert.is(log[3].level, 'fatal')

  clearAll(logger)
})

test('circular reference', async (assert) => {
  const opts = getOpts({ appName: 'circular' })
  const logger = bock(opts)
  const err = new Error('debug')
  const meta = { error: err }

  err.meta = meta

  assert.notThrows(() => logger.debug(err))

  clearAll(logger)
})

test('console output is as expected', async (assert) => {
  const logger = bock({ appName: 'a', toConsole: true, toFile: false })
  let val, old

  // debug
  old = console.log
  console.log = (v) => { val = v }
  logger.debug(new Error('debug'))
  assert.truthy(val.match(/^DEBUG/))
  console.log = old

  // info
  old = console.info
  console.info = (v) => { val = v }
  logger.info(new Error('info'))
  assert.truthy(val.match(/^INFO/))
  console.info = old

  // warn
  old = console.warn
  console.warn = (v) => { val = v }
  logger.warn(new Error('warn'))
  assert.truthy(val.match(/^WARN/))
  console.warn = old

  // fatal
  old = console.error
  console.error = (v) => { val = v }
  logger.fatal(new Error('fatal'))
  assert.truthy(val.match(/^FATAL/))
  console.error = old

  // change logLevel to fatal
  logger.setLogLevel('fatal')

  // run debug scenario, but we expect val to be unchanged from FATAL
  old = console.log
  console.log = (v) => { val = v }
  logger.debug(new Error('debug'))
  assert.truthy(val.match(/^FATAL/))
  console.log = old

  clearAll(logger)
})

test('function as error', async (assert) => {
  const opts = getOpts({ appName: 'function' })
  const logger = bock(opts)

  await logger.fatal(() => new Error('fatal'))

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const log = require(logFile)

  assert.is(log[0].level, 'fatal')

  clearAll(logger)
})

test('whitelist', async (assert) => {
  const opts = getOpts({ appName: 'whitelist', whitelist: ['info'] })
  const logger = bock(opts)

  await logger.debug(new Error('debug'))
  await logger.info(new Error('info'))
  await logger.warn(new Error('warn'))
  await logger.fatal(new Error('fatal'))

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const log = require(logFile)

  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'warn')
  assert.is(log[2].level, 'fatal')

  clearAll(logger)
})

test('cached returns last instance', async (assert) => {
  const loggerInit = bock.cached(getOpts({ appName: 'cached' }))
  const loggerCached = bock.cached()
  assert.is(loggerInit, loggerCached)
  loggerCached.close()
})

test('cached re-inits if cached needs opts', async (assert) => {
  const loggerNeedsOpts = bock.cached()
  const loggerReInit = bock.cached(getOpts({ appName: 'cache-reinit' }))
  const loggerCached = bock.cached()
  assert.not(loggerNeedsOpts, loggerReInit)
  assert.not(loggerNeedsOpts, loggerCached)
  assert.is(loggerReInit, loggerCached)
  loggerCached.close()
})

test('can destructure', async (assert) => {
  const opts = getOpts({ appName: 'destructure' })
  const logger = bock(opts)
  const { debug, info, warn, fatal } = logger

  await debug(new Error('debug'))
  await info(new Error('info'))
  await warn(new Error('warn'))
  await fatal(new Error('fatal'))

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const log = require(logFile)

  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'info')
  assert.is(log[2].level, 'warn')
  assert.is(log[3].level, 'fatal')

  clearAll(logger)
})

test('methods return promise with track = true', async (assert) => {
  const logger = bock(getOpts({ appName: 'track-true', track: true }))
  assert.true(logger.debug('debug') instanceof Promise)

  clearAll(logger)
})

test('methods return null with track = false', async (assert) => {
  const logger = bock(getOpts({ appName: 'track-false', track: false }))
  assert.is(logger.debug('debug'), null)

  clearAll(logger)
})

test('stress test with newline = false', async (assert) => {
  const opts = getOpts({ appName: 'stress-array', track: true })
  const logger = bock(opts)
  const runs = 1000
  const start = Date.now()

  await Promise.all([...Array(runs)].map((_, i) => {
    return logger.debug(new Error(`debug: ${i}`))
  }))

  const fin = Date.now()
  const ranFor = fin - start

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const log = require(logFile)

  assert.is(log.length, runs)
  assert.true(ranFor < 30000)

  console.log(`Stress-Array: ${runs} log entries committed in ${ranFor}ms`)

  clearAll(logger)
})

test('stress test with newline = true', async (assert) => {
  const opts = getOpts({ appName: 'stress-newline', track: true, newline: true })
  const logger = bock(opts)
  const runs = 1000
  const start = Date.now()

  await Promise.all([...Array(runs)].map((_, i) => {
    return logger.debug(new Error(`debug: ${i}`))
  }))

  const fin = Date.now()
  const ranFor = fin - start

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const nld = fs.readFileSync(logFile, 'utf8').trim().split('\n').join(',')
  const log = JSON.parse(`[${nld}]`)

  assert.is(log.length, runs)
  assert.true(ranFor < 10000)

  console.log(`Stress-Newline: ${runs} log entries committed in ${ranFor}ms`)

  clearAll(logger)
})
