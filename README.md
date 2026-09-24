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

## License

Released under the [GNU General Public License v2.0](LICENSE).
