# WP Japanese Translation Checker v1 basic design

## Purpose

This document defines the user-visible behavior of WP Japanese Translation Checker（WJTC）v1.

WJTC v1 allows users to select a `.po` file, check it against the supported WordPress Japanese translation style rules, and understand the result before submitting translations.

This design describes screens, interactions, states, messages, and focus behavior. It does not define implementation structure, parsing algorithms, validation algorithms, or internal state management.

## Design principles

- Keep the flow centered on one task: select a `.po` file and review the validation result.
- Clearly separate a successful check from a file that could not be checked.
- Present Error and Warning as different confidence levels, not as equivalent failures.
- Give each finding enough context for the user to judge what needs attention.
- Treat the WordPress Japanese Translation Style Guide as the primary source and provide a path to it from each finding.
- Do not add file editing, corrected file generation, result export, direct GlotPress integration, or locale selection to v1.
- Do not rely on color alone to communicate result meaning.
- Keep selected translation content within the browser. WJTC does not send the selected translation content to an external service as part of validation.

## Primary user flow

1. The user opens WJTC.
2. The user selects a `.po` file.
3. WJTC shows the selected file and makes the check action available.
4. The user starts the check.
5. WJTC determines whether the file can be checked and whether its locale is supported.
6. If the file cannot be checked, WJTC explains why and does not present the state as a successful result.
7. If the locale cannot be determined, WJTC explains that the file could not be checked because its target locale could not be identified.
8. If the locale can be determined but is unsupported, WJTC explains which locale was detected and that v1 supports Japanese (`ja`) only.
9. If the check completes, WJTC shows a result summary.
10. If findings exist, the user reviews individual Error and Warning findings.
11. If no findings exist, WJTC clearly shows that the check completed successfully and no supported-rule issues were detected.

The same screen can contain multiple areas described below. The design does not require navigation to another page.

## Screen areas

### File input area

The file input area is the starting point for the task.

It shows:

- an action for selecting a `.po` file
- the selected file name after selection
- an action for starting the check once a file is available

Before a file is selected, the result area does not imply that a check has already taken place.

When a different file is selected, the screen treats it as a new check target. Previous results must not be mistaken for results of the newly selected file.

### Important feedback area

When WJTC cannot complete a check, the important feedback area explains the reason.

This area is used for states such as:

- the selected file cannot be read or interpreted as a checkable `.po` file
- the target locale cannot be determined
- the target locale is known but unsupported

The message should state what happened and what the user can do next, such as selecting another `.po` file.

This area must not use wording that could be interpreted as "no issues found."

### Result summary area

After a successful check, the result summary shows:

- that the check completed
- the Error count
- the Warning count
- whether no supported-rule issues were detected

The summary appears before the individual findings so the user can understand the overall result first.

Error and Warning are identified by text labels in addition to any visual styling.

### Findings area

When one or more findings exist, the findings area lists each finding in a stable, understandable order.

Each finding shows enough information for the user to answer:

- Which translation is this about?
- Is this an Error or a Warning?
- What was detected?
- Why was it detected?
- Which WordPress Japanese Translation Style Guide item is the basis for this finding?
- Where can I open the primary source?

At minimum, a finding shows:

- the target translation
- Severity: Error or Warning
- a concise description of the detected issue
- an explanation of why the item was flagged
- the relevant style guide item
- a link to the WordPress Japanese Translation Style Guide

When a rule depends on the source text, including v1 Warning rules based on English wording, the same finding also shows the source text needed to judge the result.

If the `.po` file provides additional location or reference information that helps identify the translation, it may be shown as supporting context. The design does not require such information when it is not available.

### No-findings completion area

If the check completes and neither Error nor Warning is found, WJTC shows a clear completion message.

The message communicates both facts:

- the file was checked successfully
- no issues were detected by the rules supported in v1

The message must not imply that the translation is universally correct or that the full WordPress Japanese Translation Style Guide has been satisfied.

## User-visible states

### No file selected

The user can select a `.po` file.

No validation result is shown.

### File selected

The selected file name is visible and the user can start the check.

The screen does not present any old result as belonging to this file.

### Checking

After the user starts the check, WJTC indicates that the selected file is being checked.

During this state, the user should not be able to accidentally start the same check repeatedly.

The checking indication ends when the check either completes or cannot continue.

### Check failed because the file cannot be processed

WJTC explains that the file could not be checked.

This state is separate from a successful check with zero findings.

The user can select another file and try again.

### Locale cannot be determined

The file can be read far enough to attempt locale identification, but WJTC cannot determine the target locale.

WJTC explains that the check cannot continue because the locale could not be identified.

This is treated as an input that could not be fully checked, not as an unsupported-locale result and not as a successful result.

### Unsupported locale

WJTC can identify the locale, but the locale is not supported by v1.

WJTC shows the detected locale when it is available and explains that v1 checks Japanese (`ja`) only.

