'use strict'

// setup
const test = require('ava')
const fs = require('fs')
const path = require('path')
const opts = {
  appName: 'bocktest',
  logBase: path.join(__dirname, '_logs'),
  logLevel: 'debug',
  toConsole: false
}
try {
  fs.rmdirSync(opts.logBase)
} catch (ex) {}
const logger = require('./index')(opts)

// test the thing
test('it works', async (assert) => {
  let log, logFile
  // debug
  logger.debug(new Error('debug'))
  await new Promise((resolve, reject) => setTimeout(resolve, 500))
  logFile = path.resolve(opts.logBase, fs.readdirSync(opts.logBase)[0])
  log = JSON.parse(fs.readFileSync(logFile).toString())
  assert.is(log[0].level, 'debug')
  // info
  logger.info(new Error('info'))
  await new Promise((resolve, reject) => setTimeout(resolve, 500))
  log = JSON.parse(fs.readFileSync(logFile).toString())
  assert.is(log[1].level, 'info')
  // warn
  logger.warn(new Error('warn'))
  await new Promise((resolve, reject) => setTimeout(resolve, 500))
  log = JSON.parse(fs.readFileSync(logFile).toString())
  assert.is(log[2].level, 'warn')
  // fatal
  logger.fatal(new Error('fatal'))
  await new Promise((resolve, reject) => setTimeout(resolve, 500))
  log = JSON.parse(fs.readFileSync(logFile).toString())
  assert.is(log[3].level, 'fatal')
  // cleanup
  fs.unlinkSync(logFile)
  try {
    fs.rmdirSync(opts.logBase)
  } catch (ex) {}
})
