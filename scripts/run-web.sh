#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

fail_if_port_busy 3000
run_logged "web" env PORT=3000 pnpm --filter @culture-chain/web dev
