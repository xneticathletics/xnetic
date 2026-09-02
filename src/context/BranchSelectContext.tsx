import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getCurrentAppUserId } from "../lib/api/currentUser";
import { getMyCoordinatorBranch } from "../lib/api/branches";

type BranchSelectState = {
  selectedBranch: string | null;
  setSelectedBranch: (branch: string | null) => void;
  // Branş Koordinatörü antrenörler için true — kendi branşları otomatik
  // açılır ve değiştirilemez (ekranlar bu bayrağa göre değiştirme
  // arayüzünü gizler).
  isLocked: boolean;
};

const BranchSelectContext = createContext<BranchSelectState | undefined>(undefined);

// Kulübün 2+ branşı varsa, Admin'in "hangi branşla çalışıyorum" seçimini
// uygulama genelinde tutar — Sporcu Yönetimi, Antrenman Programı, Aidat
// Takibi ekranları bu seçime göre filtrelenir. Tek branşlı kulüplerde bu
// hiç kullanılmaz (selectedBranch her zaman null kalır, filtre uygulanmaz).
//
// Antrenör bir branşın Koordinatörü olarak atanmışsa, bu context giriş
// yapar yapmaz kendi branşını otomatik seçer ve kilitler (isLocked).
export function BranchSelectProvider({ children }: { children: React.ReactNode }) {
  const { session, role } = useAuth();
  const [selectedBranch, setSelectedBranchState] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!session || role !== "coach") {
      setIsLocked(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const userId = await getCurrentAppUserId();
        if (!userId) return;
        const branch = await getMyCoordinatorBranch(userId);
        if (cancelled) return;
        if (branch) {
          setSelectedBranchState(branch);
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } catch {
        // sessizce yut — kritik olmayan bir özellik
      }
    })();
    return () => { cancelled = true; };
  }, [session, role]);

  const setSelectedBranch = (branch: string | null) => {
    if (isLocked) return; // Koordinatör kendi branşını değiştiremez
    setSelectedBranchState(branch);
  };

  return (
    <BranchSelectContext.Provider value={{ selectedBranch, setSelectedBranch, isLocked }}>
      {children}
    </BranchSelectContext.Provider>
  );
}

export function useBranchSelect() {
  const ctx = useContext(BranchSelectContext);
  if (!ctx) throw new Error("useBranchSelect, BranchSelectProvider içinde kullanılmalı");
  return ctx;
}
