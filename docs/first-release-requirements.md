# First Release Requirements

## Purpose and authority

Respawn Pricing is an internal pricing and temporary quotation tool for Digital
Respawn employees. Its purpose is to produce consistent sale prices from
privately configured commercial rules while preventing unauthorized prices.

The first release is a desktop-oriented web application built with Next.js.
This document defines the normative scope of that release. The broader product
direction in [Product Vision](product-vision.md) remains relevant to later
releases. The cost-and-margin concepts in [Pricing Model](pricing-model.md) are
documented for future generic use. The precise 3D-printing strategy described
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

### Precise 3D-printing pricing

`Impresión 3D` is a third top-level quotation mode alongside `Productos por
área` and `Servicios`; it is not a service within the `Impresos` catalog. Its
precise form accepts PLA or PETG, grams per unit, whole printing hours and
minutes per unit, a positive integer quantity, and one modeling option for the
job. Grams and time always describe one unit; quantity multiplies the material
and machine-time parts, while modeling is added only once.

Typed configuration and pure domain functions derive the normal suggested
commercial price, enforce the absolute commercial minimum, and apply the
shared upward COP 500 rounding. The employee may enable `Modificar precio` and
enter a custom amount. A raw amount below the internal threshold shows only
`Este precio requiere autorización.` and requires the explicit confirmation
`Confirmo que este precio está autorizado`; without confirmation, calculation
and quotation addition remain blocked. A confirmed exception is rounded upward
to COP 500 only after authorization. COP 5.000 is an absolute minimum and
cannot be bypassed by the confirmation.

This confirmation is an acknowledgement of an authorization obtained outside
the application. It is not authentication, role enforcement or a real
permissions system.

The employee result may show material, grams and printing time per unit,
quantity, modeling, pricing mode, suggested price and final accepted price. It
must not show internal material or electricity costs, spool economics,
increases, multipliers, margins, base cost, or authorization threshold. The
stored quotation line contains only the commercial title, quantity,
customer-safe selections and accepted final total. It does not store the
confirmation state or an artificial `Categoría: Impresos` detail.

The pricing engine consumes already-resolved grams and printing time rather
than form-origin metadata. A future estimator may therefore supply estimated
metrics to the same engine. Estimation from length × width × height, volume,
density classifications and calibration coefficients is not part of this
release.

### Documented service and print catalog strategies

The confirmed service and print catalog in
[Pricing Model](pricing-model.md) records fixed prices, bundle prices, quantity
tiers, duration pricing and optional add-ons. Generic fixed-price calculation
and compatible additions are already supported first-release concepts. The
catalog entries and their catalog-specific bundle, quantity-tier, duration and
per-unit optional-add-on rules are documented inputs for future implementation
and are not added to the application by this documentation change.

This catalog documentation does not implement:

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

The precise 3D-printing strategy above is the implemented exception to this
older documentation-only catalog boundary. It does not implement the future
quick estimator, persistent price editing, or a generic administration model.

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
| Panaflex | Standard material | Illuminated-sign strategies | COP 85,000/m² |

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
for normal product-and-variant selections.

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

Cut vinyl has a COP 15,000 commercial minimum per color group. Pieces of the
same product and color may be grouped before evaluating that minimum. Different
colors form separate groups and evaluate the minimum independently. This is a
confirmed public product rule and is distinct from the private final minimum
floor used for exceptional-price authorization.

## Confirmed future special pricing rules

The following rules are confirmed but remain outside the first-release
implementation scope.

For general structures, `areaBasePrice` is the area-based material price in
COP, calculated using the applicable final sales rate in COP/m²:

```text
single-face structure price = areaBasePrice × 4
double-face structure price = (areaBasePrice × 4) + areaBasePrice
```

For illuminated panaflex signs, dimensions are centimeters (cm) and their
product is square centimeters (cm²):

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

## Discounts

- Each product or service may define its own maximum authorized discount.
- The application must reject a negative discount.
- The application must reject a discount above the configured maximum.
- A discount applies only to the base price.
- Laminates and all other additions are not discounted.

An automatic quantity-tier price is not a manual employee discount. It becomes
the applicable unit price when quantity reaches the configured inclusive
threshold, applies to every unit in the selection, and may be lower than the
minimum price an employee is authorized to enter manually.

## Commercial price levels

- The normal price is the standard customer-facing unit price before an
  applicable quantity tier.
- The automatic quantity-tier price is selected by the configured quantity
  rule, not entered as a manual employee discount.
- The minimum employee-authorized price is the lowest price an employee may
  authorize when a manual adjustment is available. A confirmed amount may be
  documented publicly.
- A private internal floor for exceptions is an additional internal control.
  Its amount remains private unless it has been explicitly confirmed as public.

## Minimum charges and exceptions

- Private internal final minimum floors for exceptions are private commercial
  configuration.
- Internal floor amounts that have not been publicly confirmed must not be
  stored in public documentation or committed public configuration.
- A publicly confirmed minimum employee-authorized sales price is distinct
  from a private internal floor and may be documented publicly.
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

For precise 3D printing, the applicable visible fields are the selected
material, grams and time per unit, quantity, modeling, price-source state,
suggested price and final accepted price. Internal cost components and the
authorization threshold replace the generic list-price/discount concepts and
remain hidden.

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
on-screen temporary quotation. Every stored line is an immutable snapshot of
the customer-safe selections, quantity and final price returned by its
calculator. Changing calculator mode, category, service or form values does not
change lines that were already added.

A precise 3D line stores its accepted rounded total and only customer-safe
material, grams-per-unit, time-per-unit and modeling details. Later form,
material, modeling or runtime configuration changes do not recalculate it.

The quotation total is the exact sum of the stored final line totals. The
quotation does not multiply quantity again, apply COP 500 rounding again,
re-evaluate quantity tiers, recalculate additions, negotiated prices or
minimums, or consult a catalog after a line is added.

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
- Quick 3D estimation from dimensions, volume or density coefficients.
- Editable 3D prices or an administration/database-backed pricing catalog.
- Authentication, roles or in-system permission grants for exceptional prices.
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
- Presents a formal read-only preview of the current temporary quotation
  without repricing it.
- Downloads that same safe preview model as a local PDF without repricing,
  uploading or persisting quotation data.
- Prices precise 3D jobs without exposing internal pricing in the employee
  result, stored customer-facing snapshot, preview or PDF.
