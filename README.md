# Respawn Pricing

Internal pricing and quotation platform for Digital Respawn.

## Overview

Respawn Pricing helps employees calculate consistent prices for products and
services from configured product-specific commercial rules and build a
customer-safe temporary quotation.

## Current release capabilities

- Price Printed vinyl, Cut vinyl, Banner and Panaflex by area, including their
  implemented product-specific rules and an exceptional Custom rate option.
- Price computer maintenance, Office and individual software installation,
  disk recovery, protected-system access, simple video, business cards and
  tabloids.
- Price precise 3D-printing jobs from actual slicer grams and printing time,
  or record a manual quick estimate before the model is sliced.
- Select the initial Security Systems type and quotation presentation while its
  approved product catalog remains pending.
- Build an in-memory temporary quotation from accepted commercial results.
- Capture optional validated customer details and notes.
- Present a formal customer-safe preview and generate its PDF locally.
- Freeze the browser-local quotation date and show the current 15-day
  validity.

These capabilities are implemented and covered by automated tests. Generic
discount, addition, minimum and cost-and-margin engines remain future work;
the current calculators use explicit product- or service-specific rules.

## 3D printing

`Impresión 3D` is a top-level quotation mode alongside `Productos por área`
and `Servicios`; `Security Systems` is the fourth top-level mode. 3D printing
is not part of `Servicios → Impresos` and exposes two
employee-facing submodes: `Cotización precisa` and `Estimación rápida`.

The precise form uses PLA or PETG, actual grams and printing time per unit from
the slicer, quantity, one modeling option per job, color mode, production
printer, and the existing manual-price controls. It does not request physical
dimensions or calculate dimensional compatibility: the prepared job has
already been sliced. One-color production may select KE or HI. Multicolor
production is HI-only and switching to it safely resolves the selection to HI.
The selected printer does not currently change price because no
printer-specific power values have been supplied.

Quick mode is a preliminary workflow for an unsliced request. It records an
approximate size, short piece description, material, quantity, modeling, color
mode and an employee-entered `Precio estimado total`. That amount is the manual
preliminary total for the complete job, already including the requested
quantity; it is never treated as a unit price or multiplied by quantity again.
It must be at least COP 5.000 and is rounded upward to COP 500.

Quick mode does not derive grams, printing time, a monetary value or a range
from size and does not call the precise pricing engine. In particular, quick
Multicolor records that production requires HI but does not automatically apply
the precise-flow color pricing behavior. An accepted quick estimate can become
an immutable
`Impresión 3D — Estimación preliminar` line in the temporary quotation, formal
preview and PDF. The line always carries its provisional warning.
Automatic calibration, profiles, interpolation and extrapolation remain
inactive.

The precise commercial engine uses the slicer inputs, quantity, modeling and
color behavior defined by its private typed configuration. Its accepted final
price follows the current 3D validation and upward COP 500 rounding strategy.
Quick estimates use their separate manual whole-job acceptance rule and never
reuse the precise calculation.

The employee-facing result, stored quotation snapshot, formal preview and PDF
contain only customer-safe selections and the accepted final price. Internal
commercial configuration, costs, margins, profitability and authorization
thresholds are not customer-facing data. The application does not provide
authentication, roles or a permissions system.

## Temporary quotation

The current web application includes an in-memory temporary quotation that can
hold multiple calculated area products, services, and precise or quick 3D
results. A stored `lineTotal` already includes the quantity behavior accepted
by its calculator, so the quotation never multiplies quantity again. Its total
is the exact sum of the stored line totals and is not rounded a second time.

Normal lines remain immutable pricing snapshots. Cut vinyl is the specific
composition-dependent exception: pieces in the same normalized color group
are combined before the COP 15,000 group minimum and one upward COP 500
rounding are applied. Adding or removing a Cut vinyl piece may redistribute
the affected group's total across its lines. Other products and services are
not automatically repriced.

The quotation may include optional customer or company details and general
notes. Adding the first line freezes the browser-local quotation date for the
lifetime of that quotation. Once at least one line has been added, the employee
can open a formal, read-only customer-facing preview. The preview validates any
non-empty customer fields, presents that date as `DD/MM/YYYY`, shows the
configured validity of `15 días`, uses only the current stored snapshots and
does not reprice the quotation. No expiration date is calculated.

While that formal preview is open, the employee can download the same safe
presentation model as an A4 PDF. PDF generation runs completely in the browser
with `jsPDF`; it uses the stored line totals and order without recalculating a
price. The preview uses the official local white logo on its dark background,
and the white PDF uses the official local black logo. If either image fails,
the configured `Digital Respawn` text remains available and PDF generation can
continue without the image.

Lines, customer details, notes, the frozen date and the preview exist only in
page memory: refreshing or closing the page clears them, and confirming
`Vaciar cotización` clears them together. The next quotation receives a new
local date when its first line is added. The application has no customer
database, backend or browser/server persistence. PDF export neither uploads nor
sends quotation data. Printing, WhatsApp or email sharing, and saved quotation
history are not implemented.

## Documentation

- [Product vision](docs/product-vision.md)
- [Pricing model](docs/pricing-model.md)
- [First release requirements](docs/first-release-requirements.md)

## Local development

### Requirements

- Node.js 20.19 or later
- npm

### Installation

```bash
cd web
npm install
```

### Development server

```bash
npm run dev
```

Open `http://localhost:3000` in a browser.

### Quality checks

```bash
npm run lint
npm run build
```

## Project status

Working first-release application with the current pricing, temporary
quotation, formal preview and local PDF workflows implemented. Persistent
data, backend services, authentication, roles and catalog administration are
not part of the current release.
