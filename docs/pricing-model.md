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
| Panaflex | Standard material | Area-based material pricing | COP 85,000/m² |

Cut vinyl has no lamination variants in the first release.

### Custom rate

Custom rate is an exceptional pricing option, not a normal product variant.
The employee must select it explicitly. Only after that selection may the
application show a manual final-sales-rate field in COP/m²; otherwise the field
must remain hidden. A Custom rate must be finite and strictly greater than
zero.

## Implemented service and print catalog

The following final customer-facing sales prices and rules are confirmed and
may be documented publicly. The current application implements calculators for
every catalog entry in this section.

### Strategy definitions

- **Fixed price:** one configured price for one service.
- **Bundle price:** a special price for a confirmed combination of services.
- **Quantity tier:** the unit price changes automatically when quantity reaches
  a threshold.
- **Duration pricing:** a base price plus a charge for each additional started
  minute.
- **Negotiated pricing:** an optional employee-entered unit price where the
  specific calculator supports it, with its own confirmation behavior.
- **Optional add-on:** an additional configured amount added per unit.
- **3D printing:** a material- and machine-time-based commercial strategy with
  actual slicer inputs, one modeling charge per job, an automatic commercial
  price and a guarded manual final-price option.

These are separate, product-specific strategies. Their implementation does not
provide a generic percentage-discount engine, a generic additions engine or a
generic minimum engine.

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
- Standard adhesive minimum employee-authorized price: COP 15,000 per unit
- Pre-cut for stickers or custom shapes: COP 25,000 per unit
- Pre-cut minimum employee-authorized price: COP 20,000 per unit
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

### 3D printing

`Impresión 3D` is implemented as a top-level quotation mode alongside
`Productos por área` and `Servicios`; it is not part of the `Impresos` service
catalog. It contains separate `Cotización precisa` and `Estimación rápida`
employee workflows.

For precise quotation, the employee receives or prepares the real 3D model,
slices it, and enters the slicer's actual grams and printing time. The form also
receives material, positive integer quantity, production printer, color mode,
and one of these modeling selections: no modeling, AI-generated or AI-assisted
model, basic design, or complex design. Because the prepared job has already
been sliced, the precise form does not request width, depth or height, calculate
a footprint, infer printer compatibility or show dimensional division warnings.

Quick mode is a preliminary workflow for a request that has not been sliced. It
collects approximate requested size, piece type or a short description,
material, quantity, modeling, color mode and an employee-entered manual
estimated total. The amount is the total for the complete requested job,
already considering quantity; it is not a unit price and is not multiplied by
quantity again. It must be finite, positive and at least COP 5.000, then is
rounded upward to COP 500.

The quick total is accepted through a separate typed boundary and does not call
the precise 3D engine. It does not calculate material consumption, machine
time or an automatic price, and it has no below-threshold authorization flow.
Multicolor may store the customer-safe operational detail `Producción: HI`
without changing the employee-entered total. The accepted total and
preliminary selections form an immutable `Impresión 3D — Estimación
preliminar` line whose warning travels through the temporary quotation, formal
preview and PDF. No cube calibration, density profile, interpolation or
extrapolation is active.

#### Printer and color configuration

Typed printer configuration lists KE and HI as production choices without
attaching dimensions or pricing data. One-color jobs may be produced on either
printer. Multicolor jobs are HI-only, so changing to Multicolor resolves the
selection to HI and rejects KE as a production choice. Returning to one color
keeps HI valid. Printer selection alone does not affect price or authorization
because no printer-specific power/electricity values have been supplied.

The precise pricing engine consumes the actual slicer grams and printing time
per unit. Quantity affects the per-unit production components, while the
selected modeling option is applied once per job. The engine obtains its
suggested commercial price and guarded manual-price behavior from private typed
configuration, then applies the current 3D commercial floor and upward COP 500
rounding. A manual amount that requires authorization is not accepted until
the employee explicitly confirms that authorization has been obtained.

