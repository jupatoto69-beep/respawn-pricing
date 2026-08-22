# First Release Requirements

## Purpose and authority

Respawn Pricing is an internal pricing and temporary quotation tool for Digital
Respawn employees. Its purpose is to produce consistent sale prices from
privately configured commercial rules while preventing unauthorized prices.

The first release is a desktop-oriented web application built with Next.js.
This document defines the normative scope of that release. The broader product
direction in [Product Vision](product-vision.md) remains relevant to later
releases. The cost-and-margin concepts in [Pricing Model](pricing-model.md) are
documented for future generic use. The 3D-printing strategy described
below is a deliberately scoped implementation and does not add a generic
cost-and-margin editor or administration system.

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
result. Current fixed-price service calculators store the exact configured
unit-price-times-quantity total. They do not pass that result through a generic
discount, addition, minimum or COP 500 rounding pipeline.

### Area-based products

An area-based product derives its base price from valid dimensions in
centimeters, a configured square-meter rate, and quantity. Compatible items
may share a commercial group as defined below.

### Cost-and-margin pricing

Cost-and-margin pricing is documented conceptually in
[Pricing Model](pricing-model.md), but its implementation is postponed. The
first release does not accept costs or margins as inputs and does not calculate
prices from them.

### 3D-printing pricing

`Impresión 3D` is a third top-level quotation mode alongside `Productos por
área` and `Servicios`; it is not a service within the `Impresos` catalog. It has
two employee-facing submodes: `Cotización precisa` and `Estimación rápida`.

The precise form is used after the employee receives or prepares and slices the
real model. It accepts PLA or PETG, grams per unit, whole printing hours and
minutes per unit, a positive integer quantity, one modeling option for the job,
`Un color` or `Multicolor`, and a KE or HI production printer. Grams and time
always describe one unit; quantity multiplies the material and machine-time
parts, while modeling is added only once. The precise form does not request
width, depth or height, calculate a footprint, infer printer compatibility or
show dimensional division warnings.

`Estimación rápida` is an intentionally simple preliminary workflow for an
unsliced request. It records approximate requested size, piece type or a short
description, material, quantity, modeling, color mode and a required
employee-entered `Precio estimado total`. It does not request slicer grams or
slicer time, and it must show `Estimación preliminar. Para determinar el precio
definitivo se requiere recibir y laminar el archivo 3D.`

The quick estimated price is a manual preliminary total for the complete job,
already including the requested quantity. It is not a unit price and the
application must not multiply it by quantity. The raw amount must be finite,
positive and at least COP 5.000; after validation it is rounded upward to COP
500. It does not pass through the precise engine and therefore does not apply
precise material and machine-time calculations, an automatic price or the
precise manual-price authorization flow. Quick Multicolor may record the safe
operational detail `Producción: HI` without changing the employee-entered
whole-job total.

An accepted quick estimate may create an immutable `Impresión 3D — Estimación
preliminar` quotation line. The line stores the requested quantity, the rounded
whole-job total, customer-safe selections and `Valor estimado. El precio
definitivo puede cambiar después de recibir y laminar el archivo 3D.` It appears
unchanged in the temporary quotation, formal preview and PDF. Cube
calibration, `Ligera`/`Normal`/`Densa` profiles, interpolation and extrapolation
are not active.

The precise engine uses actual slicer grams and time per unit, applies quantity
to the per-unit production components and applies the selected modeling option
once per job. Private typed configuration derives the suggested commercial
price and the internal boundary for its guarded manual-price control. The
accepted final amount uses the current precise 3D upward COP 500 rounding
strategy. A manual amount that requires authorization remains blocked until
the employee explicitly confirms that authorization was obtained.

One-color and Multicolor work follow their configured precise commercial
behavior, and Multicolor is operationally HI-only. Actual internal costs,
commercial coefficients, profitability information and authorization
thresholds must not be copied into public documentation or employee/customer
views.

