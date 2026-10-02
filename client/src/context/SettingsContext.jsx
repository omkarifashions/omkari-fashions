import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../api/services.js";

const SettingsContext = createContext({ settings: null });
export const useSettings = () =>
  useContext(SettingsContext).settings || {
    storeName: "Omkari Fashions",
    phone: "9177447021 / 9441090785",
    email: "omkarifashions1@gmail.com",
    supportHours: "Mon to Sat (10:00 AM - 8:00 PM)",
    newsletterText:
      "Be the first to know about new designs, special events and much more!",
    social: {},
    deliveryDays: 5,
    returnWindowDays: 7,
    shippingFee: 99,
    freeShippingAbove: 2000,
    taxPercent: 3,
    codEnabled: true,
  };

export function SettingsProvider({ children }) {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: catalogApi.settings,
    staleTime: 5 * 60_000,
  });
  return (
    <SettingsContext.Provider value={{ settings: data?.settings }}>
      {children}
    </SettingsContext.Provider>
  );
}
