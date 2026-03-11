# Thesis Flowchart Implementation Pack

This folder contains strict-flowchart standards and ready-to-draw specifications for the Kiosk thesis.

## Files

- `flowchart-legend.md` - Official symbol legend and strict drafting rules.
- `figure-captions.md` - Figure title/caption templates for manuscript and defense deck.
- `diagram-specs.md` - Implementation-ready flow definitions for required diagrams.
- `review-checklist.md` - Pre-defense audit checklist for notation correctness.

## Scope

These artifacts are intentionally strict and use ANSI/ISO-style flowchart conventions to fit panel expectations.

## Main Diagram Set

1. System Context (high-level data/process interaction)
2. Citizen Request Flow (kiosk/mobile journey)
3. Admin Operations Flow (dashboard operations)
4. Request Lifecycle State Flow
5. Payment Integration Flow
6. Print Integration Flow
7. **NEW:** Deployment Architecture (physical infrastructure)
8. **NEW:** Hardware-Software Interface (embedded systems layer)
9. **NEW:** Data Flow Diagram L0+L1 (systems decomposition)
10. **NEW:** Error Handling & Recovery (resilience design)
11. **NEW:** Authentication & Security Flow (cryptographic protections)

## Implementation Notes

- Do not mix UML activity symbols with classic flowchart symbols in the same figure.
- If your drawing tool has multiple symbol libraries, lock one standard before drawing.
- Use off-page connectors for multi-page charts instead of long crossing arrows.
