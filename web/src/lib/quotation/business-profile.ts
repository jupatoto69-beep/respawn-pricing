export type BusinessProfile = Readonly<{
  businessName: string;
  legalName?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logoOnDarkPath?: string;
  logoOnLightPath?: string;
}>;

export const DIGITAL_RESPAWN_BUSINESS_PROFILE = Object.freeze({
  businessName: "Digital Respawn",
  logoOnDarkPath: "/brand/digital-respawn-logo-white.png",
  logoOnLightPath: "/brand/digital-respawn-logo-black.png",
}) satisfies BusinessProfile;
