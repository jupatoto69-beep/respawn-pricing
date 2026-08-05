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

The quotation is intentionally temporary: refreshing or closing the page
clears every line. It uses no browser or server persistence. Customer data,
PDF generation, printing, WhatsApp or email sharing, and saved quotation
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
