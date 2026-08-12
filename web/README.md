# Respawn Pricing Web Application

This directory contains the executable Next.js application for Respawn Pricing.

The application uses:

- Next.js
- React
- TypeScript
- ESLint
- App Router

For installation, development and validation instructions, see the
[main project README](../README.md).

The initial page is located at:

```text
src/app/page.tsx
```

The page exposes `Impresión 3D` as a third top-level mode alongside `Productos
por área` and `Servicios`; it is not listed under `Servicios → Impresos`. Its
precise form accepts PLA or PETG, grams and printing hours/minutes per unit,
quantity, and one modeling option per job. `Modificar precio` enables a custom
amount. A raw amount below the internal threshold requires the explicit
checkbox `Confirmo que este precio está autorizado`; COP 5.000 remains a hard,
non-authorizable floor. Upward COP 500 rounding happens only after the amount
is allowed. The checkbox is an acknowledgement, not authentication or a real
permissions system. Internal material, electricity, margin, multiplier,
authorization state and threshold data are not part of the employee result,
quotation snapshot, customer preview or PDF.

The future quick estimator based on length × width × height is not included.
The pricing engine is independent of the precise form so estimated grams and
time can reuse it later.

The page includes a temporary in-memory quotation shared by the area-product
and service calculators. It stores independent snapshots of final calculated
line totals and sums them without repricing. Optional customer details and
general notes remain available while switching calculators. The first stored
line freezes the browser-local quotation date. With at least one stored line,
an employee can open a formal read-only preview that validates non-empty
customer fields, shows that date as `DD/MM/YYYY` with the configured validity
of `15 días`, and presents those same snapshots without repricing. The open
preview can export that same frozen customer-safe view-model as an A4 PDF with
selectable text generated locally with `jsPDF`. No expiration date is
calculated. The preview and document use the official local white-on-dark and
black-on-light logo variants, respectively, and retain the `Digital Respawn`
text fallback if a logo fails.

The quotation and preview exist only in page memory. This includes precise 3D
lines; there is no editable pricing administration or runtime catalog storage.
A browser refresh or
confirmed complete quotation clearing removes the lines, details and frozen
date; the next first line receives a new local date. There is no customer
database, backend, upload or other persistence. PDF generation does not
transmit quotation data. Print output, WhatsApp or email sharing, and saved
history remain out of scope.
