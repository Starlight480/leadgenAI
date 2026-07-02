# Cron Job Model Upgrade Guide

## Problem
The 5 Report_ cron jobs use `google/gemma-4-31b-it:free` which is rate-limited and causing failures.

## Solution
Change the model to `deepseek/deepseek-chat-v3-0324` (very cheap at ~$0.27/M tokens).

## Jobs to Update

### Report Cron Jobs (change model)

| Job ID         | Current Model                     | Target Model                  |
|----------------|-----------------------------------|-------------------------------|
| 817be82b3ca7   | google/gemma-4-31b-it:free        | deepseek/deepseek-chat-v3-0324 |
| 02fb5d5f2e3d   | google/gemma-4-31b-it:free        | deepseek/deepseek-chat-v3-0324 |
| e8c3e7789476   | google/gemma-4-31b-it:free        | deepseek/deepseek-chat-v3-0324 |
| 20acfb230078   | google/gemma-4-31b-it:free        | deepseek/deepseek-chat-v3-0324 |
| 34f030cc13bf   | google/gemma-4-31b-it:free        | deepseek/deepseek-chat-v3-0324 |

### How to Update
Run via Hermes CLI:
```bash
hermes cron edit <job-id> --model deepseek/deepseek-chat-v3-0324
```

### Leadgen Followups Job (no change needed)
| Job ID         | Status   | Notes                       |
|----------------|----------|-----------------------------|
| 70353f2e20d9   | ✅ OK    | Working fine — no changes    |
