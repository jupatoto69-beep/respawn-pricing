# Respawn Pricing

Internal pricing and quotation platform for Digital Respawn.

## Overview

Respawn Pricing helps employees calculate consistent prices for products and
services based on costs, margins, variable materials and authorized discounts.

## Initial goals

- Calculate minimum profitable prices.
- Calculate list prices with an authorized discount range.
- Prevent sales below the configured minimum price.
- Provide employees with guidance for products and services.
- Support future quotation workflows.

## Documentation

- [Product vision](docs/product-vision.md)
- [Pricing model](docs/pricing-model.md)

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