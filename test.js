'use strict'

// setup
const test = require('ava')
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

test.afterEach(() => {
  let logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  fs.unlinkSync(logFile)
  try {
    fs.rmdirSync(opts.logBase)
  } catch (ex) {}
})

test.serial('proper JSON array', async (assert) => {
  let logger = bock(opts)
  logger.debug(new Error('debug'))
  logger.info(new Error('info'))
  logger.warn(new Error('warn'))
  logger.fatal(new Error('fatal'))
  await delay(500)
  let logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  let log = require(logFile)
  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'info')
  assert.is(log[2].level, 'warn')
  assert.is(log[3].level, 'fatal')
})

test.serial('newline delimited JSON', async (assert) => {
  let logger = bock(Object.assign({}, opts, {newline: true}))
  logger.debug(new Error('debug'))
  logger.info(new Error('info'))
  logger.warn(new Error('warn'))
  logger.fatal(new Error('fatal'))
  await delay(500)
  let logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  let nld = fs.readFileSync(logFile, 'utf8').trim().split('\n').join(',')
  let log = JSON.parse(`[${nld}]`)
  assert.is(log[0].level, 'debug')
  assert.is(log[1].level, 'info')
  assert.is(log[2].level, 'warn')
  assert.is(log[3].level, 'fatal')
})

test.serial('circular reference', async (assert) => {
  let logger = bock(opts)
  let err = new Error('debug')
  let meta = {error: err}
  err.meta = meta
  assert.notThrows(() => logger.debug(err))
  await delay(500)
})
