# Respawn Pricing

Internal pricing and quotation platform for Digital Respawn.

## Overview

Respawn Pricing helps employees calculate consistent prices for products and
services from configured commercial rules, variable materials and authorized
discounts.

## First release goals

- Calculate fixed and area-based prices.
- Apply product-specific authorized discount ranges.
- Prevent sales below the configured minimum price.
- Provide employees with guidance for products and services.
- Price precise 3D-printing jobs from actual slicer grams and printing time.
- Collect preliminary 3D-printing intake before an STL/model is sliced.
- Build temporary on-screen quotations.

The scoped precise 3D-printing strategy is implemented. Generic
cost-and-margin pricing for other catalog items remains planned for a future
release.

## 3D printing

`Impresión 3D` is a top-level quotation mode alongside `Productos por área`
and `Servicios`; it is not part of `Servicios → Impresos`. It exposes two
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
the precise ×3 rule. An accepted quick estimate can become an immutable
`Impresión 3D — Estimación preliminar` line in the temporary quotation, formal
preview and existing PDF. The line always carries its provisional warning.
Automatic calibration, profiles, interpolation and extrapolation remain
inactive.

The commercial engine preserves the existing material, electricity, quantity,
modeling, minimum and rounding rules. Multicolor applies its configured
commercial factor consistently to both the suggested amount and guarded manual
price threshold, while the absolute COP 5.000 floor is not multiplied. An
accepted manual price is rounded only after raw-value validation and any
required confirmation.

The employee-facing result, stored quotation snapshot, formal preview and PDF
contain only customer-safe selections and the accepted final price; internal
material/electricity costs, margin, authorization state and threshold details
are not presented. The checkbox is an explicit confirmation, not
authentication or a real permissions system.

## Temporary quotation

The current web application includes an in-memory temporary quotation that can
hold multiple calculated area products and services, including precise 3D
printing. Each added line is a
snapshot of the calculator's final price, and the quotation total is the exact
sum of those stored final line totals. The quotation does not recalculate
quantities, pricing tiers, additions, negotiated prices, minimums or commercial
rounding.

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

Early development.
