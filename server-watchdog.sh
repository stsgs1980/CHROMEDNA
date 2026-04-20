#!/bin/bash
# CHROME DNA Server Watchdog - keeps the dev server alive
# Restarts the server immediately when it dies

LOG="/tmp/zdev.log"
PORT=3000
MAX_HEAP=768

echo "[$(date)] Watchdog starting..." >> $LOG

while true; do
  # Kill any existing server
  pkill -f 'next dev' 2>/dev/null
  sleep 2
  
  # Start server
  cd /home/z/my-project && NODE_OPTIONS="--max-old-space-size=$MAX_HEAP" npx next dev -p $PORT </dev/null >> $LOG 2>&1 &
  SERVER_PID=$!
  echo "[$(date)] Server started (PID: $SERVER_PID)" >> $LOG
  
  # Wait for server to be ready
  for i in $(seq 1 15); do
    sleep 1
    if curl -s -o /dev/null http://127.0.0.1:$PORT/ 2>/dev/null; then
      echo "[$(date)] Server ready" >> $LOG
      break
    fi
  done
  
  # Monitor - wait for server to die
  while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 2
  done
  
  echo "[$(date)] Server died, restarting in 3s..." >> $LOG
  sleep 3
done
