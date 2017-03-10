'use strict'

// Setup
const fs = require('fs')
const maxAttempts = 10

// Main
process.on('message', (data) => {
  let writeIt = (attempts) => {
    try {
      var logs = require(data.logFilePath)
    } catch (e) {
      logs = []
    }
    logs.push(data.log)
    try {
      fs.writeFileSync(data.logFilePath, JSON.stringify(logs))
    } catch (e) {
      if (attempts < maxAttempts) return writeIt(attempts + 1)
      process.send(e)
    }
  }
  writeIt(0)
})