The printer selector identifies the actual production printer, not estimated
compatibility. One-color work allows KE or HI. Multicolor production is HI-only:
changing to Multicolor resolves the printer to HI and KE cannot remain a valid
choice. Returning to one color leaves HI valid. Changing the production printer
alone does not change the commercial price or authorization because no
printer-specific electricity or power values have been supplied; the release
must not invent them. The slicer/operator remains responsible for confirming
that the prepared job fits the selected printer.

This confirmation is an acknowledgement of an authorization obtained outside
the application. It is not authentication, role enforcement or a real
permissions system.

The precise employee result may show material, slicer grams and time, quantity,
modeling, color mode, selected production printer, price-source state,
suggested price and final accepted price. Results must not show internal
material or electricity costs, spool economics, increases, multipliers,
margins, base cost, or authorization threshold. The stored precise quotation
line contains only the commercial title, material, grams per unit, printing
time per unit, modeling, color mode, production printer, quantity and accepted
final total. It does not store confirmation state or an artificial `Categoría:
Impresos` detail. Preview and PDF consume that immutable snapshot and never
rerun the pricing engine. This scope adds no database, persistence,
authentication, roles or administration UI.

### Implemented service and print catalog strategies

The current `Servicios` mode implements calculators for computer maintenance,
Office installation, individual software installation, hard-drive recovery,
protected-system access, simple video editing, business cards and tabloids.

Those calculators use explicit fixed prices, the complete-maintenance bundle,
quantity tiers, duration-based pricing, negotiated prices where supported,
public product-specific commercial minimums, and tabloid lamination. The
specific catalog rules are documented in [Pricing Model](pricing-model.md).

These implementations do not provide generic percentage-discount, addition or
minimum engines. Database persistence, a catalog administration panel and
generic cost-and-margin pricing remain future scope.

## Initial area-product catalog

Employees normally select a product and variant. The application must resolve
the corresponding configured final sales rate automatically. These
customer-facing rates may be stored in the public repository.

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

A product identifies the item sold; a variant identifies its material or
finish option; a pricing strategy identifies the calculation rule; and a final
sales rate is the public configured customer-facing rate used by that rule.
Final customer-facing sales prices, thresholds, quantity-tier prices, bundle
prices, optional-add-on prices and minimum employee-authorized sales prices may
be documented publicly. Actual Digital Respawn costs, actual margins,
profitability, suppliers, internal purchasing conditions and any additional
internal floor that has not been publicly confirmed are private commercial
information and must not be documented publicly or exposed to employees. This
does not prevent documentation of general future-model concepts or clearly
identified fictitious examples.

### Exceptional custom rate

Custom rate is exceptional rather than a normal catalog variant. The employee
must explicitly select the custom-rate option before the application displays
a manual final-sales-rate field in COP/m². The manual field must remain hidden
for normal product-and-variant selections. An entered Custom rate must be
finite and strictly greater than zero.

## Area-based calculation

For Printed vinyl, Cut vinyl, Banner and material-only Panaflex, the application
must:

1. Validate positive dimensions and a positive integer quantity.
2. Calculate the unrounded area per unit:

   ```text
   area per unit in m² = (lengthCm × widthCm) / 10,000
   ```

3. Include quantity in the total area and multiply by the resolved public
   variant rate or a valid exceptional Custom rate.
4. Apply the Banner structure/lamination rule when Banner is selected.
5. For Cut vinyl, preserve the unrounded commercial subtotal for color-group
   evaluation; for other area products, round the product-specific result
   upward once to COP 500.
6. Store the accepted commercial result as the quotation line's `lineTotal`.

Illuminated Panaflex uses its separate direct cm² strategy below. A stored
`lineTotal` already includes quantity. The quotation does not multiply it or
round it again.

## Grouping rules

Normal area-product lines are independent pricing snapshots. Cut vinyl is the
only current area-product rule that depends on the composition of the temporary
quotation.

Cut vinyl requires a color. The application trims surrounding whitespace,
collapses repeated internal whitespace, normalizes Unicode text and compares
case-insensitively so accidental formatting differences do not create separate
commercial groups. Accents remain significant. Different normalized colors
form separate groups.

