import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ClubSettingsProvider } from "./context/ClubSettingsContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./routes/LoginPage";
import CreateClubPage from "./routes/CreateClubPage";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./routes/DashboardPage";
import AdminOverviewPage from "./routes/admin/AdminOverviewPage";
import AdminClubsPage from "./routes/admin/AdminClubsPage";
import AdminSubscriptionsPage from "./routes/admin/AdminSubscriptionsPage";
import AdminAnnouncePage from "./routes/admin/AdminAnnouncePage";
import AdminSettingsPage from "./routes/admin/AdminSettingsPage";
import AdminScreensPage from "./routes/admin/AdminScreensPage";
import AdminRolePreviewPage from "./routes/admin/AdminRolePreviewPage";
import AdminClubDetailPage from "./routes/admin/AdminClubDetailPage";
import AdminFinancialTrendPage from "./routes/admin/AdminFinancialTrendPage";
import AdminContentPromotionPage from "./routes/admin/AdminContentPromotionPage";
import AthletesListPage from "./routes/athletes/AthletesListPage";
import AthleteDetailPage from "./routes/athletes/AthleteDetailPage";
import GroupsListPage from "./routes/groups/GroupsListPage";
import BranchesListPage from "./routes/branches/BranchesListPage";
import VenuesListPage from "./routes/venues/VenuesListPage";
import CalendarPage from "./routes/calendar/CalendarPage";
import FinanceOverviewPage from "./routes/finance/FinanceOverviewPage";
import FinancialDocumentsPage from "./routes/finance/FinancialDocumentsPage";
import CoachPaymentsPage from "./routes/finance/CoachPaymentsPage";
import CoachesListPage from "./routes/coaches/CoachesListPage";
import CoachDetailPage from "./routes/coaches/CoachDetailPage";
import CoachAssignmentsPage from "./routes/coaches/CoachAssignmentsPage";
import AnnouncementsListPage from "./routes/announcements/AnnouncementsListPage";
import ClubSettingsPage from "./routes/settings/ClubSettingsPage";
import AccountPage from "./routes/account/AccountPage";
import UsersListPage from "./routes/users/UsersListPage";
import PerformanceOverviewPage from "./routes/performance/PerformanceOverviewPage";
import PerformanceCategoryPage from "./routes/performance/PerformanceCategoryPage";
import PerformanceTestDetailPage from "./routes/performance/PerformanceTestDetailPage";
import NutritionHomePage from "./routes/nutrition/NutritionHomePage";
import NutritionFoodsPage from "./routes/nutrition/NutritionFoodsPage";
import NutritionRecipesPage from "./routes/nutrition/NutritionRecipesPage";
import NutritionRecipeFormPage from "./routes/nutrition/NutritionRecipeFormPage";
import NutritionArticlesPage from "./routes/nutrition/NutritionArticlesPage";
import NutritionArticleFormPage from "./routes/nutrition/NutritionArticleFormPage";
import ShopProductsListPage from "./routes/shop/ShopProductsListPage";
import ShopOrdersPage from "./routes/shop/ShopOrdersPage";
import ShopStockPage from "./routes/shop/ShopStockPage";
import FitnessHubPage from "./routes/fitness/FitnessHubPage";
import FitnessGroupsPage from "./routes/fitness/FitnessGroupsPage";
import FitnessGroupFormPage from "./routes/fitness/FitnessGroupFormPage";
import FitnessExercisesPage from "./routes/fitness/FitnessExercisesPage";
import FitnessCategoryPage from "./routes/fitness/FitnessCategoryPage";
import FitnessExerciseVisibilityPage from "./routes/fitness/FitnessExerciseVisibilityPage";
import FitnessProgramsPage from "./routes/fitness/FitnessProgramsPage";
import FitnessProgramBuilderPage from "./routes/fitness/FitnessProgramBuilderPage";
import FitnessProgramDetailPage from "./routes/fitness/FitnessProgramDetailPage";
import FitnessWellnessPage from "./routes/fitness/FitnessWellnessPage";

