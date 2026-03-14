# Getting Started: Flowchart Implementation Roadmap

This is your step-by-step execution guide. Follow it sequentially.

---

## Phase 1: Preparation (15 minutes)

### Step 1: Review the Symbol Legend
- **Read:** [flowchart-legend.md](flowchart-legend.md)
- **Action:** Print or bookmark the 12-symbol table. Have it visible while drawing.
- **Why:** Every box, diamond, and connector must follow strict ANSI notation. No shortcuts.

### Step 2: Assign Drawing Tools & Roles
- **Tool Checklist:**
  - [ ] Draw.io (free, web-based) OR Visio (paid, desktop) OR LucidChart
  - [ ] If Draw.io, enable Mermaid plugin or use flowchart shape library
  - [ ] If Visio, use "Flowchart" template
- **Team Assignment (11 diagrams total):**
- **Team Assignment (25 diagrams total):**
  - [ ] Designer 1: Figures X.1, X.4, X.7 (context, lifecycle, deployment)
  - [ ] Designer 2: Figures X.2, X.5, X.9 (citizen, payment, DFD)
  - [ ] Designer 3: Figures X.3, X.6, X.10 (admin, print, error handling)
  - [ ] Designer 4: Figures X.8, X.11 (hardware interface, security)
  - [ ] Designer 5: Figures X.12, X.13, X.14, X.15 (request + payment endpoints)
  - [ ] Designer 6: Figures X.16, X.17, X.18, X.19, X.20 (PDF, print, queue endpoints)
  - [ ] Designer 7: Figures X.21, X.22, X.23, X.24, X.25 (auth + fee policy)
  - [ ] Reviewer: One person to audit all 25 before export

### Step 3: Set Up Canvas & Environment
- **All Designers:**
  - [ ] Open your tool and create 6 new sheets/pages (one per diagram)
  - [ ] Set page size: A3 landscape for manuscript; 16:9 for slides
  - [ ] Enable grid and snap-to-grid (spacing: 20-40px)
  - [ ] Create a master legend layer (copy [flowchart-legend.md](flowchart-legend.md) as reference on each sheet OR link one global legend)

---

## Phase 2: Drawing (2–3 hours per designer, ~6–8 hours total)

### For Each Figure (X.1 through X.11)

**Step 1: Reference the Draw Order**
- **Open:** [diagram-specs.md](diagram-specs.md) and navigate to the relevant draw-order section (e.g., "Draw-Order Script: System Context" for Figure X.1)
- **Highlight:** The build order steps so you follow them sequentially.

**Step 2: Optional—Visualize First**
- **Optional:** Open [mermaid-diagrams.md](mermaid-diagrams.md) and copy the corresponding Mermaid code block
- **Paste into:** https://mermaid.live to preview the logical flow
- **Use as:** A visual scaffold—NOT your final diagram (Mermaid uses modern UML symbols, not strict ANSI)

**Step 3: Draw Box by Box**
- **Follow the step numbers** in [diagram-specs.md](diagram-specs.md) for your figure
- **Place each shape** with the exact label provided
- **Snap to grid** for alignment
- **Draw connectors** between shapes with labeled arrows
- **Double-check:** Every shape is the correct ANSI symbol (terminate X.1 step 1 should be an oval, not a rectangle)

**Step 4: Connectivity & Labels**
- **After placing all shapes:**
  - All arrows have clear labels (1–3 words)
  - Decision diamonds have exactly two exits (`Yes/No` or `True/False`)
  - Bidirectional links are two separate arrows, not one double-headed arrow
  - Off-page connectors use IDs (`A1`, `B2`, etc.) and reference the target page

**Step 5: Style & Polish**
- **Consistent line weight:** All arrows same thickness
- **Consistent arrowheads:** All arrows use same arrowhead style (e.g., triangle)
- **No line crossings:** If lines cross, reroute with elbow connectors or use on-page connector circles
- **Text formatting:** All labels same font, size, color (e.g., Arial 10pt, black)

**Step 6: Quick Self-Check**
- [ ] Does the flow go top-to-bottom, left-to-right naturally?
- [ ] Can you walk through the diagram in 90 seconds without getting lost?
- [ ] Every process box has one entry and one exit (except decisions/terminators)?
- [ ] No dead-end paths except End terminators?

---

## Phase 3: Validation & Auditing (30 minutes)

### Pre-Submission Checklist

**For Each Figure, Use:** [review-checklist.md](review-checklist.md)

- [ ] **Symbol Compliance**
  - [ ] Start/End uses oval terminator only
  - [ ] Decision uses diamond only
  - [ ] All decisions have labeled exits
  - [ ] Display uses display symbol (curved bottom), not rectangle
  - [ ] Off-page connectors use pentagon with ID
  - [ ] Data stores use cylinder

- [ ] **Structural Quality**
  - [ ] One Start per figure
  - [ ] At least one valid End per path
  - [ ] No missing flow arrows
  - [ ] Flow is readable and follows logical sequence
  - [ ] No undocumented line crossings

- [ ] **Thesis Alignment**
  - [ ] Steps match real system modules (verify against backend code if needed)
  - [ ] Payment flow includes webhook verification step
  - [ ] Print flow includes print-agent handoff and failure branch
  - [ ] Request lifecycle matches backend status values
  - [ ] Figure caption is complete and numbered

- [ ] **Export Readiness**
  - [ ] Diagram fits on one page (or properly split across pages with connectors)
  - [ ] Text is readable at 50% zoom (manuscript) and 100% zoom (slide deck)
  - [ ] No tool-specific artifacts (e.g., lock icons, layer badges)

