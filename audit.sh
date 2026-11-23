#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$HOME/omnicut-studio}"

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "Error: Project directory '$PROJECT_DIR' does not exist." >&2
  exit 1
fi

cd "$PROJECT_DIR"
echo "=== Auditing $PROJECT_DIR ==="

# 1. TypeScript strict check
echo "[1/3] Running TypeScript compiler check..."
npx tsc --noEmit || echo "Warning: TypeScript errors found."

# 2. Scan for risky type overrides ('as any', '@ts-ignore')
echo "[2/3] Scanning for risky patterns..."
grep -rnE "as any|@ts-ignore" src/ || echo "Clean: No 'as any' or '@ts-ignore' found."

# 3. Check high-severity npm vulnerabilities
echo "[3/3] Checking npm audit..."
npm audit --audit-level=high || echo "Warning: High-severity npm vulnerabilities detected."

echo "=== Audit Complete ==="