No Japanese-specific validation result is presented for that file.

### Check completed with findings

WJTC shows the summary and the findings.

The user can distinguish Error from Warning and can inspect the reason and style-guide basis for each item.

### Check completed with no findings

WJTC shows the summary and the no-findings completion message.

The user can distinguish this state from every state where the file was not checked.

## Error and Warning presentation

### Error

Error means WJTC can identify the issue with high mechanical confidence under the supported rule.

The finding uses the explicit label **Error**.

The presentation may use additional visual emphasis, but the label must carry the meaning without relying on color alone.

### Warning

Warning means the item may be correct depending on context or an exception and should be reviewed by a person.

The finding uses the explicit label **Warning**.

The explanation should make it clear that Warning is a review prompt rather than a statement with the same certainty as Error.

For source-dependent Warning rules, the user can inspect both the source text and translation in the same finding.

## Finding detail behavior

A finding should be understandable without prior knowledge of WJTC rule names or style-guide numbering.

The finding therefore presents the human-readable issue first and uses the style-guide item as supporting traceability.

A typical reading order is:

1. Severity
2. What translation was flagged
3. Source text when needed for the rule
4. What was detected
5. Why WJTC flagged it
6. The related style-guide item
7. A link to the primary style-guide source

The style-guide link points to the WordPress Japanese Translation Style Guide:

https://ja.wordpress.org/team/handbook/translation/translation-style-guide/

## Focus and important feedback

Focus changes are used only when they help the user reach an important result or error.

### After an unsuccessful check

When the check cannot continue because of an invalid file, an unknown locale, or an unsupported locale, focus moves to the important feedback so keyboard and assistive-technology users immediately reach the reason.

### After a successful check

When the check completes successfully, focus moves to the result summary.

The user can then continue through the findings in document order.

### After selecting a different file

Selecting another file does not unexpectedly move focus away from the file-selection task. The user remains in control of when to start the next check.

## Repeated checks and consistency

Under the same supported rule conditions, checking the same `.po` file again produces the same user-visible result:

- the same Error count
- the same Warning count
- the same set of findings
- the same Severity for each finding
- the same explanations and style-guide references
- the same stable finding order

The presentation must not vary based on timing, previous checks, or unrelated prior user actions.

## Locale behavior

v1 supports Japanese (`ja`) only.

WJTC applies only the rules associated with the detected target locale.

For v1:

- Japanese (`ja`) uses the v1 Japanese style rules.
- A known non-Japanese locale is shown as unsupported.
- A file whose locale cannot be determined is shown as unable to be checked.
- The user does not manually choose or override the locale.

This keeps the v1 user flow simple while preserving a clear boundary for future locale support.

## v1 boundaries

The following are not part of this design:

- editing translations inside WJTC
- automatically correcting a `.po` file
- generating a corrected `.po` file
- exporting the validation result
- sending changes to translate.wordpress.org
- direct GlotPress integration
- selecting a locale manually
- checking non-Japanese locale rules
- AI evaluation of translation quality
- general Japanese spell checking
- replacing the WordPress Japanese Translation Style Guide

## Requirements traceability

| Requirement | User-visible design |
| --- | --- |
| FR-01 | File input area and primary user flow allow a user to select and check a `.po` file. |
| FR-02 | Invalid-file and locale-undetermined states clearly say that the file could not be checked and are separated from successful results. |
| FR-03 | Successful checks produce findings for the Japanese rules defined as v1 scope. |
| FR-04 | Result summary shows completion, Error count, Warning count, and no-findings status. |
| FR-05 | Each finding shows the target translation and available supporting context needed to identify it. |
| FR-06 | Each finding shows Severity, what was detected, and why it was flagged; source text is included when needed to judge the rule. |
| FR-07 | Each finding identifies the relevant style-guide item and provides a link to the WordPress Japanese Translation Style Guide. |
| FR-08 | A dedicated no-findings completion state clearly distinguishes a successful zero-finding result from an empty or failed state. |
| FR-09 | Locale behavior applies only the rules for the detected locale; v1 applies Japanese rules only to Japanese files. |
| FR-10 | A known unsupported locale is shown as unsupported and is never presented as a successful no-findings result. |
| QR-01 | The design states that selected translation content remains in the browser and is not sent to an external validation service. |
| QR-02 | Repeated checks with the same file and rule conditions produce the same counts, findings, severity, explanations, references, and stable order. |
| QR-03 | Findings use plain-language explanations and source/style-guide context so users do not need prior knowledge of WJTC internals or guide numbering. |

## Completion view

The v1 experience is complete when a user can move from selecting a `.po` file to one of two clearly distinguishable outcomes:

- the file was successfully checked and the result can be understood, or
- the file could not be checked and the reason can be understood

Within a successful result, the user can then distinguish between:

- Error findings
- Warning findings
- no supported-rule findings

and can trace each finding back to the relevant WordPress Japanese Translation Style Guide item.
