# Flowchart Legend and Standards

Use this as the official legend for all thesis flowcharts.

## Symbol Mapping

1. Terminator (Start/End)
- Shape: Oval
- Use: Start and End points only
- Rule: One Start per chart; at least one End

2. Process
- Shape: Rectangle
- Use: Action or operation steps
- Label style: Verb-first (for example, "Validate Payment")

3. Decision
- Shape: Diamond
- Use: Conditional branch
- Rule: Exactly two labeled exits (`Yes/No` or `True/False`) unless justified

4. Input/Output
- Shape: Parallelogram
- Use: Data entry or displayed/returned data

5. Predefined Process (Subprocess)
- Shape: Rectangle with double vertical edges
- Use: Referenced routine handled elsewhere

6. Document
- Shape: Rectangle with wavy bottom
- Use: Generated certificate, report, receipt, or printed form

7. Display
- Shape: Display symbol (curved-bottom display)
- Use: UI/screen output only
- Rule: Do not replace with a plain process rectangle

8. Data Store
- Shape: Cylinder
- Use: Database or persistent storage

9. On-page Connector
- Shape: Small circle
- Use: Continue flow on same page without line crossing
- Rule: Add connector ID (for example, A, B, C)

10. Off-page Connector
- Shape: Pentagon (home-plate)
- Use: Continue flow to another page
- Rule: Include reference like `A1 -> Page 2 A1`

11. Flowline
- Shape: Arrowed line
- Use: Direction of control/data flow
- Rule: Prioritize top-to-bottom, then left-to-right

12. Annotation
- Shape: Bracket/comment
- Use: Clarifying note only
- Rule: Never use as executable process step

## Global Drawing Rules

1. Keep each box text short (2 to 5 words preferred).
2. Keep direction consistent; avoid reverse arrows when possible.
3. Avoid line crossings. Use connectors instead.
4. Keep shape semantics consistent across all figures.
5. Put legend on each major page or reference one global legend figure.
6. Number every figure and include a matching caption.
