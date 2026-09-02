import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { getClubSettings, DEFAULT_CLUB_SETTINGS, type ClubSettings } from "../lib/api/clubSettings";
import { useAuth } from "./AuthContext";

type ClubSettingsState = {
  settings: ClubSettings;
  refresh: () => Promise<void>;
};

const ClubSettingsContext = createContext<ClubSettingsState | undefined>(undefined);

// Sidebar'ın disabled_home_tiles'a göre menü öğelerini gizleyebilmesi için
// tek bir yerden sağlar — Kulüp Ayarları → Ana Sayfa Özellikleri'nden
// değiştirildiğinde refresh() ile tazelenir. Mobildeki
// context/ClubSettingsContext.tsx ile birebir aynı.
export function ClubSettingsProvider({ children }: { children: React.ReactNode }) {
  const { session, clubId } = useAuth();
  const [settings, setSettings] = useState<ClubSettings>(DEFAULT_CLUB_SETTINGS);

  const refresh = useCallback(async () => {
    // Süper Admin'in kendi kulübü yok — varsayılanlarda kalır.
    if (!clubId) {
      setSettings(DEFAULT_CLUB_SETTINGS);
      return;
    }
    try {
      setSettings(await getClubSettings(clubId));
    } catch {
      // Ayarlar çekilemezse sessizce varsayılanlarda kal — kritik olmayan
      // bir özellik, uygulamanın geri kalanını bloklamamalı.
    }
  }, [clubId]);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  return <ClubSettingsContext.Provider value={{ settings, refresh }}>{children}</ClubSettingsContext.Provider>;
}

export function useClubSettings() {
  const ctx = useContext(ClubSettingsContext);
  if (!ctx) throw new Error("useClubSettings, ClubSettingsProvider içinde kullanılmalı");
  return ctx;
}
