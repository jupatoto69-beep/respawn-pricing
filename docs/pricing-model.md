> This document and the public repository contain only illustrative or example
> commercial data. They do not publish real Digital Respawn prices, costs,
> margins, minimum-charge values, supplier information, or private commercial
> policies.

# Pricing Model

## Purpose

This document defines the pricing model for Respawn Pricing and separates the
rules implemented in the first release from rules deferred to later releases.

The first release does not use a database, an administrative panel, or
persistent catalog editing.

All first-release monetary calculations use Colombian pesos (COP).

## Commercial configuration and data protection

The public repository will contain illustrative or example catalog data only.
Real prices and commercial rules will be loaded from a local configuration
excluded from version control.

The first-release interface must hide costs, margins, and minimum charges from
employees. This is a visual restriction and not a complete security guarantee:
without a backend or authentication, the first release cannot securely protect
locally available data. A future version with a backend and authentication
will provide actual protection for internal commercial data.

## First-release concepts

### List price and base price

The employee-facing list price is the base price of the selected product or
service before an applied discount or optional additions.

For a fixed-price product, the base price comes from its configured list price.
For an area-based product, the base price is calculated from dimensions,
quantity, and the configured area rate before the final minimum charge is
applied.

### Optional addition

A selectable charge such as lamination, another finish, additional material,
or additional labor. In the first release, additions are added after the
discount and are not discounted.

### Maximum authorized discount

The largest discount configured for a specific product or service that an
employee may apply.

The applied discount must be between zero and that configured maximum. It
applies only to the base price, not to optional additions.

### Minimum charge

The configured final price floor for an applicable product or group of pieces.
For banner, printed vinyl, and cut vinyl, this is the lowest final group price
the application may produce, even after an authorized discount is applied.

Minimum-charge values are not documented in the public repository. The
employee must not see their exact values in the interface.

### Final line price

The amount added to the temporary quotation after the authorized discount,
optional additions, final minimum-charge protection, and commercial rounding
have been applied.

## First-release pricing strategies

### Fixed price

A fixed-price item uses a base list price preconfigured for the product or
service. It may also have a product-specific discount limit, optional additions,
a final minimum charge, and commercial rounding.

### Area-based price

An area-based item uses positive decimal dimensions and a positive whole-number
quantity. The calculation must use this order:

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

For dimensions entered in centimeters:

```text
area in square meters = (length in centimeters * width in centimeters) / 10,000
raw piece base price = area in square meters * configured rate * quantity
raw base price = sum(raw piece base prices in the group)
discounted base price = raw base price * (1 - applied discount)
subtotal with additions = discounted base price + additions
protected line price = maximum(subtotal with additions, final minimum charge)
rounded line price = ceiling(protected line price / 500) * 500
```

The configured minimum is therefore a final floor, not a base-price adjustment
made before discounting.

## Minimum-charge grouping

A group shares one minimum charge only when its pieces use the same product and
the same finishing process. The following refinements apply:

- For cut vinyl, multiple pieces may share one minimum charge only when they
  use the same product and the same color.
- Different cut-vinyl colors form separate groups.
- Banner and printed-vinyl pieces may be grouped even when their designs use
  different colors; design colors do not separate their groups.
- Incompatible finishes form separate groups. For example, matte-laminated
  pieces and gloss-laminated pieces do not share a minimum-charge group.

## Discounts and below-minimum exceptions

An authorized discount applies only to the raw base price. Lamination and all
other additions remain undiscounted.

If an employee applies a discount or otherwise attempts to obtain a value
below the configured final minimum charge, the system must keep the final
minimum by using the `maximum` operation defined above.

A sale price below that minimum may be handled only as an exception authorized
by an administrator outside the system. The first release has no
authentication, administrator account, internal approval workflow, or
below-minimum override.

## Commercial rounding

Every protected line price must be rounded upward to the smallest multiple of
COP 500 that is greater than or equal to that protected price:

```text
rounded line price = ceiling(protected line price / 500) * 500
```

A value already divisible by COP 500 remains unchanged. No other rounding rule
is valid for the first release, and rounding must never reduce a price.

## Temporary quotation total

The temporary quotation must sum the final, already rounded prices of its
lines:

```text
quotation total = sum(rounded final line prices)
```

The application must not apply a second rounding operation to the quotation
total.

Taxes are not calculated automatically. The on-screen temporary quotation must
clearly state that taxes are not calculated.

## Employee-visible information

The employee may see:

- Product or service
- List price
- Maximum authorized discount
- Applied discount
- Selected additions
- Final price

The employee must not see:

- Internal costs
- Margin
- Profitability
- Supplier information
- The exact configured final minimum charge

This visibility rule does not by itself secure the underlying local
configuration. It is only an interface restriction in the first release.

## Deferred cost-and-margin model

Cost-and-margin pricing remains part of the product model but will not be
implemented in the first release.

The future model may calculate a minimum profitable price from internal cost
and minimum margin:

```text
minimum profitable price = total cost / (1 - minimum margin)
list price = minimum profitable price / (1 - maximum authorized discount)
final base price = list price * (1 - applied discount)
```

These internal inputs and results must not become employee-visible merely
because the model is implemented in a later release. Its detailed interface,
permissions, validation, and approval workflow remain future decisions.

## Validation rules

For the first release:

- Every required dimension must be greater than zero and may contain decimals.
- Quantity must be a whole number greater than zero.
- Applied discount cannot be negative or exceed the product-specific maximum.
- Required product, pricing, and addition inputs must be valid.
- If an employee action would produce a price below the final minimum charge,
  the system must maintain the configured minimum.
- A below-minimum exception cannot be approved or represented inside the first
  release and requires administrator authorization outside the system.

For the deferred cost-and-margin model:

- Total cost must be greater than or equal to zero.
- Minimum margin must be at least 0% and lower than 100%.
- Maximum authorized discount must be at least 0% and lower than 100%.

## First-release limitations

The first release does not include:

- Automatic tax calculation
- Currencies other than COP
- Authentication or authorization
- In-system administrator approval
- An in-system below-minimum override
- Persistent quotations or catalog changes
- Customer-specific price lists
- Volume discounts or promotional campaigns unless later added to scope
