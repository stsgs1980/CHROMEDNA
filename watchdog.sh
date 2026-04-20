#!/bin/bash
while true; do
  cd /home/z/my-project
  npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 &
  SERVER_PID=$!
  sleep 8
  # Check if alive
  if curl -s -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
    echo "$(date): Server started PID=$SERVER_PID" >> /tmp/watchdog.log
    # Wait for it to die
    while kill -0 $SERVER_PID 2>/dev/null; do
      sleep 5
    done
    echo "$(date): Server died, restarting..." >> /tmp/watchdog.log
  else
    echo "$(date): Server failed to start, retrying..." >> /tmp/watchdog.log
    kill $SERVER_PID 2>/dev/null
  fi
  sleep 2
done
