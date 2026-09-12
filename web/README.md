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

The page exposes four top-level modes: `Productos por área`, `Servicios`,
`Impresión 3D` and `Security Systems`. 3D printing is not listed under
`Servicios → Impresos`; it contains `Cotización precisa` and `Estimación
rápida` as separate employee-facing submodes. Security Systems currently
provides only the confirmed system-type and quotation-presentation scaffold;
its product catalog is still pending.

The precise form accepts PLA or PETG, actual slicer grams and printing
hours/minutes per unit, quantity, one modeling option per job, color mode,
production printer and the existing manual-price controls. It does not ask for
width, depth or height and does not infer dimensional compatibility because the
job has already been sliced. One-color production allows KE or HI. Multicolor
is HI-only and selecting it resolves the production printer to HI. Changing the
printer alone does not alter current pricing because no printer-specific power
configuration has been supplied.

Quick mode records preliminary reference data plus an employee-entered
`Precio estimado total`: approximate size, short piece description, material,
quantity, modeling, color mode and the manual total. The entered price covers
the complete job and already includes quantity, so the application never
multiplies it again. It must be at least COP 5.000 and is rounded upward to COP
500 before acceptance.

Quick mode does not request or derive grams, printing time, an automatic price
or a price range and does not call the precise 3D pricing engine. Quick
Multicolor may record `Producción: HI` but does not apply the precise automatic
×3 rule. An accepted quick estimate can be added as an immutable `Impresión 3D
— Estimación preliminar` line and appears in the temporary quotation, formal
preview and existing PDF with its line-specific provisional warning. Cube
calibration, automatic profiles, interpolation and extrapolation are not
active.

`Modificar precio` enables a custom amount. A raw amount below the internal
threshold requires the explicit
checkbox `Confirmo que este precio está autorizado`; COP 5.000 remains a hard,
non-authorizable floor. Upward COP 500 rounding happens only after the amount
is allowed. Multicolor applies its configured commercial factor to both the
suggested amount and guarded threshold without multiplying the absolute floor.
The checkbox is an acknowledgement, not authentication or a real
permissions system. Internal material, electricity, margin, multiplier,
authorization state and threshold data are not part of the employee result,
quotation snapshot, customer preview or PDF.

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
A browser refresh or confirmed complete quotation clearing
removes the lines, details and frozen
date; the next first line receives a new local date. There is no customer
database, backend, upload or other persistence. PDF generation does not
transmit quotation data. Print output, WhatsApp or email sharing, and saved
history remain out of scope.
