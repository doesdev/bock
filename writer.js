'use strict'

const fs = require('fs')
const maxAttempts = 10
const prepMsg = (data, msgType, msg) => `${data.id}|${msgType}|${msg || 'done'}`
const queue = []
const stream = {}

const write = () => new Promise((resolve, reject) => {
  const { log, logFilePath: fPath } = queue.shift() || {}
  if (!(log && fPath)) return resolve()

  if (stream.path !== fPath) {
    if (stream.active && stream.active.writable) stream.active.end()
    stream.active = fs.createWriteStream(fPath, { flags: 'a' })
    stream.path = fPath
  }

  stream.active.write(`${log}\n`, () => resolve())
})

const writeIt = async (data, attempts) => {
  try {
    queue.push(data)
    await write()
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

process.on('message', (d) => d.newline ? writeIt(d, 0) : writeItAsAry(d, 0))
