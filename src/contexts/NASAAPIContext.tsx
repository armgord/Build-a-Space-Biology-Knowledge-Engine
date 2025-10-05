/**
 * NASA Research Dashboard API Context - Simple Version
 * Para prueba MVP
 */

import { createContext, FC, ReactNode, useContext } from "react";
import {
  useSimpleNASAAPI,
  UseSimpleNASAAPIResults,
} from "../hooks/use-simple-nasa-api";

const SimpleNASAAPIContext = createContext<UseSimpleNASAAPIResults | undefined>(
  undefined
);

export type SimpleNASAAPIProviderProps = {
  children: ReactNode;
  apiKey: string;
};

export const SimpleNASAAPIProvider: FC<SimpleNASAAPIProviderProps> = ({
  apiKey,
  children,
}) => {
  const nasaAPI = useSimpleNASAAPI({ apiKey });

  return (
    <SimpleNASAAPIContext.Provider value={nasaAPI}>
      {children}
    </SimpleNASAAPIContext.Provider>
  );
};

export const useSimpleNASAAPIContext = () => {
  const context = useContext(SimpleNASAAPIContext);
  if (!context) {
    throw new Error(
      "useSimpleNASAAPIContext must be used within a SimpleNASAAPIProvider"
    );
  }
  return context;
};
