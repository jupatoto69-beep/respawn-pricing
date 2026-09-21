import type { PhoneCountryIso2 } from "@/lib/pricing/phone-country-catalog";

export type Customer = Readonly<{
  id: string;
  name: string;
  document: string | null;
  phoneCountryIso2: PhoneCountryIso2 | null;
  phoneNumber: string | null;
  email: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type CustomerInput = Readonly<{
  name: string;
  document: string;
  phoneCountryIso2: PhoneCountryIso2;
  phoneNumber: string;
  email: string;
  city: string;
}>;
