#!/usr/bin/env bash
# Run from a separate load generator with access to the dedicated course cluster and API.
set -euo pipefail
context=${1:?kubectl context}
out=${2:?new output directory}
: "${BASE_URL:?Set the URL of the dedicated course API}"
cd "$(dirname "$0")"
mkdir "$out"
out=$(cd "$out" && pwd)
k=(kubectl --context "$context" -n booking-sem2)
"${k[@]}" get deployment gateway -o json > "$out/gateway-before.json"
"${k[@]}" get hpa gateway -o json > "$out/hpa-before.json"
"${k[@]}" top pods > "$out/top-before.txt"
printf 'utc,desired,available,cpu_pct\n' > "$out/replicas.csv"
sample() {
  while true; do
    stamp=$(date -u +%FT%TZ)
    desired=$("${k[@]}" get hpa gateway -o 'jsonpath={.status.desiredReplicas}')
    available=$("${k[@]}" get deployment gateway -o 'jsonpath={.status.availableReplicas}')
    cpu=$("${k[@]}" get hpa gateway -o 'jsonpath={.status.currentMetrics[0].resource.current.averageUtilization}')
    echo "$stamp,$desired,$available,$cpu" >> "$out/replicas.csv"
    sleep 10
  done
}
sample &
watcher=$!
trap 'kill "$watcher" 2>/dev/null || true; wait "$watcher" 2>/dev/null || true' EXIT
outputs=()
if [[ -n "${K6_PROMETHEUS_RW_SERVER_URL:-}" ]]; then
  outputs=(--out experimental-prometheus-rw)
  export K6_PROMETHEUS_RW_TREND_STATS='p(95),p(99)'
fi
PROFILE=${PROFILE:-scale} k6 run ${outputs[@]+"${outputs[@]}"} --summary-export "$out/k6.json" ../../homeworks/hw10/booking.js > "$out/k6.log" 2>&1 || load_status=$?
"${k[@]}" get hpa gateway -o yaml > "$out/hpa-after.yaml"
"${k[@]}" top pods > "$out/top-after.txt"
"${k[@]}" get events --field-selector involvedObject.name=gateway > "$out/events.txt"
exit "${load_status:-0}"
