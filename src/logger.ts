type Level = "debug" | "info" | "warn" | "error";

const COLORS: Record<Level, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

function fmt(level: Level, module: string, msg: string, data?: unknown): string {
  const ts = new Date().toISOString().slice(11, 23);
  const color = COLORS[level];
  const base = `${color}[${ts}] [${level.toUpperCase()}] [${module}]${RESET} ${msg}`;
  return data ? `${base} ${JSON.stringify(data)}` : base;
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) => console.log(fmt("debug", module, msg, data)),
    info: (msg: string, data?: unknown) => console.log(fmt("info", module, msg, data)),
    warn: (msg: string, data?: unknown) => console.warn(fmt("warn", module, msg, data)),
    error: (msg: string, data?: unknown) => console.error(fmt("error", module, msg, data)),
  };
}
