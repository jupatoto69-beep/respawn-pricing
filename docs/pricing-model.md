> The following values are illustrative and do not represent actual
> Digital Respawn costs, margins or commercial policies.

# Pricing Model

## Purpose

This document defines the initial pricing rules used by Respawn Pricing.

The objective is to calculate consistent sale prices while protecting the
minimum profitability configured by the business.

## Core values

### Total cost

The total internal cost required to provide a product or service.

It may include:

- Supplier cost
- Materials
- Labor
- Transportation
- Operational expenses
- Risk or waste allowance

### Minimum margin

The minimum percentage of the sale price that must remain after covering
the total cost.

### Minimum profitable price

The lowest authorized sale price before exceptional approval is required.

Formula:

```text
minimum profitable price = total cost / (1 - minimum margin)
```

### Maximum authorized discount

The largest discount that an employee may apply without administrator
approval.

### List price

The displayed price before applying a commercial discount.

Formula:

```text
list price = minimum profitable price / (1 - maximum authorized discount)
```

### Final sale price

The price offered after applying the selected discount.

Formula:

```text
final sale price = list price × (1 - applied discount)
```

## Example

> The following values are illustrative and do not represent actual
> Digital Respawn costs, margins or commercial policies.

Given:

```text
total cost = COP 80,000
minimum margin = 20%
maximum authorized discount = 20%
applied discount = 10%
```

The calculation is:

```text
minimum profitable price = 80,000 / (1 - 0.20)
minimum profitable price = COP 100,000

list price = 100,000 / (1 - 0.20)
list price = COP 125,000

final sale price = 125,000 × (1 - 0.10)
final sale price = COP 112,500
```

The final sale price remains above the minimum profitable price.

## Validation rules

- Total cost must be greater than or equal to zero.
- Minimum margin must be greater than or equal to 0% and lower than 100%.
- Maximum authorized discount must be greater than or equal to 0% and lower than 100%.
- Applied discount cannot be negative.
- Applied discount cannot exceed the maximum authorized discount.
- A calculated final sale price cannot be lower than the minimum profitable price.

## Rounding

Calculated Colombian peso values will initially be rounded to the nearest
whole peso.

Additional commercial rounding rules may be introduced in a future release.

## Limitations

The first pricing model does not include:

- Taxes
- Payment processing fees
- Customer-specific price lists
- Volume discounts
- Promotional campaigns
- Administrator-approved exceptions