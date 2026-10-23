# web-theming-service

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

Deterministic semantic-article HTML shells and light/dark design-token CSS palettes, with numerical checks of specified token-pair contrast and color scarcity.

## Typed design-token ingress and conformance

`@red-cup-engineering/web-theming-service/design-tokens` is the common
source-reader for DTCG-styled design tokens. It interprets `$value`,
`$type`, inherited group types and aliases without inventing missing data.
It rejects cycles, references that cross token types, malformed sRGB
components, contradictory hex fallbacks, wrong dimensions and unsafe CSS
font families. It emits normalized opaque `#RRGGBB` or ordered font stacks
for the **existing** CSS theme engine; it does not own a customer's palette.

**External matched jobs, researched 2026-10-22:**

- [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)
  and [Color Module](https://www.designtokens.org/tr/2025.10/color/):
  typed token interchange, aliases and structured colors. This is a W3C
  *Community Group* report, not a W3C Recommendation.
- [Style Dictionary's DTCG support](https://styledictionary.com/info/dtcg/):
  transforms tokens to platform-specific outputs; its documentation notes
  incomplete support for all 2025.10 features. Our reader supplies precise
  refusal at this **narrow ingress**, not Style Dictionary's broad set of
  output platforms, transforms or plugins.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): numerical contrast,
  keyboard-focus and other conformance requirements are obligations of
  actual rendered components. The existing contrast computer handles
  calculated pairs; these token checks **do not** certify whole webpages.
- [Storybook visual testing](https://storybook.js.org/docs/writing-tests/visual-testing):
  screenshot-baseline comparisons protect *actual pixels*, unlike string
  assertions or this source parser. A future full receiving system must
  compare rendered mobile/desktop/print specimens to reviewed originals;
  a passing token test cannot be called an independently received brand.

The additional negative-fixture suite is runnable without a registry,
provider credentials, remote fonts or browser:

```sh
node --test test/design-tokens.test.mjs
```

A consumer such as the 561 Group content-design package supplies its own
canonically selected edition, brand tokens and layout/wordmark rules. An
upstream refactor that merely leaves the right color *words* in unused CSS
does not satisfy its customer receiving test.

