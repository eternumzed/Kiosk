# Flowchart Review Checklist

Use this checklist before submission and before defense.

## Symbol Compliance

- [ ] Start/End uses oval terminator only.
- [ ] Decision points use diamond only.
- [ ] All decisions have labeled exits.
- [ ] Display output uses display symbol, not rectangle.
- [ ] Off-page continuation uses pentagon connector with ID.
- [ ] Data storage uses cylinder where applicable.

## Structural Quality

- [ ] Exactly one Start per figure.
- [ ] At least one valid End per path.
- [ ] No dead-end nodes without outgoing flow unless End.
- [ ] Flow direction is consistent and readable.
- [ ] Crossing lines are minimized using connectors.

## Thesis Alignment

- [ ] Diagram steps match real system modules.
- [ ] Payment flow includes webhook/callback validation.
- [ ] Print flow includes print-agent handoff and failure branch.
- [ ] Request lifecycle matches backend statuses used in implementation.
- [ ] Figure caption is complete and numbered.

## Defense Readiness

- [ ] Legend appears in figure page or referenced globally.
- [ ] Labels are concise and readable at projected size.
- [ ] Diagram can be explained in under 90 seconds.
- [ ] Team members use consistent terminology.

## Endpoint Detail Diagrams (Figures X.12–X.25)

- [ ] Each diagram header states the HTTP method, full path, and source controller file.
- [ ] Every external call (Paymongo, Google Drive, TextBee, MongoDB) uses Predefined Process or Data Store symbol, not a plain Process box.
- [ ] The `isFreeRequest` decision branch is present in Figure X.14 with both outcome labels (amount=0 vs amount>0).
- [ ] Figure X.15 (webhook handler) has a bordered annotation: "All branches return HTTP 200."
- [ ] Figure X.16 includes a dashed-border Process box labeled "FINALLY — always executes" for the temp file cleanup step.
- [ ] Figure X.17 shows three sequential identifier lookup attempts with distinct decision diamonds for each.
- [ ] Figure X.18 has a platform Decision diamond at the top splitting into exactly two labeled branches: Linux and Windows.
- [ ] Figure X.19 shows the pendingJobs Map as a Data Store shape and the heartbeat logic as an annotation in the right margin.
- [ ] Figure X.25 includes the full BASE_FEES table as an annotation box adjacent to the lookup step.
- [ ] All X.12–X.25 figures cross-reference back to the relevant macro-flow diagram (e.g., "See also Figure X.2, step 7") via annotation.