---

## Phase 4: Finalization & Export (30 minutes)

### Step 1: Assign Captions
- **For each figure**, copy from [figure-captions.md](figure-captions.md)
- **Example:**
  - Figure X.1. System Context Flowchart. Shows external actors, major software components, and data exchanges across the kiosk ecosystem.

### Step 2: Export Formats
- **For Manuscript:**
  - Format: SVG (scalable, crisp text)
  - Resolution: 300 DPI equivalent
  - File name: `Figure-X.Y-[name].svg`
- **For Defense Slides:**
  - Format: PNG
  - Resolution: 300 DPI
  - File name: `Figure-X.Y-[name]-slide.png`

### Step 3: Create a Gallery File
- **Create:** A master document (PDF or Word) with all 6 diagrams + captions
- **Use:** For internal review before submitting to adviser

### Step 4: Prepare Defense Talking Points
- **Reference:** [defense-scripts.md](defense-scripts.md)
- **Assign:** Each designer rehearses their two figures (90 seconds each)
- **Practice:** Present diagrams to team before defense date

---

## Phase 5: Quality Gate (Before Adviser Submission)

### Peer Review Checklist

**Reviewer reads [defense-scripts.md](defense-scripts.md) 90-second script, then:**
- [ ] I can explain this diagram in under 90 seconds without ambiguity
- [ ] The diagram matches the flow described in the script
- [ ] Every symbol is ANSI-compliant per the legend
- [ ] Text labels are concise and consistent in style
- [ ] Diagram can be understood by a non-software engineer (hardware focus)

**Designer updates based on feedback, then:**
- [ ] Reexport SVG and PNG
- [ ] Update master gallery
- [ ] Flag as ready for submission

---

## Files Provided & Your Next Actions

| File | Purpose | Your Action |
|------|---------|-------------|
| [flowchart-legend.md](flowchart-legend.md) | Symbol definitions | Print and display while drawing |
| [diagram-specs.md](diagram-specs.md) | Exact draw orders | Follow step-by-step per figure |
| [mermaid-diagrams.md](mermaid-diagrams.md) | Logic scaffolds | Optional visualization reference |
| [figure-captions.md](figure-captions.md) | Manuscript captions | Assign to each figure after drawing |
| [defense-scripts.md](defense-scripts.md) | 90-sec talking points | Rehearse before defense |
| [review-checklist.md](review-checklist.md) | Pre-submission audit | Check all 6 figures before export |

---

## Estimated Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| Preparation | 15 min | Team lead |
| Drawing (11 figures) | 6–8 hours | All designers |
| Validation & peer review | 30–45 min | Designated reviewer |
| Finalization & export | 45 min | All designers |
| **Total** | **~8–9 hours** | **Team** |

---

## Success Criteria

By end of Phase 5, you will have:
1. **Eleven ANSI-compliant diagrams** matching your system behavior:
   - Process flows (X.1–X.6): Context, citizen, admin, lifecycle, payment, print
   - Systems architecture (X.7–X.9): Deployment, hardware-software interface, data flows
   - Resilience & security (X.10–X.11): Error handling, authentication & security
2. Captions for each figure ready for manuscript inclusion
3. 90-second defense scripts memorized and rehearsed for all 11 diagrams
4. SVG files for manuscript, PNG files for slides
5. Confidence to defend flowchart choices and Computer Engineering aspects to your panel

---

## Expanded Package Coverage

Your **11-diagram package** now emphasizes:
- **Software engineering:** User flows, state machines, integration patterns
- **Computer Engineering:** Hardware-software interface, deployment architecture, protocol layers
- **Systems design:** Data flows, external integrations, system decomposition
- **Resilience:** Error handling, failure recovery, admin escalation
- **Security:** Authentication, cryptographic verification, attack prevention

---

## Troubleshooting Quick Reference

**Problem:** "My line is crossing another line."
**Solution:** Use on-page connector circles (`A`, `B`, etc.) or reroute the path around existing shapes. See [flowchart-legend.md](flowchart-legend.md) connector rules.

**Problem:** "I'm not sure which symbol to use for this action."
**Solution:** Search [flowchart-legend.md](flowchart-legend.md) for your action type. Use the symbol table to find the right shape.

**Problem:** "My decision has three exits."
**Solution:** Every decision must have exactly two exits (Yes/No or True/False). If you need three branches, split into two sequential decisions or restructure the logic.

**Problem:** "The diagram spans two pages."
**Solution:** That's OK. Use off-page pentagon connectors with IDs (see step 7 and 10 in [diagram-specs.md](diagram-specs.md) for examples). Make sure connection points are clearly labeled.

**Problem:** "My team members drew the same figure differently."
**Solution:** All drawings must follow [flowchart-legend.md](flowchart-legend.md) and [diagram-specs.md](diagram-specs.md). Use peer review ([review-checklist.md](review-checklist.md)) to enforce consistency before final export.

---

## Next Step

1. **Assign roles** (prepare phase) using the expanded assignment for 11 figures.
2. **Print [flowchart-legend.md](flowchart-legend.md)** and post on team workspace.
3. **Open your drawing tool** and start with Figure X.1 (System Context) or Figure X.7 (Deployment) to warm up.
4. **Follow [diagram-specs.md](diagram-specs.md) section "Draw-Order Script"** for your assigned figure—box by box.
5. **Reference [mermaid-diagrams.md](mermaid-diagrams.md)** if you need to visualize the logic before drawing.

**You're ready. Start drawing. Target: Complete all 11 in 8–9 hours across your team.**