// Süper Admin'in kulübü yok — "/" (kulüp özeti) ona hiç uygun değil,
// kendi platform-geneli Genel Bakış'ına yönlendirilir.
function RoleHome() {
  const { role } = useAuth();
  if (role === "super_admin") return <Navigate to="/admin" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClubSettingsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kulup-olustur" element={<CreateClubPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<RoleHome />} />
              <Route path="/admin" element={<AdminOverviewPage />} />
              <Route path="/admin/clubs" element={<AdminClubsPage />} />
              <Route path="/admin/clubs/:id" element={<AdminClubDetailPage />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="/admin/financial-trend" element={<AdminFinancialTrendPage />} />
              <Route path="/admin/content-promotion" element={<AdminContentPromotionPage />} />
              <Route path="/admin/announce" element={<AdminAnnouncePage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/screens" element={<AdminScreensPage />} />
              <Route path="/admin/screens/:roleKey" element={<AdminRolePreviewPage />} />
              <Route path="/athletes" element={<AthletesListPage />} />
              <Route path="/athletes/:id" element={<AthleteDetailPage />} />
              <Route path="/groups" element={<GroupsListPage />} />
              <Route path="/branches" element={<BranchesListPage />} />
              <Route path="/venues" element={<VenuesListPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/finance" element={<Navigate to="/finance/overview" replace />} />
              <Route path="/finance/overview" element={<FinanceOverviewPage />} />
              <Route path="/finance/documents" element={<FinancialDocumentsPage />} />
              <Route path="/finance/coach-payments" element={<CoachPaymentsPage />} />
              <Route path="/coaches" element={<CoachesListPage />} />
              <Route path="/coaches/assignments" element={<CoachAssignmentsPage />} />
              <Route path="/coaches/:id" element={<CoachDetailPage />} />
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/performance" element={<PerformanceOverviewPage />} />
              <Route path="/performance/:category" element={<PerformanceCategoryPage />} />
              <Route path="/performance/:category/:testKey" element={<PerformanceTestDetailPage />} />
              <Route path="/nutrition" element={<NutritionHomePage />} />
              <Route path="/nutrition/foods" element={<NutritionFoodsPage />} />
              <Route path="/nutrition/recipes" element={<NutritionRecipesPage />} />
              <Route path="/nutrition/recipes/new" element={<NutritionRecipeFormPage />} />
              <Route path="/nutrition/recipes/:id" element={<NutritionRecipeFormPage />} />
              <Route path="/nutrition/articles" element={<NutritionArticlesPage />} />
              <Route path="/nutrition/articles/new" element={<NutritionArticleFormPage />} />
              <Route path="/nutrition/articles/:id" element={<NutritionArticleFormPage />} />
              <Route path="/shop/products" element={<ShopProductsListPage />} />
              <Route path="/shop/orders" element={<ShopOrdersPage />} />
              <Route path="/shop/stock" element={<ShopStockPage />} />
              <Route path="/fitness" element={<FitnessHubPage />} />
              <Route path="/fitness/groups" element={<FitnessGroupsPage />} />
              <Route path="/fitness/groups/new" element={<FitnessGroupFormPage />} />
              <Route path="/fitness/groups/:id" element={<FitnessGroupFormPage />} />
              <Route path="/fitness/exercises" element={<FitnessExercisesPage />} />
              <Route path="/fitness/exercises/:category" element={<FitnessCategoryPage />} />
              <Route path="/fitness/exercises/:category/visibility" element={<FitnessExerciseVisibilityPage />} />
              <Route path="/fitness/programs" element={<FitnessProgramsPage />} />
              <Route path="/fitness/programs/new" element={<FitnessProgramBuilderPage />} />
              <Route path="/fitness/programs/:id" element={<FitnessProgramDetailPage />} />
              <Route path="/fitness/wellness" element={<FitnessWellnessPage />} />
              <Route path="/announcements" element={<AnnouncementsListPage />} />
              <Route path="/settings" element={<ClubSettingsPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ClubSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
