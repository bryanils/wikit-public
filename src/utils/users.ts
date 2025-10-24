export const getProviderName = (providerKey: string): string => {
  if (providerKey === "local") return "local";
  if (providerKey === "ba05352a-c91e-4d41-989e-64a00ffed899") return "google";
  return providerKey;
};
