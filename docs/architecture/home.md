# Home

## Ownership and SEO

The production route `app/(workspace)/page.tsx` composes `components/home/HomePage.tsx` with the existing SoftwareApplication JSON-LD. Metadata remains owned by `config/seo.ts`, including the canonical URL, description and social previews. The four FAQ answers and tool links are present in the server-rendered HTML.

The selected Compact Spectrum design with Soft wash on the tool cards and Wash on History and Settings is now the production Home. The temporary `/dev/home` and `/dev/home/workspace-wash` routes have been removed. Their development-only guards and noindex metadata do not belong on the Home route.

## Appearance and interaction

Home-specific styles live in `components/home/home.module.css`. Theme colors use existing tokens. The tool and workspace links share a feathered background that expands from the left over 440 ms while its opacity changes over 300 ms. Borders and workspace icon colors transition over 280 ms. Cards, text and SVG geometry remain stationary; decorative layers cannot intercept clicks.

Keyboard focus retains the highlight and visible outline. Hover motion applies only to fine pointers with hover support. Reduced-motion preferences disable transitions while preserving immediate feedback. Icon size remains `1.5rem`, with no blur, scale or translation on icons or their containers.

The header identifies CompareCode as free and open source. Its subtitle names text, code, images, Markdown and QR codes. History and Settings are named explicitly. There are no lock icons, privacy badge or decorative dot above the title.

The shared `components/seo/FaqAccordion.tsx` renders the four approved answers about free access, everyday text, local comparison and reopening saved comparisons. The wording avoids em and en dashes. Home-scoped styles give question headers a 0.5rem radius and rows 0.25rem of vertical padding. Answers retain the plain surface. Other pages' FAQ styling remains unchanged.

The layout originated in the Spectrum study, informed by [Linear's hierarchy and surfaces](https://linear.app/now/behind-the-latest-design-refresh), [Vercel's sidebar workspace](https://vercel.com/changelog/dashboard-navigation-redesign-rollout), and [Notion's workspace navigation](https://www.notion.com/help/navigate-with-the-sidebar). No reference screenshots or external artwork are shipped.

## Validation

Check the production Home's initial HTML for its canonical URL, metadata, JSON-LD, tool links and FAQ answers. It must remain indexable. Retired Home preview routes must return 404.

Check light and dark themes, narrow layouts, enlarged text, hover interruption, keyboard focus, real navigation and reduced motion. Reuse the single visible, freely resizable preview window. Run automated viewport checks headlessly and allow sidebar transitions to settle before measuring.
