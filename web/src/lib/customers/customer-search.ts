import type { Customer } from "./customer";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .trim();
}

export function filterCustomers(
  customers: readonly Customer[],
  query: string,
): readonly Customer[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return customers;
  }

  return customers.filter((customer) =>
    [
      customer.name,
      customer.document,
      customer.phoneNumber,
      customer.email,
    ].some(
      (value) =>
        value !== null && normalizeSearchText(value).includes(normalizedQuery),
    ),
  );
}
