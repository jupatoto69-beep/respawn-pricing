> The confirmed catalog's final sales rates, thresholds, quantity-tier prices,
> bundle prices, optional-add-on prices, minimum employee-authorized prices and
> examples calculated from those values are real, public commercial sales
> rules. Only numerical values used exclusively in the conceptual future
> cost-and-margin example are fictitious. This document does not disclose actual
> internal costs, actual margins, profitability, suppliers or internal
> purchasing conditions.

# Pricing Model

## Purpose and authority

This document describes the pricing strategies and calculation rules used by
Respawn Pricing. [First Release Requirements](first-release-requirements.md) is
the normative source for the first release.

The first release calculates consistent sale prices from configured commercial
rules. Cost-and-margin pricing is documented below for future use but is not
implemented as a generic strategy. Precise 3D printing is a scoped strategy
with its own typed configuration and privacy boundary.

## Catalog terminology and information boundaries

- A **product** is the item being sold, such as printed vinyl, cut vinyl,
  banner or panaflex.
- A **variant** is a sellable material or finish option within a product.
- A **pricing strategy** is the calculation rule used to obtain a base price.
- A **final sales rate** is the public, customer-facing configured rate used by
  a pricing strategy. The rates below may be stored in this public repository.
- **Public commercial information** may include final customer-facing sales
  prices, thresholds, quantity-tier prices, bundle prices, optional-add-on
  prices and minimum employee-authorized sales prices.
- **Internal private commercial information** includes actual costs, actual
  margins, profitability, suppliers, internal purchasing conditions and any
  additional internal floor that has not been publicly confirmed. Actual
  Digital Respawn values and details in those categories must not be documented
  publicly or exposed to employees. General future-model concepts and clearly
  identified fictitious examples may be documented.

Employees normally select a product and variant. The application resolves the
corresponding final sales rate automatically; employees do not normally enter
a rate.

The following price levels are distinct:

- The **normal price** is the standard customer-facing unit price before an
  applicable quantity tier.
- The **automatic quantity-tier price** is the configured unit price selected
  automatically when quantity reaches its threshold. It applies to every unit
  in the selection and is not a manual employee discount.
- The **minimum employee-authorized price** is the lowest price that an
  employee may authorize when a manual adjustment is available.
- A **private internal floor for exceptions** is an additional internal control
  for exceptional prices. Its amount remains private unless it has been
  explicitly confirmed as public.

A configured quantity-tier price is an authorized commercial price and may be
lower than the minimum employee-authorized price. This does not give the
employee permission to enter that lower price as a manual discount.

## Initial area-product catalog

All rates in this catalog are final sales rates in Colombian pesos per square
meter (COP/m²).

| Product | Variant | Pricing strategy | Final sales rate |
| --- | --- | --- | ---: |
| Printed vinyl | Standard without lamination | Area-based | COP 80,000/m² |
| Printed vinyl | Standard lamination | Area-based | COP 85,000/m² |
| Printed vinyl | Floorgraphic lamination | Area-based | COP 95,000/m² |
| Cut vinyl | Standard | Area-based | COP 80,000/m² |
| Banner | Standard without lamination | Area-based | COP 80,000/m² |
| Banner | Laminated | Area-based | COP 85,000/m² |
| Panaflex | Standard material | Illuminated-sign strategies | COP 85,000/m² |

Cut vinyl has no lamination variants in the first release.

### Custom rate

Custom rate is an exceptional pricing option, not a normal product variant.
The employee must select it explicitly. Only after that selection may the
application show a manual final-sales-rate field in COP/m²; otherwise the field
must remain hidden.

## Confirmed initial service and print catalog

The following final customer-facing sales prices and rules are confirmed and
may be documented publicly. This catalog records rules for future strategy and
interface work; documenting it does not add an implementation to the current
release.

### Strategy definitions

- **Fixed price:** one configured price for one service.
- **Bundle price:** a special price for a confirmed combination of services.
- **Quantity tier:** the unit price changes automatically when quantity reaches
  a threshold.
- **Duration pricing:** a base price plus a charge for each additional started
  minute.
- **Optional add-on:** an additional configured amount added per unit.
- **Precise 3D printing:** a material- and machine-time-based strategy with
  one modeling charge per job, an automatic commercial price and a guarded
  manual final-price option.

### Computer services

#### Physical computer maintenance

- Pricing strategy: Fixed price
- Final sales price: COP 70,000

#### System maintenance

- Pricing strategy: Fixed price
- Final sales price: COP 70,000
- Includes system formatting and Office installation.

#### Complete maintenance

