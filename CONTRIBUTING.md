# Contributing to RevScope

Thanks for helping make the field guide more useful. Small, well-sourced changes are welcome.

## Ways to contribute

- Add or improve a tool entry in `data/tools.json`.
- Improve a workflow or suggest a missing category.
- Fix a usability, accessibility, or data-quality issue in the static catalog.
- Improve the README, contribution guidance, or translations.

For a new tool, open an issue first if its fit is unclear. Include the task it supports, supported platforms, current license or pricing information, official project and documentation links, and any important caveat. Do not submit download mirrors, cracked software, or links to unauthorized samples.

## Editing the catalog

Each tool is one JSON object with these fields:

| Field | Meaning |
| --- | --- |
| `id` | Stable lowercase identifier used by saved items and workflows |
| `name` | Product or project name |
| `category` | Existing category, or a proposed category with a reason |
| `platform` | Platforms stated by the project's official source |
| `license` | Current license, or a clear note when the tool is proprietary |
| `cost` | Free, paid, or a defined free tier; verify from an official source |
| `level` | Beginner, Intermediate, or Advanced; explain unusual choices in the PR |
| `summary` | Neutral description of the tool's purpose |
| `bestFor` | A concrete task or workflow step |
| `tags` | Short searchable labels |
| `url` / `docs` | Official project and documentation URLs |

Keep descriptions factual and concise. RevScope does not rank or endorse products. Prefer primary sources; if a detail is uncertain, state that in your pull request instead of guessing.

## Pull requests

1. Keep one change focused and describe the user need it addresses.
2. Link any related issue and cite sources for tool details.
3. Check JSON syntax and review the page at desktop and narrow widths.
4. Do not include binaries, private data, API keys, malware samples, or third-party copyrighted content without permission.

By submitting a contribution, you agree that your contribution is provided under this repository's MIT License.
