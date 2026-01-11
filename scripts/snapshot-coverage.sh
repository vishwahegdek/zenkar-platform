#!/bin/bash

# Ensure directory exists
mkdir -p tests/history

DATE=$(date +%Y-%m-%d)
REPORT_FILE="tests/history/${DATE}_coverage.md"

echo "# Coverage Report - $DATE" > $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## Backend" >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE
cd backend
# Run coverage and capture output
npx jest --coverage --passWithNoTests | grep -E "All files|Stmts" >> ../$REPORT_FILE
cd ..
echo "\`\`\`" >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "## Frontend" >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE
cd frontend
npx vitest --coverage | grep -E "All files|Stmts" >> ../$REPORT_FILE
cd ..
echo "\`\`\`" >> $REPORT_FILE

echo "Snapshot generated: $REPORT_FILE"
