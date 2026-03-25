#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
XDG_CONFIG_HOME_DEFAULT="$LOG_DIR/.config"

mkdir -p "$LOG_DIR" "$XDG_CONFIG_HOME_DEFAULT"

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

say() {
  printf '[%s] %s\n' "$(timestamp)" "$*"
}

log_file_for() {
  local name="$1"
  printf '%s/%s.log' "$LOG_DIR" "$name"
}

pid_file_for() {
  local name="$1"
  printf '%s/%s.pid' "$LOG_DIR" "$name"
}

ensure_base_env() {
  export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$XDG_CONFIG_HOME_DEFAULT}"
  export HARDHAT_DISABLE_TELEMETRY_PROMPT=true
  export NEXT_TELEMETRY_DISABLED=1
  export NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:-00000000000000000000000000000000}"
  export NEXT_PUBLIC_CHAIN_ID="${NEXT_PUBLIC_CHAIN_ID:-31337}"
  export NEXT_PUBLIC_POLYGON_RPC_URL="${NEXT_PUBLIC_POLYGON_RPC_URL:-http://127.0.0.1:8545}"
}

run_logged() {
  local name="$1"
  shift
  local logfile
  logfile="$(log_file_for "$name")"

  ensure_base_env
  say "running [$name] -> $logfile"
  (
    cd "$ROOT_DIR"
    "$@"
  ) 2>&1 | tee "$logfile"
}

start_background() {
  local name="$1"
  shift
  local logfile pidfile
  logfile="$(log_file_for "$name")"
  pidfile="$(pid_file_for "$name")"

  ensure_base_env

  if [[ -f "$pidfile" ]]; then
    local existing_pid
    existing_pid="$(cat "$pidfile")"
    if kill -0 "$existing_pid" 2>/dev/null; then
      say "$name already running (pid=$existing_pid)"
      return 0
    fi
    rm -f "$pidfile"
  fi

  say "starting [$name] in background -> $logfile"
  (
    cd "$ROOT_DIR"
    nohup "$@" >>"$logfile" 2>&1 &
    echo $! >"$pidfile"
  )
  say "$name pid=$(cat "$pidfile")"
}

stop_background() {
  local name="$1"
  local pidfile pid
  pidfile="$(pid_file_for "$name")"

  if [[ ! -f "$pidfile" ]]; then
    say "$name is not running"
    return 0
  fi

  pid="$(cat "$pidfile")"
  if kill -0 "$pid" 2>/dev/null; then
    say "stopping [$name] pid=$pid"
    kill "$pid"
  else
    say "$name pid file exists but process is gone"
  fi

  rm -f "$pidfile"
}

status_background() {
  local name="$1"
  local pidfile pid
  pidfile="$(pid_file_for "$name")"

  if [[ -f "$pidfile" ]]; then
    pid="$(cat "$pidfile")"
    if kill -0 "$pid" 2>/dev/null; then
      say "$name: running (pid=$pid)"
      return 0
    fi
    say "$name: stale pid file"
    return 1
  fi

  say "$name: stopped"
  return 1
}

wait_for_tcp() {
  local host="$1"
  local port="$2"
  local retries="${3:-30}"
  local delay="${4:-1}"

  for ((i = 1; i <= retries; i++)); do
    if bash -lc ">/dev/tcp/$host/$port" 2>/dev/null; then
      say "tcp ready at $host:$port"
      return 0
    fi
    sleep "$delay"
  done

  say "timeout waiting for $host:$port"
  return 1
}

port_pids() {
  local port="$1"
  local raw=""

  if command -v lsof >/dev/null 2>&1; then
    raw="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  fi

  if [[ -z "$raw" ]] && command -v ss >/dev/null 2>&1; then
    raw="$(ss -ltnp "( sport = :$port )" 2>/dev/null | awk -F 'pid=' 'NR > 1 && NF > 1 {split($2, a, ","); print a[1]}' || true)"
  fi

  if [[ -z "$raw" ]] && command -v fuser >/dev/null 2>&1; then
    raw="$(fuser ${port}/tcp 2>/dev/null || true)"
  fi

  printf '%s' "$raw" | tr ' ' '
' | sed '/^$/d' | sort -u | tr '
' ' ' | sed 's/[[:space:]]*$//'
}

fail_if_port_busy() {
  local port="$1"
  local pids
  pids="$(port_pids "$port")"

  if [[ -z "$pids" ]]; then
    return 0
  fi

  say "port $port is already in use"
  say "pid(s): $pids"
  for pid in $pids; do
    say "kill command: kill $pid"
  done
  return 1
}