- Pricing strategy: Bundle price
- Final sales price: COP 120,000
- Includes physical computer maintenance and system maintenance.

The bundle price replaces the COP 140,000 sum of the two individual services.

#### Office installation only

- Pricing strategy: Fixed price
- Final sales price: COP 50,000

#### Individual software installation

- Pricing strategy: Quantity tier
- One program: COP 70,000
- From 2 programs: COP 50,000 per program

The threshold includes quantity 2. Once quantity reaches 2, the COP 50,000
unit price applies to every program in the selection.

Examples:

- 1 program: COP 70,000
- 2 programs: 2 × COP 50,000 = COP 100,000
- 3 programs: 3 × COP 50,000 = COP 150,000

#### Hard-drive data recovery

- Pricing strategy: Fixed price
- Final sales price: COP 70,000

#### Access to a password-protected system

- Pricing strategy: Fixed price
- Final sales price: COP 90,000
- Applies when access is required because the system password was lost.

### Basic video editing

- Pricing strategy: Duration pricing
- Up to one billable minute: COP 50,000
- Each additional started minute or fraction: COP 30,000

Billable minutes are always rounded upward to the next complete minute, with a
minimum of one billable minute.

```text
billableMinutes = ceil(durationInSeconds / 60)

price =
  COP 50,000
  + max(0, billableMinutes - 1) × COP 30,000
```

Examples:

- 20 seconds: COP 50,000
- 1 minute: COP 50,000
- 1 minute and 1 second: COP 80,000
- 2 minutes: COP 80,000
- 2 minutes and 1 second: COP 110,000

### Business cards

Business-card quantities are expressed in thousands of cards.

#### Standard glossy business cards

- Pricing strategy: Quantity tier
- Normal price: COP 85,000 per thousand
- Minimum employee-authorized price: COP 80,000 per thousand
- From 3 thousands: COP 75,000 per thousand

The threshold includes exactly 3. Once quantity reaches 3, the COP 75,000 unit
price applies automatically to every thousand in the selection.

Examples:

- 2 thousands: 2 × COP 85,000 = COP 170,000
- 3 thousands: 3 × COP 75,000 = COP 225,000
- 4 thousands: 4 × COP 75,000 = COP 300,000

#### Matte UV-finished business cards

- Pricing strategy: Quantity tier
- Normal price: COP 120,000 per thousand
- Minimum employee-authorized price: COP 115,000 per thousand
- From 3 thousands: COP 100,000 per thousand

The threshold includes exactly 3. Once quantity reaches 3, the COP 100,000
unit price applies automatically to every thousand in the selection.

Examples:

- 2 thousands: 2 × COP 120,000 = COP 240,000
- 3 thousands: 3 × COP 100,000 = COP 300,000

### Printed tabloids

#### Standard printed tabloid

- Pricing strategies: Quantity tier with optional add-on
- Normal price: COP 15,000 per unit
- Minimum employee-authorized price: COP 10,000 per unit
- From 15 units: COP 8,000 per unit
- Optional lamination: COP 5,000 per unit

The threshold includes exactly 15. Once quantity reaches 15, the COP 8,000
unit price applies automatically to every unit. Lamination is added per unit
after resolving the quantity-tier unit price.

Examples:

- 14 units without lamination: 14 × COP 15,000 = COP 210,000
- 15 units without lamination: 15 × COP 8,000 = COP 120,000
- 15 laminated units: 15 × (COP 8,000 + COP 5,000) = COP 195,000

#### Printed adhesive tabloid

- Pricing strategies: Quantity tier with optional add-on
- Standard adhesive: COP 20,000 per unit
- Pre-cut for stickers or custom shapes: COP 25,000 per unit
- Standard adhesive from 5 units: COP 15,000 per unit
- Pre-cut adhesive from 5 units: COP 20,000 per unit
- Optional lamination: COP 5,000 per unit

From 5 units, the quantity tier subtracts COP 5,000 from the unit price of
either variant. The threshold includes exactly 5. Once quantity reaches 5, the
applicable quantity-tier price applies automatically to every unit. Lamination
is added per unit after resolving both the variant and its quantity-tier unit
price.

Examples from 5 units:

- Standard adhesive without lamination: COP 15,000 per unit
- Standard adhesive with lamination: COP 20,000 per unit
- Pre-cut adhesive without lamination: COP 20,000 per unit
- Pre-cut adhesive with lamination: COP 25,000 per unit

### Confirmed threshold interpretation

When a rule says "from X" or was originally described as "after X," the
threshold includes X itself:

