---
description: auto git commit and push
---
This workflow automatically stages all files, creates a commit with a timestamp, pushes to the main branch, and retrieves GitHub actions logs.

1. Stage all files
// turbo
```bash
git add .
```

2. Commit files with timestamp
// turbo
```bash
git commit -m "AI auto commit via Antigravity [$(date +%Y-%m-%d)]"
```

3. Push to main branch
// turbo
```bash
git push origin main
```

4. You can then get GitHub job logs via the GitHub MCP:
```
Call multiple MCP tool for github and fetch logs for repository "Shiene1010/MyAntigravityTest"
```
