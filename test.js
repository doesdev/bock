'use strict'

const test = require('mvt')
const fs = require('fs')
const path = require('path')
const bock = require('./index')
const opts = {
  appName: 'bocktest',
  logBase: path.join(__dirname, '_logs'),
  logLevel: 'debug',
  toConsole: false,
  newline: false
}

try {
  fs.rmdirSync(opts.logBase)
} catch (ex) {}

const delay = async (d = 500) => {
  await new Promise((resolve, reject) => setTimeout(resolve, d))
}

const clear = (logger) => {
  try {
    const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
    fs.unlinkSync(logFile)
    fs.rmdirSync(opts.logBase)
  } catch (ex) {}

  if (logger) logger.close()
}

test('proper JSON array', async (assert) => {
  const logger = bock(opts)

  logger.debug(new Error('debug'))
  logger.info(new Error('info'))
  logger.warn(new Error('warn'))
  logger.fatal(new Error('fatal'))

  await delay(500)

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const log = require(logFile)

  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'info')
  assert.is(log[2].level, 'warn')
  assert.is(log[3].level, 'fatal')

  clear(logger)
})

test('newline delimited JSON', async (assert) => {
  const logger = bock(Object.assign({}, opts, { newline: true }))

  logger.debug(new Error('debug'))
  logger.info(new Error('info'))
  logger.warn(new Error('warn'))
  logger.fatal(new Error('fatal'))

  await delay(500)

  const logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  const nld = fs.readFileSync(logFile, 'utf8').trim().split('\n').join(',')
  const log = JSON.parse(`[${nld}]`)

  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'info')
  assert.is(log[2].level, 'warn')
  assert.is(log[3].level, 'fatal')

  clear(logger)
})

test('circular reference', async (assert) => {
  const logger = bock(opts)
  const err = new Error('debug')
  const meta = { error: err }

  err.meta = meta

  assert.notThrows(() => logger.debug(err))

  await delay(500)

  clear(logger)
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

  clear(logger)
})