One-color and Multicolor jobs follow their configured precise commercial
behavior. Multicolor is operationally HI-only. The coefficients, internal
costs, profitability data and authorization thresholds behind those results
are private implementation details and are not public documentation or
customer-facing output.

The confirmation records only an acknowledgement for the current form values.
It resets when threshold-affecting inputs change: material, grams, printing
time, quantity, modeling, color, manual amount or manual-price enablement.
Changing only the production printer does not reset it. The confirmation is not
authentication, a permission grant or a role system.

Employee and customer-facing models expose only customer-safe material, actual
slicer metrics, quantity, modeling, color and selected production printer,
suggested/final commercial price as applicable, and accepted stored total.
They do not expose spool economics, material or electricity costs,
material increase, base cost, internal multipliers, margin, authorization
threshold, or whether confirmation was required. The stored 3D snapshot has no
`Categoría: Impresos` detail. Preview and PDF use that immutable customer-safe
snapshot and never invoke the pricing engine. This feature adds no database,
persistence, authentication, roles or administration UI.

### Implementation boundary

The service forms, fixed and bundle prices, quantity tiers, video-duration
calculation, negotiated business-card and tabloid prices, tabloid lamination,
temporary quotation lines and both 3D workflows are implemented.

This does not create generic percentage-discount, addition or minimum engines.
Database persistence, authentication, roles, catalog administration and
generic cost-and-margin pricing remain future scope.

## First-release pricing strategies

### Fixed-price products and services

A fixed-price product or service starts from a configured unit price, which is
its list price. Quantity must be a positive integer, and the line base price is:

```text
fixed base price = configured unit price × quantity
```

Each fixed-price selection is treated as its own quotation line and commercial
result. Current fixed-price service calculators store this exact accepted total;
they do not pass it through a generic discount, addition, minimum or COP 500
rounding pipeline.

### Area-based products

An area-based product starts from valid dimensions in centimeters, quantity
and a configured square-meter rate:

```text
area in square meters = (length in centimeters / 100)
                       × (width in centimeters / 100)

base price = area in square meters × configured rate × quantity
```

The normal area-product flow applies the product-specific rule, then rounds the
commercial result upward to COP 500. Normal quotation lines remain independent.
Cut vinyl color groups are the sole composition-dependent exception described
below.

## Implemented area-product special pricing

The following rules are implemented by the current area-product calculator.

### Banner

Let `A` be the total area in m², including quantity:

```text
S = A × COP 80,000
L = A × COP 5,000
```

Standard Banner pricing is:

```text
material only = S
single-face structure = 4S
double-face structure = 5S
```

Laminated Banner pricing is:

```text
material only = S + L
single-face structure = 4S + L
double-face structure = 5S + 2L
```

The selected structure and lamination components are combined before one
upward COP 500 rounding. In particular, laminated structures are not calculated
as the complete COP 85,000/m² rate multiplied by four or five.

Custom rate remains an explicit exceptional option. It replaces the material
rate used by the 1/4/5 structure multiplier and does not add automatic Banner
lamination.

### Panaflex

#### Material only

Panaflex material-only pricing is area-based at COP 85,000/m² and supports the
explicit exceptional Custom rate option. Illuminated-sign pricing is a separate
direct calculation in square centimeters and does not use that material rate.

#### Illuminated signs

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

Cut vinyl requires a color for commercial grouping and uses the public
COP 80,000/m² Standard rate. Surrounding whitespace is removed, repeated
internal whitespace is collapsed and casing is ignored for comparison, so
accidental formatting differences do not create separate groups. Different
normalized colors remain separate.

The COP 15,000 commercial minimum applies once per normalized color group,
after the piece subtotals have been combined. This is a confirmed public
product rule and is not a generic minimum engine.

The complete Cut vinyl color group is the commercial unit that receives the
minimum and one upward COP 500 rounding. When its composition changes, its
stored piece lines reevaluate the group total from their commercial subtotal
snapshots. Their deterministic proportional contributions sum exactly to the
once-rounded group total but are not independently rounded and therefore do
not need to be COP 500 multiples. Other quotation lines retain their stored
commercial totals and are not automatically repriced.

