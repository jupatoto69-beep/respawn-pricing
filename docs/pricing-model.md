> Any example values in this document are entirely fictitious and do not
> represent actual Digital Respawn costs, margins or commercial policies.

# Pricing Model

## Purpose and authority

This document describes the pricing strategies and calculation rules used by
Respawn Pricing. [First Release Requirements](first-release-requirements.md) is
the normative source for the first release.

The first release calculates consistent sale prices from configured commercial
rules. Cost-and-margin pricing is documented below for future use but is not
implemented in the first release.

## First-release pricing strategies

### Fixed-price products and services

A fixed-price product or service starts from a configured unit price, which is
its list price. Quantity must be a positive integer, and the line base price is:

```text
fixed base price = configured unit price × quantity
```

Each fixed-price selection is treated as its own quotation line and commercial
group in the first release. The application then applies an authorized discount
only to the fixed base price, compatible additions without discount, the
configured final minimum charge as the final floor, upward COP 500 rounding,
and addition to the temporary quotation in the normative order defined below.

### Area-based products

An area-based product starts from valid dimensions in centimeters, quantity
and a configured square-meter rate:

```text
area in square meters = (length in centimeters / 100)
                       × (width in centimeters / 100)

base price = area in square meters × configured rate × quantity
```

Compatible area-based items may be grouped before the discount and final
minimum are applied. The grouping rules are defined in
[First Release Requirements](first-release-requirements.md).

## First-release commercial values

### Base price

The line price calculated from the supported strategy before discounts and
additions. For fixed-price products and services, the configured unit price is
the list price shown to the employee, and the fixed base price includes
quantity as defined above.

### Maximum authorized discount

The largest discount that an employee may apply to a product or service. It is
configured individually for each product or service.

### Additions

Compatible finishes, laminates or other additions that increase the price.
Additions are not discounted.

### Final minimum charge

The private commercial floor configured for a product group. The employee must
not see its internal value. An exception below this floor is blocked and
requires administrator authorization outside the first-release system.

## Normative first-release calculation

The application must calculate each price in this order:

1. Validate all inputs required by the pricing strategy.
2. Calculate the base price and group compatible items when allowed.
3. Reject a negative discount or a discount above the configured maximum.
4. Apply the authorized discount only to the base price:

   ```text
   discounted base price = base price × (1 - applied discount)
   ```

5. Add laminates and all other additions without discount:

   ```text
   subtotal with additions = discounted base price + additions
   ```

6. Apply the privately configured final minimum charge as the final floor:

   ```text
   protected price = maximum(
     subtotal with additions,
     configured final minimum charge
   )
   ```

7. Round the protected price upward to the next COP 500 increment:

   ```text
   rounded price = ceiling(protected price / 500) × 500
   ```

8. Add the rounded result to the temporary quotation.

The minimum is applied after the discount and additions. It is not a
pre-discount minimum. A quotation total is the sum of its already rounded lines
and is not rounded a second time.

## Future cost-and-margin model

The concepts in this section are retained for a future pricing strategy. They
are not employee inputs or calculations supported by the first release.

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

### Cost-derived list price

The future model may derive a list price that accommodates the configured
maximum authorized discount.

Formula:

```text
list price = minimum profitable price / (1 - maximum authorized discount)
```

### Discounted base price

The future cost-derived list price may then enter the same normative
first-release calculation order. Applying a discount produces an intermediate
discounted base price, not the final rounded price.

Formula:

```text
discounted base price = list price × (1 - applied discount)
```

## Fictitious future-model example

> This example is entirely fictitious, demonstrates only the future
> cost-and-margin concept and does not represent a current product or policy.

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

discounted base price = 125,000 × (1 - 0.10)
discounted base price = COP 112,500
```

The discounted base price is an intermediate result. In a complete pricing
workflow, additions, the private final minimum floor and upward COP 500
rounding would still be applied in that order.

## Validation rules

- Dimensions required for area pricing must be positive numeric values.
- Quantity must be a positive integer.
- Maximum authorized discount must be greater than or equal to 0% and lower
  than 100%.
- Applied discount cannot be negative.
- Applied discount cannot exceed the maximum authorized discount.
- A requested exception below the configured final minimum charge must be
  blocked.

If the future cost-and-margin strategy is implemented, total cost must be
greater than or equal to zero and minimum margin must be greater than or equal
to 0% and lower than 100%.

## Rounding

Each protected group price is rounded upward to a COP 500 increment after the
discount, additions and final minimum have been applied. A value already at an
exact COP 500 increment remains unchanged.

## First-release limitations

The first release does not include:

- Taxes
- Payment processing fees
- Customer-specific price lists
- Volume discounts
- Promotional campaigns
- Cost-and-margin pricing
- Database persistence
- Persistent quotation history
- Authentication or authorization
- An administration panel
- In-system administrator-approved exceptions
