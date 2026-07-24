# First Release Requirements

## Purpose

This document defines the functional scope and confirmed business rules for
the first usable release of Respawn Pricing.

The release provides a desktop-oriented workflow for one conceptual employee
role to calculate consistent prices and prepare a temporary on-screen
quotation.

## Operating model

The public repository contains only illustrative or example catalog and
commercial data. Real prices, minimum charges, discount limits, optional
additions, and other commercial rules are loaded from a local configuration
excluded from version control.

The first release will not include:

- A database
- An administrative panel
- Persistent catalog or rule editing
- User authentication
- In-system authorization

There is one conceptual employee role. Separating technical employees from
sales employees is deferred to a later release.

An administrator may still exist as part of the business process, but not as
an application role in the first release. When administrator authorization is
required, it occurs outside the system.

A future version with a backend and authentication will provide actual
protection for internal commercial data.

## Employee workflow and visibility

The employee may:

- Select a product or service.
- Enter valid dimensions and quantities when required.
- Select optional additions.
- View the product or service.
- View the list price.
- View the maximum authorized discount.
- Apply and view a discount within that maximum.
- View selected additions.
- View the final price.
- Add a valid final price to a temporary quotation.

The employee must not see:

- Internal costs
- Margin
- Profitability
- Supplier information
- The exact configured final minimum charge

Hiding this information in the first-release interface is a visual restriction,
not a complete security guarantee. Without a backend or authentication, the
release cannot securely protect locally available data.

## Supported pricing strategies

### Fixed price

A fixed-price product or service uses its preconfigured list price. It may
support optional additions, a product-specific discount limit, a minimum
charge, and commercial rounding.

### Area-based price

An area-based product uses its dimensions, quantity, configured rate, and
applicable minimum charge.

Its calculated base price is the list price shown to the employee before the
discount, optional additions, and final minimum-charge protection.

The calculation must follow this order:

1. Validate dimensions and quantity.
2. Convert the dimensions to square meters.
3. Calculate area multiplied by the configured rate and quantity.
4. Group the pieces according to the product, color, and finishing rules.
5. Apply the authorized discount only to the raw base price of the group.
6. Add lamination and all other additions without discount.
7. Compare the resulting subtotal with the final minimum charge for the group.
8. Use the greater of the subtotal and the final minimum charge.
9. Round upward to the next COP 500 increment.
10. Add the rounded final line price to the temporary quotation.

The formulas and terminology are defined in
[`pricing-model.md`](pricing-model.md).

### Cost-and-margin price

The cost-and-margin model remains documented in
[`pricing-model.md`](pricing-model.md), but its implementation is deferred to a
later release.

## Minimum charges and grouping

Minimum charges are loaded from the private local configuration. This document
intentionally does not publish their monetary values.

For banner, printed vinyl, and cut vinyl, the configured minimum charge is the
lowest final price permitted for the group, including after an authorized
discount is applied.

A group shares one minimum charge only when it uses the same product and the
same finishing process.

- For cut vinyl, multiple pieces may share one minimum charge only when they
  belong to the same product and use the same color.
- Different cut-vinyl colors form separate groups. Each group is evaluated
  against its own minimum charge.
- Banner and printed-vinyl pieces may be grouped even when their designs use
  different colors; design colors do not separate their groups.
- Incompatible finishes form separate groups. For example, matte-laminated
  pieces and gloss-laminated pieces must not be grouped together.

The raw base prices of compatible pieces are combined, the discount and
undiscounted additions are applied in the required order, and only then is the
result compared with the group's final minimum charge.

## Optional additions

Products and services may have selectable additions, including lamination,
other finishes, additional materials, or additional labor.

In the first release, an authorized discount applies only to the base price.
Lamination and all other additions are added without discount.

The required addition calculation method is specified in the private local
configuration for each applicable product.

## Discounts and below-minimum exceptions

The maximum employee discount is configured separately for each product or
service.

The system must reject an applied discount that is negative or exceeds the
configured maximum.

If an employee applies a discount or otherwise attempts to obtain a value
below the configured final minimum charge, the application must maintain the
minimum as the final unrounded group price.

A price below that minimum may be handled only as an exception authorized by
an administrator outside the system. The first release has no authentication,
administrator account, approval workflow, or in-system override.

## Commercial rounding

The only valid first-release rounding rule is to round every final line price
upward to the smallest multiple of COP 500 greater than or equal to the
unrounded value.

A price already divisible by COP 500 remains unchanged. Rounding must never
reduce a price.

## Temporary quotation

The first release must allow the employee to build a temporary quotation on
screen.

The quotation must:

- Show its calculated lines, quantities, selected additions, applied
  discounts, and final line prices.
- Use only COP.
- Add the already rounded final price of each line.
- Not apply a second rounding operation to the total.
- Clearly state that taxes are not calculated automatically.

The temporary quotation will not:

- Be saved to a database.
- Be associated with a stored customer.
- Have an official quotation number.
- Generate a PDF.
- Remain available after the application is closed or refreshed.

## Input validation

The application must reject:

- A dimension that is missing, zero, or negative.
- A quantity that is missing, not a whole number, or not greater than zero.
- A discount below zero.
- A discount above the configured product maximum.
- Any other invalid or missing required value.

Dimensions may contain decimals but must be greater than zero. Quantities must
be whole numbers greater than zero.

If an otherwise valid employee operation would produce a subtotal below the
configured final minimum charge, the system must use the minimum rather than
rejecting the calculation or allowing a lower price.

## First-release scope

The first usable release includes:

- Fixed-price calculations
- Area-based calculations
- Optional additions
- Product-specific discount limits
- Minimum charges and grouping rules
- Commercial rounding upward to COP 500 increments
- A temporary on-screen quotation
- COP as the only currency
- A single conceptual employee role
- Illustrative or example public data
- Real prices and rules loaded from a local configuration excluded from version
  control

## Out of scope

The first release does not include:

- Cost-and-margin calculation
- Authentication or in-system authorization
- An administrator application role or approval workflow
- Separate technical and sales employee roles
- A database or administrative panel
- Persistent catalog or rule editing
- Secure server-side protection of internal commercial data
- Automatic tax calculation
- Currencies other than COP
- Saved customers or quotation history
- PDF generation
- Electronic invoicing
- Inventory management
- Online payments
- Multi-company support
- Artificial intelligence integrations
- Real supplier costs, internal prices, minimum-charge values, margins, or
  private commercial rules in the public repository
