# Product Vision

## Problem

Digital Respawn manages products and services with different supplier costs,
materials, labor requirements, profit margins and negotiable prices.

Employees may find it difficult to calculate the correct price consistently,
especially when services include variable materials or authorized discounts.

## Proposed solution

Respawn Pricing provides employees with controlled product- and
service-specific pricing calculations and a customer-safe temporary quotation
workflow. The broader vision adds persistent business administration without
changing the privacy boundary around internal commercial data.

## Primary users

- Business administrator
- Sales employee
- Technical employee

These are the intended user groups for the broader product. The first release
has one conceptual employee role; administrators configure commercial rules
and authorize exceptional prices outside the application.

## Current implemented product

The current first release includes:

- Area-based Printed vinyl, Cut vinyl, Banner and Panaflex pricing, with
  exceptional Custom rates and the implemented product-specific structure,
  illuminated-sign and Cut vinyl group rules.
- Computer, audiovisual and printed-service calculators using fixed prices,
  quantity tiers, duration pricing, negotiated prices and product-specific
  additions where supported.
- Precise 3D pricing from actual slicer data and a separate manual quick
  estimate for the complete requested job.
- An in-memory temporary quotation made from accepted commercial results,
  including optional validated customer details and notes.
- A formal customer-safe preview and locally generated PDF that use stored
  quotation values without repricing.
- A frozen browser-local quotation date and a displayed validity of 15 days.

Commercial rounding, minimums, negotiated pricing, tiers and additions are
implemented only where a current product or service defines them. The release
does not contain generic percentage-discount, addition or minimum engines.

## Future direction

The broader product may add:

- A backend and database.
- Employee authentication, roles and authorization.
- Persistent quotations and quotation history.
- Persistent customer records.
- Catalog and commercial-rule administration.
- Generic pricing strategies for discounts, additions, minimums and
  cost-and-margin calculations.

Accounting, electronic invoicing, inventory management, online payments and
multi-company support also remain outside the current release. These future
directions are not requirements or implemented capabilities today.
