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
- Build temporary on-screen quotations.

Cost-and-margin pricing is planned for a future release.

## Temporary quotation

The current web application includes an in-memory temporary quotation that can
hold multiple calculated area products and services. Each added line is a
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
