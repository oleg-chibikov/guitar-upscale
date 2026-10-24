"use client";

import { useGooglePlayAuth } from "@/app/hooks/useGooglePlayAuth";
import { useSessionAuth } from "@/app/hooks/useSessionAuth";

const AuthInitializer: React.FC = () => {
  useSessionAuth();
  useGooglePlayAuth();
  return null;
};

export default AuthInitializer;
