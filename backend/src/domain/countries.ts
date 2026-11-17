// The countries ACME operates in, and the currency each one pays in.
// This is the single place that links a country to its currency.
export const COUNTRIES = {
  IN: { name: "India", currency: "INR" },
  US: { name: "United States", currency: "USD" },
  GB: { name: "United Kingdom", currency: "GBP" },
  DE: { name: "Germany", currency: "EUR" },
  SG: { name: "Singapore", currency: "SGD" },
  CA: { name: "Canada", currency: "CAD" },
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export const COUNTRY_CODES = Object.keys(COUNTRIES) as [CountryCode, ...CountryCode[]];

export function currencyFor(country: CountryCode): string {
  return COUNTRIES[country].currency;
}