Cut vinyl has a public COP 15,000 commercial minimum per normalized color
group. Piece subtotals in that group are combined before the minimum is
evaluated, and the complete group receives one upward COP 500 rounding.

For Cut vinyl, the complete color group is the commercial unit that receives
the minimum and one upward COP 500 rounding. Individual stored piece lines may
carry deterministic proportional contributions whose sum is exactly the
once-rounded group total. Those contributions are not protected or rounded
independently and therefore do not need to be COP 500 multiples.

Adding or removing a Cut vinyl piece reevaluates only the affected color group.
Other products and services are not automatically repriced.

Current behavior does not separate Standard and Custom rate Cut vinyl pieces
when they share the same normalized color. Whether mixed-rate pieces should
instead form separate groups is pending business confirmation; it is not a new
commercial rule established by this documentation.

## Implemented area-product special pricing rules

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

The application applies one upward COP 500 rounding after the complete Banner
formula. It must not calculate laminated structures as COP 85,000 multiplied
by the structure factor.

Custom rate remains exceptional. For Banner it replaces the material rate used
by the 1/4/5 structure multiplier and does not add automatic lamination.

### Panaflex

Material-only Panaflex uses area-based pricing at COP 85,000/m² and supports
the exceptional Custom rate option. Illuminated signs use a separate direct
calculation. Their input dimensions are centimeters (cm) and their product is
square centimeters (cm²):

```text
areaCm2 = lengthCm × widthCm

if areaCm2 < 10,000 cm²:
  structure rate per cm² = 45
  small-measure multiplier = 2

if areaCm2 >= 10,000 cm²:
  structure rate per cm² = 34
  small-measure multiplier = 1
```

Quantity is included before applying the small-measure multiplier:

```text
one-face component = areaCm2 × structure rate per cm² × quantity
additional double-face component = areaCm2 × 8.5 × quantity
normal price = one-face component + additional double-face component
adjusted price = normal price × small-measure multiplier
commercial price = round adjusted price upward to a COP 500 multiple
```

The additional double-face component is zero for a one-face sign. The
small-measure multiplier applies to the complete normal price, including the
additional face, and no intermediate value is rounded.

The 10,000 threshold is measured in cm². It is distinct from input dimensions
in cm and from catalog rates expressed per square meter (m²). Exactly 10,000
cm² is standard and does not receive the multiplier.

## COP 500 rounding

COP 500 rounding is not a universal post-processing rule:

- Area products use upward COP 500 rounding when their implemented strategy
  reaches the commercial rounding stage.
- Cut vinyl rounds the complete normalized color group once and distributes
  that result across its stored piece lines.
- Precise and quick 3D workflows use upward COP 500 rounding according to their
  separate acceptance strategies.
- Business cards and tabloids preserve their calculated totals without passing
  through a generic COP 500 helper.
- The temporary quotation sums stored totals exactly and never rounds the grand
  total again.

## Product-specific adjustments

The current application implements explicit adjustments only where a product
or service defines them. These include quantity tiers, negotiated business-card
and tabloid prices, tabloid lamination, Banner structures and lamination,
Panaflex additional-face pricing, 3D modeling and precise Multicolor behavior.

An automatic quantity-tier price is not a generic employee discount. It becomes
the applicable unit price when quantity reaches the configured inclusive
threshold and applies to every unit in that selection.

Generic percentage discounts, generic additions and a generic commercial
minimum engine are future concepts and are not current first-release
capabilities.

## Commercial price levels

- The normal price is the standard customer-facing unit price before an
  applicable quantity tier.
- The automatic quantity-tier price is selected by the configured quantity
  rule.
- A negotiated price is an employee-entered unit price supported only by the
  business-card and tabloid calculators.
- A public minimum employee-authorized price applies only where that specific
  negotiated-price rule defines one.
- Private internal boundaries used by guarded pricing remain private.

