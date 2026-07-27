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
