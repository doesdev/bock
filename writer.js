'use strict'

// Setup
const fs = require('fs')
const maxAttempts = 10

// helpers
const writeIt = (data, attempts) => {
  try {
    fs.appendFileSync(data.logFilePath, `${data.log}\n`)
  } catch (e) {
    if (attempts < maxAttempts) return writeIt(data, attempts + 1)
    process.send(e)
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
  } catch (e) {
    if (attempts < maxAttempts) return writeItAsAry(data, attempts + 1)
    process.send(e)
  }
}

// main
process.on('message', (d) => d.newline ? writeIt(d, 0) : writeItAsAry(d, 0))
