# PDF Template Test Samples

Test data for each barangay document template.

## How to Use

### Option 1: Postman Collection
Import `postman-samples.json` (in the backend root) into Postman for ready-to-use requests.

### Option 2: Individual JSON Files
Use these individual JSON files with curl or your HTTP client:

```bash
# Test BRGY-CLR
curl -X POST http://localhost:5000/api/pdf/generate \
  -H "Content-Type: application/json" \
  -d @test-samples/BRGY-CLR.json

# Test BRGY-BLD
curl -X POST http://localhost:5000/api/pdf/generate \
  -H "Content-Type: application/json" \
  -d @test-samples/BRGY-BLD.json
```

## Templates

### BRGY-CLR - Barangay Clearance
Required fields: `fullName`, `citizenship`, `civilStatus`, `age`, `purpose`

### BRGY-IND - Barangay Indigency Certificate
Required fields: `fullName`, `age`, `purpose`

### BRGY-RES - Barangay Residency Certificate
Required fields: `fullName`, `zone`, `purpose`

### BRGY-BP - Barangay Business Permit
Required fields: `businessName`, `businessKind`, `address`, `fullName`

### BRGY-BLD - Barangay Building Clearance
Required fields: `fullName`, `age`, `sex`, `address`, `projectType`

### BRGY-WP - Barangay Work Permit
Required fields: `fullName`

## Notes
- All text fields will be automatically converted to UPPERCASE
- Dates are automatically generated
- Day numbers include ordinal suffixes (1ST, 2ND, 3RD, etc.)