## Commercial minimums and exceptions

- There is no universal generic minimum applied to every calculator.
- Cut vinyl has the confirmed public COP 15,000 minimum per normalized color
  group.
- Business cards and tabloids enforce only the public, product-specific
  negotiated-price minimums documented in [Pricing Model](pricing-model.md).
- The 3D strategies enforce their current validation and guarded manual-price
  behavior without exposing private costs, profitability configuration or
  sensitive internal thresholds.
- A confirmation control records only that an external authorization was
  acknowledged. It is not authentication, role enforcement or an in-system
  permission grant.

Because this release has no authentication or authorization system, hiding
commercial data in the interface is not an access-control boundary. Private
configuration must not be included in employee-facing responses or public
client assets, and operational access to the application and its configuration
must be controlled outside the application.

## Employee-visible information

For each calculation, the employee interface must show:

- The selected product or service.
- The public inputs and selections required by that strategy.
- Quantity and the accepted final price with the strategy-specific breakdown
  that is safe for the employee.
- An action to add the priced line to the temporary quotation.

For precise 3D printing, the applicable visible fields are material, actual
slicer grams and time, quantity, modeling, color mode, production printer,
price-source state, suggested price and final accepted price. Quick mode shows
its preliminary intake fields, employee-entered whole-job total, accepted
rounded total and required non-definitive notice.
Internal cost components and authorization thresholds remain hidden.

## Information hidden from employees

The employee interface must not expose:

- Costs.
- Profit margins.
- Profitability.
- Suppliers.
- Internal minimum-charge values.
- 3D spool price or weight economics.
- 3D material increases, electricity inputs or derived costs.
- 3D base cost, internal multipliers or authorization threshold.

## Temporary quotation

An employee may add one or more valid area-product or service results to an
on-screen temporary quotation. Except for the Cut vinyl color-group rule below,
every stored line is an immutable snapshot of the customer-safe selections,
quantity and final price returned by its calculator. Changing calculator mode,
category, service or form values does not change lines that were already added.

Each stored Cut vinyl piece preserves its customer-safe selection, quantity,
color and commercial subtotal snapshot. Its final line contribution is the
specific exception: when a piece is added to or removed from the same color
group, the quotation reevaluates that complete group, applies its minimum and
rounding once, and redistributes the resulting total across the current piece
lines. No other product is automatically repriced when quotation composition
changes.

A precise 3D line stores its accepted rounded total and only customer-safe
material, slicer metrics, modeling, color and production-printer details.
Later form, material, modeling or runtime configuration changes do not
recalculate it. A quick-estimate line likewise stores its accepted rounded
whole-job total and safe preliminary details; later quick-form changes do not
reprice the stored line. Its provisional condition remains attached to that
line in the temporary quotation, formal preview and PDF.

The quotation total is the exact sum of the stored final line totals. Normal
lines are not repriced: the quotation does not multiply quantity again, apply
COP 500 rounding again, re-evaluate quantity tiers, recalculate additions,
negotiated prices or minimums, or consult a catalog after a line is added. The
only composition-dependent exception is the stored Cut vinyl color-group
calculation described above.

The quotation exists only in page memory. It remains available while switching
between calculator modes, but refreshing or closing the page clears it. It uses
no local storage, session storage, cookies, database, API route or backend
persistence. It is a working aid rather than a persisted commercial record.

Adding the first stored line freezes the quotation date from the browser's
local calendar as year, month and day. That date remains unchanged while the
quotation exists, including across calculator changes, preview openings and PDF
downloads, and is presented to the customer as `DD/MM/YYYY`. The configured
quotation validity is 15 days and is presented read-only as `15 días`; this
release does not calculate or display an expiration date. Confirming the
complete quotation clearing removes the frozen date so the next quotation
receives a new local date when its first line is added.

The quotation may include optional customer or company name, document or NIT,
phone country and national number, email, city and general notes. These values
share the quotation's in-memory lifetime, remain available while switching
calculator modes, categories and services, and do not affect any price or
stored line. Confirming the complete quotation clearing removes every line,
customer field and note; cancelling preserves them all.

