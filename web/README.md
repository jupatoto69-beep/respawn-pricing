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
general notes remain available while switching calculators. With at least one
stored line, an employee can open a formal read-only preview that validates
non-empty customer fields and presents those same snapshots without repricing.

The quotation and preview exist only in page memory. A browser refresh or
confirmed complete quotation clearing removes the lines and details. There is
no customer database, backend or other persistence, PDF or print output,
WhatsApp or email sharing, or saved history.
