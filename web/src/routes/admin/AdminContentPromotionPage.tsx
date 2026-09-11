import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "../../components/DataTable";
import {
  listClubSpecificContent,
  promoteToGlobal,
  PROMOTABLE_TABLES,
  type ClubContentItem,
  type PromotableTable,
} from "../../lib/api/superAdmin";
import { listGlobalExercises, deleteCustomExercise, type CustomFitnessExercise } from "../../lib/api/fitnessExercises";
import { listGlobalFoods, deleteNutritionFood, type NutritionFood } from "../../lib/api/nutritionFoods";
import { listGlobalRecipes, deleteNutritionRecipe, type NutritionRecipe } from "../../lib/api/nutritionRecipes";
import { listGlobalTests, deleteCustomTest, type CustomPerformanceTest } from "../../lib/api/customPerformanceTests";
import { FITNESS_CATEGORIES } from "../../lib/fitnessExercises";
import { FOOD_CATEGORIES } from "../../lib/nutritionCategories";
import { PERFORMANCE_CATEGORIES } from "../../lib/performanceTests";
import AdminGlobalContentModal from "./AdminGlobalContentModal";

type GlobalItem = CustomFitnessExercise | NutritionFood | NutritionRecipe | CustomPerformanceTest;

function getItemName(table: PromotableTable, item: GlobalItem): string {
  return table === "nutrition_recipes" ? (item as NutritionRecipe).title : (item as { name: string }).name;
}

function getCategoryLabel(table: PromotableTable, category: string): string {
  const list =
    table === "fitness_exercises" ? FITNESS_CATEGORIES :
    table === "performance_test_catalog" ? PERFORMANCE_CATEGORIES :
    FOOD_CATEGORIES;
  const found = list.find((c) => c.key === category);
  return found ? `${found.icon} ${found.label}` : category;
}

async function loadGlobalContent(table: PromotableTable): Promise<GlobalItem[]> {
  if (table === "fitness_exercises") return listGlobalExercises();
  if (table === "nutrition_foods") return listGlobalFoods();
  if (table === "nutrition_recipes") return listGlobalRecipes();
  return listGlobalTests();
}

async function deleteGlobalContent(table: PromotableTable, id: string): Promise<void> {
  if (table === "fitness_exercises") return deleteCustomExercise(id);
  if (table === "nutrition_foods") return deleteNutritionFood(id);
  if (table === "nutrition_recipes") return deleteNutritionRecipe(id);
  return deleteCustomTest(id);
}

type Tab = "existing" | "promote";

