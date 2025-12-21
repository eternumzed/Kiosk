# Backend PDF Conversion Tips

If DOCX footers or headers appear duplicated in generated PDFs, the issue is typically in LibreOffice/UNO’s DOCX→PDF conversion. A reliable workaround is to convert DOCX to ODT first, then ODT to PDF.

## Enable the ODT path

Set the environment variable `PDF_DOCX_VIA_ODT=true` before starting the backend. This enables a DOCX→ODT→PDF pipeline using `soffice` with the explicit `writer_pdf_Export` filter.

Example (PowerShell):

```powershell
$env:PDF_DOCX_VIA_ODT = "true"
node backend/app.js
```

Example (Cmd):

```cmd
set PDF_DOCX_VIA_ODT=true
node backend\app.js
```

Requirements:
- LibreOffice installed and `soffice` available on PATH (Windows: `soffice.exe`).
- Templates are DOCX files in `templates/`.

Notes:
- You can also try exporting with `--convert-to pdf:writer_pdf_Export` directly; we already use this in the ODT→PDF step.
- If duplication persists, simplify the DOCX footer (remove floating elements, text boxes) and re-test.
