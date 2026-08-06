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

The page includes a temporary in-memory quotation shared by the area-product
and service calculators. It stores independent snapshots of final calculated
line totals and sums them without repricing. Optional customer details and
general notes remain available while switching calculators, but exist only in
page memory. A browser refresh or confirmed complete quotation clearing removes
the lines and those details. There is no customer database or other
persistence, PDF or print output, WhatsApp or email sharing, or saved history.