export default function AdminContentPromotionPage() {
  const [table, setTable] = useState<PromotableTable>(PROMOTABLE_TABLES[0].table);
  const [tab, setTab] = useState<Tab>("existing");

  const [existingItems, setExistingItems] = useState<GlobalItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [existingError, setExistingError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"new" | GlobalItem | null>(null);

  const [promotableItems, setPromotableItems] = useState<ClubContentItem[]>([]);
  const [loadingPromotable, setLoadingPromotable] = useState(true);
  const [promotableError, setPromotableError] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const loadExisting = () => {
    setLoadingExisting(true);
    setExistingError(null);
    loadGlobalContent(table)
      .then(setExistingItems)
      .catch((e) => setExistingError(e.message))
      .finally(() => setLoadingExisting(false));
  };

  const loadPromotable = () => {
    setLoadingPromotable(true);
    setPromotableError(null);
    listClubSpecificContent(table)
      .then(setPromotableItems)
      .catch((e) => setPromotableError(e.message))
      .finally(() => setLoadingPromotable(false));
  };

  useEffect(loadExisting, [table]);
  useEffect(loadPromotable, [table]);

  const tableLabel = useMemo(() => PROMOTABLE_TABLES.find((t) => t.table === table)?.label ?? table, [table]);

  const handleDeleteExisting = async (item: GlobalItem) => {
    const name = getItemName(table, item);
    if (!confirm(`"${name}" kalıcı olarak silinecek — TÜM kulüpler bunu artık görmeyecek. Emin misin?`)) return;
    try {
      await deleteGlobalContent(table, item.id);
      setExistingItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e: any) {
      alert(e.message ?? "Silinemedi");
    }
  };

  const handlePromote = async (item: ClubContentItem) => {
    if (
      !confirm(
        `"${item.name}" artık SADECE "${item.club_name}" kulübüne değil, TÜM kulüplere görünecek. Bu işlem geri alınamaz. Devam edilsin mi?`
      )
    )
      return;
    setPromotingId(item.id);
    try {
      await promoteToGlobal(table, item.id);
      setPromotableItems((prev) => prev.filter((i) => i.id !== item.id));
      loadExisting();
    } catch (e: any) {
      alert(e.message ?? "Yükseltilemedi");
    } finally {
      setPromotingId(null);
    }
  };

  const existingColumns: Column<GlobalItem>[] = [
    { key: "name", label: "İçerik", render: (i) => <span className="font-semibold text-ink">{getItemName(table, i)}</span> },
    { key: "category", label: "Kategori", render: (i) => getCategoryLabel(table, i.category) },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (i) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => setModalState(i)} className="text-xs font-bold text-teal hover:underline">
            Düzenle
          </button>
          <button onClick={() => handleDeleteExisting(i)} className="text-xs font-bold text-coral hover:underline">
            Sil
          </button>
        </div>
      ),
    },
  ];

  const promoteColumns: Column<ClubContentItem>[] = [
    { key: "name", label: "İçerik", render: (i) => <span className="font-semibold text-ink">{i.name}</span> },
    { key: "club", label: "Sahibi Kulüp", render: (i) => i.club_name },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (i) => (
        <button
          onClick={() => handlePromote(i)}
          disabled={promotingId === i.id}
          className="rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-bg disabled:opacity-60"
        >
          {promotingId === i.id ? "Yükseltiliyor…" : "🌐 Globale Yükselt"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">İçerik Kütüphanesi</h1>
      <p className="mb-6 text-sm text-muted">
        Platform genelinde TÜM kulüplerin gördüğü fitness hareketi/besin/tarif/performans testi kataloğunu buradan
        yönet — mevcut kayıtları düzenle/sil, ya da bir kulübün eklediği özel bir kaydı globale yükselt.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {PROMOTABLE_TABLES.map((t) => (
          <button
            key={t.table}
            onClick={() => setTable(t.table)}
            aria-pressed={table === t.table}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              table === t.table ? "bg-yellow text-bg" : "border border-line text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2 border-b border-line">
        <button
          onClick={() => setTab("existing")}
          aria-pressed={tab === "existing"}
          className={`px-4 py-2 text-sm font-bold ${tab === "existing" ? "border-b-2 border-yellow text-ink" : "text-muted hover:text-ink"}`}
        >
          Mevcut İçerik
        </button>
        <button
          onClick={() => setTab("promote")}
          aria-pressed={tab === "promote"}
          className={`px-4 py-2 text-sm font-bold ${tab === "promote" ? "border-b-2 border-yellow text-ink" : "text-muted hover:text-ink"}`}
        >
          Globale Yükselt{promotableItems.length > 0 ? ` (${promotableItems.length})` : ""}
        </button>
      </div>

      {tab === "existing" ? (
        <>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setModalState("new")} className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg">
              + {tableLabel.replace(/lar$|ler$/, "")} Ekle
            </button>
          </div>
          {existingError && <p className="mb-4 text-sm font-semibold text-coral">{existingError}</p>}
          <DataTable
            columns={existingColumns}
            rows={existingItems}
            rowKey={(i) => i.id}
            loading={loadingExisting}
            emptyText={`Henüz global bir "${tableLabel}" kaydı yok.`}
          />
        </>
      ) : (
        <>
          {promotableError && <p className="mb-4 text-sm font-semibold text-coral">{promotableError}</p>}
          <DataTable
            columns={promoteColumns}
            rows={promotableItems}
            rowKey={(i) => i.id}
            loading={loadingPromotable}
            emptyText={`Şu anda kulübe özel bir "${tableLabel}" kaydı yok.`}
          />
        </>
      )}

      {modalState && (
        <AdminGlobalContentModal
          table={table}
          item={modalState === "new" ? null : modalState}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null);
            loadExisting();
          }}
        />
      )}
    </div>
  );
}
