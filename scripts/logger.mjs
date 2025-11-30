export function info(...args){
  if (process.env.QUIET) return
  // keep informative output for local runs
  console.log(...args)
}

export function debug(...args){
  if (!process.env.DEBUG) return
  console.log(...args)
}

export function warn(...args){
  console.warn(...args)
}

export function error(...args){
  console.error(...args)
}

const logger = { info, debug, warn, error }
export default logger
