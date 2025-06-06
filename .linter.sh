#!/bin/bash
cd /home/kavia/workspace/code-generation/vintagechrono-32488-1f946b94/vintage_chrono_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

