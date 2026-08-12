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
- Price precise 3D-printing jobs from material, per-unit grams and printing
  time, quantity, and modeling.
- Build temporary on-screen quotations.

The scoped precise 3D-printing strategy is implemented. Generic
cost-and-margin pricing for other catalog items remains planned for a future
release.

## Precise 3D printing

`Impresión 3D` is a top-level quotation mode alongside `Productos por área`
and `Servicios`; it is not part of `Servicios → Impresos`. Its precise form
uses PLA or PETG, grams and printing time per unit, quantity, and one modeling
option per job. It produces a rounded commercial price and supports an explicit
manual price. A raw amount below the internal threshold can continue only after
the employee checks `Confirmo que este precio está autorizado`; COP 5.000
remains an absolute, non-authorizable minimum. Rounding is applied only after
the raw amount is allowed.
The employee-facing result, stored quotation snapshot, formal preview and PDF
contain only customer-safe selections and the accepted final price; material,
electricity, margin, authorization state and threshold internals are not
presented. The checkbox is an explicit confirmation, not authentication or a
real permissions system.

A quick estimator from length × width × height is not implemented yet. The
precise engine accepts already-resolved grams and printing time so a future
estimator can reuse it.

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
