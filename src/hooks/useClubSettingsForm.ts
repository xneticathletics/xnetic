import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { getClubSettings, updateClubSettings, type ClubSettings } from "../lib/api/clubSettings";
import { useClubSettings } from "../context/ClubSettingsContext";
import { useAuth } from "../context/AuthContext";

// Gelişmiş Ayarlar, konu başlıklarına göre ayrı ekranlara bölündü ama
// hepsi TEK bir club_settings satırını paylaşıyor — bu hook, tam ayar
// nesnesini yükleyip kaydetme mantığını tüm alt ekranlar için ortaklıyor.
export function useClubSettingsForm() {
  const { clubId } = useAuth();
  const { refresh } = useClubSettings();
  const [form, setForm] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    getClubSettings(clubId)
      .then(setForm)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [clubId]);

  const setField = (key: keyof ClubSettings, value: string) => {
    if (!form) return;
    const num = value === "" ? 0 : Number(value);
    setForm({ ...form, [key]: Number.isFinite(num) ? num : 0 });
  };

  // Aç/kapa ayarları için — setField sayıya çevirdiği için boolean alanlarda
  // kullanılamıyor.
  const setBool = (key: keyof ClubSettings, value: boolean) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const handleSave = async () => {
    if (!form || !clubId) return;
    setSaving(true);
    setError(null);
    try {
      await updateClubSettings(clubId, form);
      await refresh();
      Alert.alert("Kaydedildi", "Ayarlar güncellendi — tüm uygulama artık bu değerleri kullanıyor.", [{ text: "Tamam" }]);
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return { form, setField, setBool, handleSave, loading, saving, error };
}
