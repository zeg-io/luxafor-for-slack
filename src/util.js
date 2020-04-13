const Luxafor = require('node-luxafor')
const luxLight = new Luxafor()
const chalk = require('chalk')
const debug = require('./debug')
const d = {
  d: debug('dnd'),
  a: debug('away'),
  t: debug('timer')
}

const COLORS = {
  red: '#f00',
  green: '#0f0'
}

const TIMER_OFF = `'TIMER_OFF'`
const TIMER_ON = `'TIMER_ON'`

const TYPE_DND = 'DnD '
const TYPE_AWAY = 'Away'

const typeLogger = (chalker, type, message) => {
  console.log(chalker(` ${type} `) + ` ${message}`)
}

const printHello = () => {
  console.log('\n')
  console.log(
    '  ' +
      chalk.bgBlue('     ') +
      chalk.bgCyan('                   ') +
      chalk.bgGreen('     ')
  )
  console.log(
    '  ' +
      chalk.bgBlue('     ') +
      chalk.bgCyan('                   ') +
      chalk.bgGreen('     ')
  )
  console.log(
    '  ' +
      chalk.bgBlue('     ') +
      chalk.bold.black.bgWhite('                   ') +
      chalk.bgYellow('     ')
  )
  console.log(
    '  ' +
      chalk.bgBlue('     ') +
      chalk.bold.black.bgWhite(' Luxafor for Slack ') +
      chalk.bgYellow('     ')
  )
  console.log(
    '  ' +
      chalk.bgBlue('     ') +
      chalk.bold.black.bgWhite('                   ') +
      chalk.bgYellow('     ')
  )
  console.log(
    '  ' + chalk.bgMagenta('     ') + chalk.bgRed('                        ')
  )
  console.log(
    '  ' + chalk.bgMagenta('     ') + chalk.bgRed('                        ')
  )
  console.log('\n')
}

let dndTimer
let dndQueueTimer
const bufferTime = 1 //ms
const configureDndTimer = (state, startUnixTs, endUnixTs) => {
  const nowUnixTs = getNowUnixTs()

  if (nowUnixTs > startUnixTs) {
    if (endUnixTs > nowUnixTs) {
      d.t(`starting ${TIMER_OFF}, to trigger at ${new Date(endUnixTs * 1000)}`)
      // When the timestamp is between start and end, set dnd to true and run a
      // timeout to then set it false (on the end ts)
      setDnd(state, true)
      clearTimeout(dndTimer)
      const endMs = (endUnixTs - nowUnixTs + bufferTime) * 1000
      dndTimer = setTimeout(() => {
        setDnd(state, false)
        typeLogger(chalk.bold.black.bgYellow, TYPE_DND, `Disabled.`)
      }, endMs)

      setTimeout(() => {
        typeLogger(
          chalk.bold.black.bgYellow,
          TYPE_DND,
          `Enabled. Set to disable at ${new Date(
            endUnixTs * 1000
          ).toLocaleTimeString()}.`
        )
      }, 50)
    } else {
      // When the timestamp is above bounds, set dnd to false
      setDnd(state, false)
    }
  } else {
    d.t(`starting ${TIMER_ON}, to trigger at ${new Date(startUnixTs * 1000)}`)
    // When the timestamp is below bounds, set dnd to false, and run a timeout
    // to then set it to true (on the start ts)
    setDnd(state, false)
    clearTimeout(dndQueueTimer)
    const startMs = (startUnixTs - nowUnixTs + bufferTime) * 1000
    dndQueueTimer = setTimeout(
      configureDndTimer.bind(null, state, startUnixTs, endUnixTs),
      startMs
    )

    setTimeout(() => {
      typeLogger(
        chalk.bold.black.bgYellow,
        TYPE_DND,
        `Disabled. Set to enable at ${new Date(
          startUnixTs * 1000
        ).toLocaleTimeString()}.`
      )
    }, 50)
  }
}

const setDndTimerDisabled = state => {
  clearTimeout(dndTimer)
  clearTimeout(dndQueueTimer)

  setDnd(state, false)

  setTimeout(() => {
    typeLogger(chalk.bold.black.bgYellow, TYPE_DND, `Disabled.`)
  }, 50)
}

const setDnd = (state, bool) => {
  d.d(`${bool ? 'enabled' : 'disabled'}`)
  state.dnd = !!bool
  processLuxaforColor(state)
}

const setAway = (state, bool) => {
  bool = !!bool
  if (state.away === bool) return
  d.a(`${bool ? 'enabled' : 'disabled'}`)
  state.away = bool
  processLuxaforColor(state)

  setTimeout(() => {
    // Avoids early logging.
    typeLogger(
      chalk.bold.white.bgBlue,
      TYPE_AWAY,
      state.away ? `Enabled.` : `Disabled.`
    )
  }, 50)
}

const isAway = presence => presence == 'away'

const getNowUnixTs = () => parseInt(+new Date() / 1000)

const handleDnd = (state, enabled, startUnixTs, endUnixTs) => {
  const nowUnixTs = getNowUnixTs()
  const shouldRunDndTimer = enabled

  d.t(`${shouldRunDndTimer ? 'configuring' : 'skipping'} dnd timer`)
  if (shouldRunDndTimer) {
    configureDndTimer(state, startUnixTs, endUnixTs)
  } else {
    setDndTimerDisabled(state)
  }
}

const processLuxaforColor = state => {
  // luxafor.setColor('both', COLORS[state.dnd || state.away ? 'red' : 'green']);
  luxLight.color(0, 0, 255).exec()
}

const promisify = (nodeAsyncFn, context) => () => {
  const args = Array.prototype.slice.call(arguments)
  return new Promise((resolve, reject) => {
    args.push((err, val) => {
      if (err !== null) {
        return reject(err)
      }

      return resolve(val)
    })

    nodeAsyncFn.apply(context || {}, args)
  })
}

module.exports = {
  promisify,
  printHello,
  handleDnd,
  setAway,
  isAway,
  processLuxaforColor
}
