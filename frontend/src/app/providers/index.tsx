import * as React from "react";
import { QueryProvider } from "./QueryProvider";

export interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root composition of all application-level context providers.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}

export default AppProviders;

