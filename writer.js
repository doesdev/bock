'use strict'

const fs = require('fs')
const maxAttempts = 10

const prepMsg = (data, msgType, msg) => `${data.id}|${msgType}|${msg || 'done'}`

const writeIt = (data, attempts) => {
  try {
    fs.appendFileSync(data.logFilePath, `${data.log}\n`)
    if (data.id) process.send(prepMsg(data, 'done'))
  } catch (e) {
    if (attempts < maxAttempts) return writeIt(data, attempts + 1)
    process.send(data.id ? prepMsg(data, 'error', e) : e)
  }
}

const writeItAsAry = (data, attempts) => {
  try {
    var logs = require(data.logFilePath)
  } catch (e) {
    logs = []
  }
  logs.push(JSON.parse(data.log))
  try {
    fs.writeFileSync(data.logFilePath, JSON.stringify(logs))
    if (data.id) process.send(prepMsg(data, 'done'))
  } catch (e) {
    if (attempts < maxAttempts) return writeItAsAry(data, attempts + 1)
    process.send(data.id ? prepMsg(data, 'error', e) : e)
  }
}

// main
process.on('message', (d) => d.newline ? writeIt(d, 0) : writeItAsAry(d, 0))
