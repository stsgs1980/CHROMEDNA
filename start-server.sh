#!/bin/bash
# Kill any existing server
pkill -f 'next dev' 2>/dev/null
sleep 2

# Start with memory limit
cd /home/z/my-project && NODE_OPTIONS="--max-old-space-size=768" npx next dev -p 3000 </dev/null >/tmp/zdev.log 2>&1 &

# Wait for startup
for i in $(seq 1 10); do
  sleep 1
  if curl -s -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; then
    echo "Server started successfully"
    exit 0
  fi
done

echo "Server failed to start"
exit 1
