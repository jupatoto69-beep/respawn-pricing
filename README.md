# Respawn Pricing

Internal pricing and temporary quotation tool for Digital Respawn.

## Overview

Respawn Pricing helps employees calculate consistent prices from a catalog and
commercial rules loaded by the application.

The first release will support:

- Fixed prices and area-based prices
- Optional additions
- Product-specific discount limits
- Final minimum charges for applicable pricing groups
- Commercial rounding upward to a COP 500 increment
- A temporary on-screen quotation

For area-based products, compatible pieces are grouped before pricing. The
authorized discount applies only to the group's base price, additions remain
undiscounted, and the configured minimum is enforced afterward as the lowest
final group price before upward rounding.

The temporary quotation will add the already rounded final price of each line.
It will use COP only, will not calculate taxes automatically, and will clearly
state that taxes are not calculated.

The first release has one conceptual employee role. It will not include
authentication, in-system administrator authorization, a database, an
administrative panel, or persistent catalog editing.

The public repository will contain only illustrative or example catalog and
commercial data. Real prices and commercial rules will be loaded from a local
configuration excluded from version control. Hiding costs, margins, and
minimum charges in the first-release interface is a visual restriction, not a
complete security guarantee, because that release has no backend or
authentication. A future backend with authentication will provide actual
protection for internal data.

Cost-and-margin pricing remains part of the documented product model, but its
implementation is deferred to a later release.

## Documentation

- [Product vision](docs/product-vision.md)
- [Pricing model](docs/pricing-model.md)
- [First release requirements](docs/first-release-requirements.md)

## Project status

Early development.