Current behavior groups Cut vinyl by product and normalized color without
separating Standard and Custom rate pieces of that color. Whether mixed-rate
pieces should instead form separate commercial groups remains pending business
confirmation; this document records the current behavior without establishing
a new commercial rule.

## Product-specific adjustments and generic future concepts

### Implemented rules

The current calculators implement explicit rules where required, including:

- Quantity tiers for software installation, business cards and tabloids.
- Fixed and bundle prices for computer services.
- Duration-based simple-video pricing.
- Negotiated prices for business cards and tabloids, with their specific
  confirmation behavior.
- Tabloid lamination, Banner structures and lamination, and the additional
  Panaflex face.
- Cut vinyl color-group minimum and rounding.
- 3D modeling and color-mode behavior within the precise 3D strategy.

These rules are not routed through generic discount, addition or minimum
engines.

### Future generic concepts

The following concepts may support broader catalog administration in a future
release but are not implemented as general-purpose engines today:

- Percentage discounts applicable to arbitrary catalog items.
- Generic additions applicable to arbitrary catalog items.
- A generic commercial-minimum engine.
- Cost-and-margin pricing.

## Stored commercial results

Each calculator validates its own inputs and produces an accepted `lineTotal`
whose quantity semantics are already complete. The temporary quotation stores
that result and sums stored `lineTotal` values exactly; it does not multiply
quantity, reapply a tier or addition, enforce another minimum, rerun a catalog
strategy or round the quotation total.

Normal lines preserve independent snapshots. Cut vinyl is the explicit
composition-dependent exception: adding or removing a piece can reevaluate
only its normalized color group and redistribute that group's once-rounded
total. Preview and PDF consume the stored customer-safe representation and do
not reconstruct pricing.

Customer details and notes are optional and are validated when populated
before the formal preview opens. Adding the first line freezes a browser-local
calendar date for the quotation; preview and PDF show that same date and the
configured 15-day validity. The PDF is generated locally in the browser from
the same safe view model, without projecting internal grouping or commercial
metadata.

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

If a future generic cost-and-margin strategy is implemented, its cost-derived
list price may enter a future discount/addition/minimum sequence. Applying a
discount would produce an intermediate discounted base price, not a final
current-release result.

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

The discounted base price is an intermediate result. In a hypothetical future
generic workflow, additions, a configured minimum floor and commercial
rounding could still be applied in that order.

## Validation rules

- Dimensions required for area pricing must be positive numeric values.
- Quantity must be a positive integer.
- An exceptional Custom area rate must be finite and strictly greater than
  zero.
- Cut vinyl requires a non-empty color after normalization.
- Each service validates the inputs required by its own fixed, tiered,
  duration-based or negotiated strategy.
- Precise and quick 3D flows validate their separate inputs and acceptance
  rules before producing a final total.

If future generic discount or cost-and-margin strategies are implemented, they
must add their own percentage, cost, margin and authorization validation.

## Rounding

COP 500 rounding is strategy-specific, not universal:

- Area products use upward COP 500 rounding after their implemented
  product-specific calculation.
- A Cut vinyl color group receives that rounding once; its distributed line
  contributions do not need to be COP 500 multiples.
- Precise and quick 3D pricing use upward COP 500 rounding according to their
  separate acceptance strategies.
- Business cards and tabloids preserve their calculated totals and do not pass
  through a generic COP 500 rounding rule.
- Other service calculators likewise preserve the exact result of their
  specific strategy unless that strategy explicitly defines rounding.

A value already at an exact COP 500 increment remains unchanged when a
strategy does use this rounding helper.

## First-release limitations

The first release does not include:

- Taxes
- Payment processing fees
- Customer-specific price lists
- Generic percentage-discount, addition and commercial-minimum engines
- Promotional campaigns
- Cost-and-margin pricing
- Database persistence
- Persistent quotation history
- Authentication or authorization
- An administration panel
- In-system administrator-approved exceptions
