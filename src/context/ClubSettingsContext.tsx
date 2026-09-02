import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { getClubSettings, DEFAULT_CLUB_SETTINGS, type ClubSettings } from "../lib/api/clubSettings";
import { useAuth } from "./AuthContext";

type ClubSettingsState = {
  settings: ClubSettings;
  refresh: () => Promise<void>;
};

const ClubSettingsContext = createContext<ClubSettingsState | undefined>(undefined);

// Koda gömülü olması gereken sayıları (Yardımcı Antrenör limiti, Yoklama
// Al zaman penceresi vb.) uygulama genelinde tek bir yerden sağlar.
// Admin, Profil → Gelişmiş Ayarlar'dan değiştirdiğinde refresh() ile
// tazelenir.
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
      // Ayarlar çekilemezse sessizce varsayılanlarda kal — kritik
      // olmayan bir özellik, uygulamanın geri kalanını bloklamamalı.
    }
  }, [clubId]);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  return (
    <ClubSettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </ClubSettingsContext.Provider>
  );
}

export function useClubSettings() {
  const ctx = useContext(ClubSettingsContext);
  if (!ctx) throw new Error("useClubSettings, ClubSettingsProvider içinde kullanılmalı");
  return ctx;
}