When the quotation contains at least one stored line, the employee may open a
formal read-only preview for the customer. A calculated result that has not
been added is not a quotation line and cannot enable the preview. Before
opening, every non-empty customer field is validated with the same quotation
validators used by the editable form. Validation errors block opening, all
related accessible errors are shown and focus moves to the first invalid field.

The preview presents the configured Digital Respawn business name, the frozen
quotation date, configured validity, only useful non-empty customer fields,
every current stored line in order, each stored line total, the exact quotation
total and useful non-whitespace notes. It does not show technical line
identifiers or internal commercial information, and it does not recalculate,
round or otherwise change a price. Opening and closing the preview does not
change the quotation or any calculator state.

While the formal preview is open, the employee may download that same frozen,
customer-safe presentation model as an A4 PDF. The browser generates the PDF
locally with `jsPDF`, native selectable text, the same date and validity, and
the already stored line order, quantities, line totals and exact quotation
total. It does not consult a calculator, reconstruct a line, recalculate, round
or otherwise change a price. The action keeps the preview and the temporary
quotation open and usable.

The typed business profile configures two official local logo variants. The
dark formal preview uses `/brand/digital-respawn-logo-white.png`; the PDF on a
white page uses `/brand/digital-respawn-logo-black.png`. Both retain their
horizontal proportion and bounded dimensions. The configured business name is
always shown as text, so a missing preview logo does not block the preview and
a missing PDF logo does not block document generation.

`jsPDF` is the sole PDF-generation dependency. It was selected for maintained
browser and TypeScript support, A4 pages, local PNG embedding and native PDF
text without a screenshot or external conversion service. It is loaded only
when export starts and does not transmit data. Standard built-in PDF fonts
cover the required Spanish Latin characters and multiplication sign without a
remote or repository font file.

The first release has no customer database and does not persist, save, retrieve,
upload, print, share by WhatsApp or email, send email, or retain a quotation
history. It has no quotation backend. PDF bytes and the temporary download are
created only in the browser; object URLs and temporary links are released after
each attempt. Taxes are not calculated automatically.

## Out of scope

The following functionality is explicitly excluded from the first release:

- Authentication or authorization.
- Database persistence.
- An administration panel.
- Persistent catalog editing.
- Persistent quotation history.
- Printing.
- Quotation backend or API.
- Inventory management.
- Supplier management.
- Cost-and-margin pricing.
- Automatic quick 3D estimation from approximate size, calibration profiles,
  interpolation or extrapolation.
- STL geometry analysis, automatic supports or automatic model splitting.
- Additional printers, materials, resin or invented printer Z limits.
- Persistent or administration/database-backed editing of the 3D pricing
  catalog.
- Authentication, roles or in-system permission grants for exceptional prices.
- Accounting, electronic invoicing, online payments, and multi-company
  support.

## Acceptance conditions

The first release satisfies these requirements when it:

- Prices fixed-price and area-based products and services using configured
  rules.
- Applies current product-specific tiers, negotiated-price confirmations,
  additions, commercial minimums and rounding only where their calculator
  defines them.
- Applies the Cut vinyl minimum and one rounding per normalized color group
  while preserving all unrelated quotation snapshots.
- Shows only employee-visible commercial information.
- Builds a temporary on-screen quotation without persisting it.
- Validates optional customer details when populated and preserves the frozen
  browser-local date and 15-day validity across preview and PDF.
- Presents a formal read-only preview of the current temporary quotation
  without repricing it.
- Downloads that same safe preview model as a local PDF without repricing,
  uploading or persisting quotation data.
- Prices precise 3D jobs from actual slicer grams and time without exposing
  internal pricing in the employee result, stored customer-facing snapshot,
  preview or PDF.
- Provides a separate preliminary 3D workflow that never predicts price from
  size but can store an employee-entered, rounded whole-job estimate as an
  explicitly provisional formal quotation line.
