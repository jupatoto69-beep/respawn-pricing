# First Release Requirements

## Purpose and authority

Respawn Pricing is an internal pricing and temporary quotation tool for Digital
Respawn employees. Its purpose is to produce consistent sale prices from
privately configured commercial rules while preventing unauthorized prices.

The first release is a desktop-oriented web application built with Next.js.
This document defines the normative scope of that release. The broader product
direction in [Product Vision](product-vision.md) remains relevant to later
releases. The cost-and-margin concepts in [Pricing Model](pricing-model.md) are
documented for future use but are not implemented in the first release.

## Operating model

The first release uses the following operating model:

- The product and service catalog and all commercial rules are configured in
  code.
- The application has no database.
- Catalog changes are not persisted through the application.
- There is no administration panel.
- There is no authentication or authorization system.
- The application has one conceptual in-system role: employee.
- Quotations exist temporarily on screen and are not retained after the
  session is cleared or ends.

The employee uses the pricing and quotation interface. A business
administrator remains responsible for configuring commercial rules and
authorizing exceptional prices outside the application. The administrator is
not an in-system role in this release.

## Supported pricing strategies

### Fixed-price products and services

A fixed-price product or service has a configured unit price. The configured
unit price is its list price, and quantity must be a positive integer:

```text
fixed base price = configured unit price × quantity
```

Each fixed-price selection is treated as its own quotation line and commercial
group in the first release. After calculating the fixed base price, the
application must:

1. Apply an authorized discount only to the fixed base price.
2. Add compatible additions without applying a discount.
3. Apply the privately configured final minimum charge as the final floor.
4. Round the protected price upward to the next COP 500 increment.
5. Add the rounded result to the temporary quotation.

### Area-based products

An area-based product derives its base price from valid dimensions in
centimeters, a configured square-meter rate, and quantity. Compatible items
may share a commercial group as defined below.

### Cost-and-margin pricing

Cost-and-margin pricing is documented conceptually in
[Pricing Model](pricing-model.md), but its implementation is postponed. The
first release does not accept costs or margins as inputs and does not calculate
prices from them.

## Area-based calculation

The application must perform area-based pricing in this order:

1. Validate the dimensions and quantity. Dimensions must be positive numeric
   values, and quantity must be a positive integer.
2. Convert the dimensions from centimeters to square meters:

   ```text
   area in square meters = (length in centimeters / 100)
                          × (width in centimeters / 100)
   ```

3. Multiply the area by the configured rate to obtain the base price for one
   item.
4. Multiply the base price for one item by quantity.
5. Group compatible items when the applicable commercial rules allow it.
6. Apply an authorized discount only to the grouped base price:

   ```text
   discounted base price = grouped base price × (1 - applied discount)
   ```

7. Add laminates and all other additions without applying a discount:

   ```text
   subtotal with additions = discounted base price + additions
   ```

8. Apply the privately configured final minimum charge as a floor for the
   commercial group:

   ```text
   protected group price = maximum(
     subtotal with additions,
     configured final minimum charge
   )
   ```

9. Round the protected group price upward to the next COP 500 increment:

   ```text
   rounded group price = ceiling(protected group price / 500) × 500
   ```

10. Add the rounded result as a line in the temporary quotation.

The calculated base price before discounts and additions is the list price
shown to the employee. The final minimum is applied after the discount and
additions; it is not a pre-discount value. A quotation total is the sum of its
already rounded lines and is not rounded a second time.

## Grouping rules

The special grouping rules in this section apply to area-based products. Each
fixed-price selection remains its own line and commercial group as defined
above. Area-based items may share a commercial group only when their pricing,
finish, and production requirements are compatible.

- Cut vinyl groups only items with the same product and color.
- Banner and printed vinyl may group items with different design colors.
- Incompatible finishes or production processes create separate groups.
- Matte and gloss laminate must never share the same group.

Each separate group receives its own discount calculation, additions, final
minimum floor, and commercial rounding.

## Discounts

- Each product or service may define its own maximum authorized discount.
- The application must reject a negative discount.
- The application must reject a discount above the configured maximum.
- A discount applies only to the base price.
- Laminates and all other additions are not discounted.

## Minimum charges and exceptions

- Final minimum charges are private commercial configuration.
- Real commercial minimum amounts must not be stored in public documentation
  or committed public configuration.
- The employee-facing interface must not display or otherwise disclose an
  internal minimum-charge value.
- The application must block any requested exception below the final minimum.
- An exceptional price below the minimum requires administrator authorization
  through a process outside the first-release system.
- The first release must not model, record, or imply an in-system approval for
  an exceptional price.

Because this release has no authentication or authorization system, hiding
commercial data in the interface is not an access-control boundary. Private
configuration must not be included in employee-facing responses or public
client assets, and operational access to the application and its configuration
must be controlled outside the application.

## Employee-visible information

For each calculation, the employee interface must show:

- The selected product or service.
- Valid dimensions when the pricing strategy requires them.
- Quantity.
- List price.
- Maximum permitted discount.
- Applied discount.
- Selected additions.
- Final rounded price.
- An action to add the priced line to the temporary quotation.

## Information hidden from employees

The employee interface must not expose:

- Costs.
- Profit margins.
- Profitability.
- Suppliers.
- Internal minimum-charge values.

## Temporary quotation

An employee may add one or more valid, rounded pricing lines to an on-screen
temporary quotation. The quotation may show the selected item details, line
prices, and the sum of its lines. It is a working aid rather than a persisted
commercial record.

The first release does not save, retrieve, export, or generate a PDF from a
quotation. Taxes are not calculated automatically.

## Out of scope

The following functionality is explicitly excluded from the first release:

- Authentication or authorization.
- Database persistence.
- An administration panel.
- Persistent catalog editing.
- Persistent quotation history.
- PDF generation.
- Inventory management.
- Supplier management.
- Cost-and-margin pricing.
- In-system authorization of exceptional prices.
- Accounting, electronic invoicing, online payments, and multi-company
  support.

## Acceptance conditions

The first release satisfies these requirements when it:

- Prices fixed-price and area-based products and services using configured
  rules.
- Enforces product-specific discount limits.
- Applies grouping, additions, final minimum charges, and upward COP 500
  rounding in the required order.
- Shows only employee-visible commercial information.
- Blocks below-minimum exceptions and leaves their authorization outside the
  system.
- Builds a temporary on-screen quotation without persisting it.
