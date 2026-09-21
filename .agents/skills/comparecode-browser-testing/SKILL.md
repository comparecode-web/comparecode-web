---
name: comparecode-browser-testing
description: Test CompareCode through Playwright MCP, browser automation, responsive checks, or a visible local preview while keeping agent browser sessions isolated and freely resizable.
---

# CompareCode Browser Testing

Keep automated and agent-owned browser work separate from the user's browsers, profiles, tabs, cookies, and sessions.

## Prepare the Application

1. Confirm dependencies are available, then start the application with `npm run dev` when no suitable local server is already running.
2. Read the reported URL instead of assuming the port. The usual local URL is `http://localhost:3000`.
3. Reuse only a server and browser process that is clearly owned by the current task or explicitly offered by the user.

## Use an Isolated MCP Browser

- Prefer Playwright MCP isolated mode for disposable browser automation:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated"]
    }
  }
}
```

- The equivalent direct server command is:

```powershell
npx @playwright/mcp@latest --isolated
```

- Do not use extension mode, attach to a personal CDP endpoint, or reuse the user's normal browser data directory unless the user explicitly requests access to that existing session for the current task.
- When state must persist across MCP sessions, use a dedicated automation-only `--user-data-dir`. Never point it at a personal browser profile.
- Do not set a global fixed viewport, `--window-size`, kiosk mode, or another launch constraint that prevents normal resizing or maximum window use. A task-specific viewport is allowed only for a clearly identified responsive breakpoint check.

## Launch a Separate Visible Browser on Windows

When a visible, freely resizable preview is useful, launch Chrome with a unique temporary profile and no fixed size:

```powershell
$previewUrl = 'http://localhost:3000/'
$compareCodePreviewProfile = Join-Path $env:TEMP ("comparecode-browser-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $compareCodePreviewProfile | Out-Null
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' `
  --user-data-dir=$compareCodePreviewProfile `
  --no-first-run `
  --no-default-browser-check `
  --new-window `
  $previewUrl
```

If Chrome is installed elsewhere, resolve its executable without changing the isolation flags. The dedicated profile ensures Chrome does not reuse the user's existing process and tabs.

## Validate and Clean Up

- For a full application smoke audit, cover `/`, `/text`, `/image`, `/markdown`, `/history`, and `/settings`. For focused work, test the affected route plus shared-shell consumers that can regress.
- Exercise the changed behavior, important failure paths, keyboard and focus behavior, and relevant responsive layouts. Check browser console errors and warnings, material request failures, and page-level horizontal overflow when applicable.
- Capture only evidence needed for the task. Treat `.playwright-mcp` as disposable tool output; do not reference its files from product code or documentation.
- Close or stop only browser and server processes owned by the task. Never terminate every Chrome, Edge, Node, or browser process.
- Delete a temporary browser profile only after its owned browser process has exited. Do not delete persistent automation profiles.
- Remove task-created screenshots, snapshots, traces, and temporary profiles when they are no longer needed. Do not delete pre-existing artifacts unless the user explicitly includes cleanup in scope.
- Report the URL and routes tested, representative viewport sizes, whether MCP isolated mode or a dedicated profile was used, console or request failures, and any relevant validation gaps.
