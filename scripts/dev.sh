#!/bin/sh
# Starts the dev server with the user-local Node on PATH (used by the preview pane).
cd "$(dirname "$0")/.." || exit 1
export PATH="$HOME/.local/node/bin:$PATH" NEXT_TELEMETRY_DISABLED=1
exec node node_modules/next/dist/bin/next dev -p "${PORT:-3100}"
