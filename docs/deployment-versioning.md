# Deployment versioning

`npm run build` runs `scripts/build.mjs`, which captures the deployment build's start time once through `scripts/build-version.mjs` and passes `NEXT_PUBLIC_APP_VERSION` to Next.js. Next.js embeds this public value in the build. The Home footer is its display owner; Settings does not display application or license information.

## Version contract

- Generate a version only when `VERCEL=1` and `VERCEL_ENV` is `production` or `preview`. Vercel custom environments using the preview build context follow the same rule.
- Use UTC and zero-padded `YYYYMMDD.HHmm`. Render exactly `Version <value>`, without a timezone or Git identifier.
- The timestamp describes build start, not the instant traffic switches to the deployment. Minute precision intentionally allows two builds started in the same minute to share the visible version.
- Local development and local/CI verification builds display `Development`. The build wrapper clears any inherited `NEXT_PUBLIC_APP_VERSION` outside a deployment. Do not configure that variable manually in `.env` files or hosting settings.
- A new Vercel build generates a new timestamp. Refreshing, restarting with `npm run start`, or serving the same build again preserves its embedded version. Reusing an existing deployment, including rollback, preserves its original version; an operation that rebuilds generates a new one. A failed build does not replace the current deployment.
- `package.json` retains its npm package version, which is independent of the deployed application's version. Deployment builds do not modify tracked files or browser persistence versions.

## Vercel setup

`vercel.json` sets the Vercel Build Command to `npm run build`, overriding the dashboard's build command; running `next build` directly bypasses version generation. Enable access to Vercel System Environment Variables so `VERCEL` and `VERCEL_ENV` are available. This repository does not change dashboard settings or deployment branches automatically.

Keep `npm run start` as a serving command only. Do not add timestamp generation to `next.config.ts`, React rendering, `prestart`, or `predev`. A prebuilt deployment carries the version from the build that produced it; rebuilding after changing a runtime environment variable is necessary to change embedded public values.

## Project links

`config/project.ts` owns the GitHub and Ko-fi URLs used by the Home footer and navigation sidebar. Keep its Ko-fi destination consistent with `.github/FUNDING.yml`. The sidebar stacks GitHub and support links vertically, with labels when expanded and on mobile; collapsed desktop navigation retains both icons and hides their labels. Both surfaces use `linkColors` and the 1.25rem `linkIcon` from `components/ui/controlStyles.ts`. Support text and filled hearts inherit the muted rose `support` token, switching together to the stronger theme-aware `support-hover` token on hover or keyboard focus; other links use the neutral palette. Link backgrounds remain neutral. Home retains both labelled links and the existing open-source license download, without trailing arrow icons.

Use native external links opening a new tab, without a Ko-fi embed, payment script, or sidebar tooltip. The links leave the current workspace open.

## Validation

Test UTC conversion and padding, production/preview eligibility, and the non-deployment fallback. Verify the Home links and exact version text, and inspect expanded/collapsed desktop navigation, the mobile drawer, light/dark themes, and enlarged text. For build integration changes, build with a Vercel deployment context, start that artifact twice, and check that both runs serve the same version. Run the normal lint, test, and build checks as well.
