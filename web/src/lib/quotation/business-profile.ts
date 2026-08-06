export type BusinessProfile = Readonly<{
  businessName: string;
  legalName?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logoPath?: string;
}>;

export const DIGITAL_RESPAWN_BUSINESS_PROFILE = Object.freeze({
  businessName: "Digital Respawn",
}) satisfies BusinessProfile;