- From 2 programs means `quantity >= 2`.
- From 3 thousands means `quantity >= 3`.
- From 15 tabloids means `quantity >= 15`.
- From 5 adhesive tabloids means `quantity >= 5`.

### Precise 3D printing

`Impresión 3D` is implemented as a top-level quotation mode alongside
`Productos por área` and `Servicios`; it is not part of the `Impresos` service
catalog. The precise form receives material, grams per unit, whole printing
hours and minutes per unit, positive integer quantity, and one of these
modeling selections: no modeling, AI-generated or AI-assisted model, basic
design, or complex design.

The pure pricing engine derives material and electricity values from typed
configuration. It multiplies both per-unit variable components by quantity,
adds modeling once, derives the normal suggested commercial price and the
internal manual-price authorization threshold, protects the absolute
commercial minimum, and uses the shared upward COP 500 rounding. The normal
flow rounds only after applying the minimum. A manually entered amount is
validated as a finite positive number and against the absolute COP 5.000 floor
before comparison with the raw internal threshold. A lower amount requires the
explicit employee confirmation `Confirmo que este precio está autorizado`;
without it there is no valid result. A confirmed exception is rounded upward
to COP 500 afterward, so rounding cannot turn an unconfirmed amount into an
authorized one. The COP 5.000 floor is never authorizable.

The confirmation records only an acknowledgement for the current form values.
It resets when pricing inputs change and is not authentication, a permission
grant or a role system.

Employee and customer-facing models expose only the selected material, grams
and time per unit, quantity, modeling selection, suggested/final commercial
price as applicable, and accepted stored total. They do not expose spool
economics, material or electricity costs, material increase, base cost,
internal multipliers, margin, authorization threshold, or whether confirmation
was required. The stored 3D snapshot has no `Categoría: Impresos` detail.
Preview and PDF use that customer-safe snapshot and never invoke this engine.

The engine accepts resolved grams and printing time independently of how they
were obtained. A future quick-estimation strategy may therefore convert
dimensions into estimated metrics and call the same engine. Length, width,
height, volume, density classifications and estimation coefficients are not
implemented now.

### Documentation-only implementation boundary

This catalog prepares future pricing strategies, but this documentation change
does not implement:

- Service forms
- Duration calculations
- Quantity tiers
- Optional add-ons
- Employee-entered manual discounts
- Temporary quotation lines
- Database persistence
- An administration panel

It also adds no application code, interface controls, configuration,
dependencies or tests.

The precise 3D-printing strategy documented above is now the implemented
exception to this historical documentation-only boundary; quick dimensional
estimation remains outside the current release.

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

## Confirmed future special pricing strategies

These strategies are confirmed for future implementation and are not part of
the first-release implementation scope.

### General structures

`areaBasePrice` is the area-based material price in COP, calculated from the
applicable final sales rate in COP/m².

```text
single-face structure price = areaBasePrice × 4
double-face structure price = (areaBasePrice × 4) + areaBasePrice
```

### Illuminated panaflex signs

Dimensions are entered in centimeters (cm). Their product is an area in square
centimeters (cm²):

```text
areaCm2 = lengthCm × widthCm
```

```text
if areaCm2 < 10,000 cm²:
  structure rate per cm² = 45
  small-measure multiplier = 2

if areaCm2 >= 10,000 cm²:
  structure rate per cm² = 34
  small-measure multiplier = 1
```

The quantity is included in both price components before the small-measure
multiplier is applied:

```text
one-face component = areaCm2 × structure rate per cm² × quantity
additional double-face component = areaCm2 × 8.5 × quantity
normal price = one-face component + additional double-face component
adjusted price = normal price × small-measure multiplier
commercial price = round adjusted price upward to a COP 500 multiple
```

The additional double-face component is zero for a one-face sign. For a small
double-face sign, the multiplier therefore applies to both the structure and
the additional face. No intermediate value is rounded.

The threshold is measured in square centimeters, not centimeters or square
meters. Exactly 10,000 cm² is a standard measure and does not receive the
small-measure multiplier.

### Cut vinyl minimum

Cut vinyl has a COP 15,000 commercial minimum per color group. Pieces of the
same product and color may be grouped before evaluating the minimum. Different
colors form separate groups and evaluate the minimum independently. This is a
confirmed public product rule and is distinct from the private final minimum
floor used for exceptional-price authorization.

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
- The documented service and print catalog, including its bundle,
  quantity-tier, duration and per-unit optional-add-on rules
- Promotional campaigns
- Cost-and-margin pricing
- Database persistence
- Persistent quotation history
- Authentication or authorization
- An administration panel
- In-system administrator-approved exceptions
