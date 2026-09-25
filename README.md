# WP Translation Checker

WP Translation Checker (WTC) checks WordPress translation files for supported translation-style issues before submission.

The product is designed to support locale-specific rule sets. **v1 supports Japanese (`ja`) only**, using rules based on the WordPress Japanese Translation Style Guide. Unsupported locales must not fall back to the Japanese rule set.

All PO processing is performed in the browser. The v1 scope does not upload translation files to a server or integrate directly with translate.wordpress.org.

WTC is an independent YamabikoLab project. It is not an official WordPress project and is not affiliated with or endorsed by the WordPress project.

## Development

This repository uses React, TypeScript, Vite, and Vitest.

```bash
npm ci
npm run dev
```

Repository-wide validation commands and guidance are documented in [`docs/development/testing.md`](docs/development/testing.md).

## Releases

WTC uses Semantic Versioning with `package.json` as the authoritative version source. Production deployment to GitHub Pages is triggered only by publishing a non-pre-release GitHub Release whose tag matches `v<package.json version>`.

Release changes are recorded in [`CHANGELOG.md`](CHANGELOG.md).

## Documentation

- [v1 requirements](docs/requirements/v1-requirements.md)
- [v1 design](docs/design/v1-design.md)
- [v1 architecture](docs/architecture/v1-architecture.md)
- [v1 implementation plan](docs/plans/v1-plan.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

## v1 locale scope

WTC itself is not limited to a specific locale. Locale-specific checks are selected through the locale boundary defined by the architecture.

For v1:

- supported locale: Japanese (`ja`)
- rule source: WordPress Japanese Translation Style Guide
- unsupported locales: reported as unsupported, without applying `ja` rules
- additional locale rule sets: out of scope

## Check scope

WTC checks the Japanese translation-style rules that can be judged mechanically with reasonable confidence. The complete requirement source of truth is [`docs/requirements/v1-requirements.md`](docs/requirements/v1-requirements.md), and the original reference is the [WordPress Japanese Translation Style Guide](https://ja.wordpress.org/team/handbook/translation/translation-style-guide/).

This table is a user-facing summary. A result with no Error or Warning means that WTC found no issues in the rules it checks; it does not guarantee compliance with the entire style guide.

| Guide | Item                                                             | Status             | Severity |
| ----- | ---------------------------------------------------------------- | ------------------ | -------- |
| 1-1   | Japanese punctuation                                             | ✅ Automatic check | Error    |
| 1-2   | Half-width alphanumeric characters and symbols                   | ✅ Automatic check | Error    |
| 1-3   | Half-width Arabic numerals in principle                          | 👀 Manual check    | -        |
| 1-4   | Spaces between half-width and full-width characters              | ✅ Automatic check | Error    |
| 1-5   | Half-width parentheses and surrounding spaces                    | ✅ Automatic check | Error    |
| 1-6   | Unnecessary spaces inside parentheses                            | ✅ Automatic check | Error    |
| 1-7   | Full stop at the end inside parentheses                          | ✅ Automatic check | Error    |
| 1-8   | Position of sentence-ending parentheses and full stop            | ✅ Automatic check | Error    |
| 1-9   | Unnecessary spaces around half-width numbers                     | ✅ Automatic check | Error    |
| 2-1   | Enclose proper nouns in Japanese quotation marks                 | 👀 Manual check    | -        |
| 2-2   | Enclose menu items and button labels in Japanese quotation marks | 👀 Manual check    | -        |
| 2-3   | Choose quotation marks based on quoted content                   | 👀 Manual check    | -        |
| 2-4   | Japanese expression for `<em>` / `<i>`                           | 👀 Manual check    | -        |
| 3-1   | Natural Japanese and avoiding passive voice                      | 👀 Manual check    | -        |
| 3-2   | Translate `View XX` consistently                                 | △ Partial check    | Warning  |
| 3-3   | Translate `XX are/is not allowed to...` consistently             | △ Partial check    | Warning  |
| 3-4   | Do not translate the leading `Sorry,`                            | △ Partial check    | Warning  |
| 3-5   | Omit `You / Your` naturally                                      | 👀 Manual check    | -        |
| 3-6   | Recommended forms such as 「ください / すべて / すでに」         | ✅ Automatic check | Error    |
| 3-7   | Consistency of menu items and button labels                      | 👀 Manual check    | -        |
| 3-8   | Endings and punctuation in headings, lists, and buttons          | 👀 Manual check    | -        |
| 4-1   | Long vowel marks in katakana words                               | 👀 Manual check    | -        |
| 4-2   | Long vowel rules for compound words                              | 👀 Manual check    | -        |
| 5     | Middle dot `・`                                                  | 👀 Manual check    | -        |
| 6     | `WordPress`, feature names, theme names, and plugin names        | 👀 Manual check    | -        |
| 7     | Japanese date and time notation                                  | 👀 Manual check    | -        |
| 8     | Placeholders                                                     | 👀 Manual check    | -        |

“Partial check” means WTC checks only conditions that can be identified reliably, such as specific source-text patterns. “Manual check” includes both v1 out-of-scope items and WordPress-wide checks that still require human confirmation in WTC v1.

## License

Released under the [GNU General Public License v2.0 or later](LICENSE).
