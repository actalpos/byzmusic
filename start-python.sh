#!/bin/bash

PORT=8000

echo "Starting Python server on port $PORT..."
echo "Open: http://localhost:$PORT"

python3 -m http.server $PORT