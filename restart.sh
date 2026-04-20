#!/bin/bash
# CHROME DNA Server Restart Script
# Call this to restart the dev server reliably

# Kill existing
pkill -f 'next dev' 2>/dev/null
pkill -f cpulimit 2>/dev/null
sleep 2

# Start server with memory limit
cd /home/z/my-project
NODE_OPTIONS="--max-old-space-size=512" npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 &

# Wait for startup
for i in $(seq 1 15); do
  sleep 1
  if curl -s -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
    echo "Server ready after ${i}s"
    exit 0
  fi
done

echo "Server failed to start within 15s"
exit 1
