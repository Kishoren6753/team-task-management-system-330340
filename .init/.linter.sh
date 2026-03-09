#!/bin/bash
cd /home/kavia/workspace/code-generation/team-task-management-system-330340/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

