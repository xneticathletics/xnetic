import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import HomeScreen from "../screens/HomeScreen";
import ClubStructureScreen from "../screens/ClubStructureScreen";
import GroupsListScreen from "../screens/GroupsListScreen";
import GroupFormScreen from "../screens/GroupFormScreen";
import BranchesListScreen from "../screens/BranchesListScreen";
import VenuesListScreen from "../screens/VenuesListScreen";
import VenueFormScreen from "../screens/VenueFormScreen";
import AthleteGroupsScreen from "../screens/AthleteGroupsScreen";
import AthletesListScreen from "../screens/AthletesListScreen";
import AthleteFormScreen from "../screens/AthleteFormScreen";
import AthleteDetailScreen from "../screens/AthleteDetailScreen";
import AllAthletesScreen from "../screens/AllAthletesScreen";
import AthleteInjuriesScreen from "../screens/AthleteInjuriesScreen";
import InjuryFormScreen from "../screens/InjuryFormScreen";
import AthleteNotesScreen from "../screens/AthleteNotesScreen";
import TrainingSessionsScreen from "../screens/TrainingSessionsScreen";
import DayScheduleDetailScreen from "../screens/DayScheduleDetailScreen";
import WeeklyScheduleScreen from "../screens/WeeklyScheduleScreen";
import TodayAttendanceScreen from "../screens/TodayAttendanceScreen";
import TrainingSessionFormScreen from "../screens/TrainingSessionFormScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import SocialFeedScreen from "../screens/SocialFeedScreen";
import SocialPostFormScreen from "../screens/SocialPostFormScreen";
import SessionRosterScreen from "../screens/SessionRosterScreen";
import InviteUserScreen from "../screens/InviteUserScreen";
import CoachesListScreen from "../screens/CoachesListScreen";
import CoachesOverviewScreen from "../screens/CoachesOverviewScreen";
import CoachDetailScreen from "../screens/CoachDetailScreen";
import CoachFormScreen from "../screens/CoachFormScreen";
import MatchFormScreen from "../screens/MatchFormScreen";
import MatchResultScreen from "../screens/MatchResultScreen";
import MatchResultsScreen from "../screens/MatchResultsScreen";
import CoachGroupsScreen from "../screens/CoachGroupsScreen";
import CoachLeaveScreen from "../screens/CoachLeaveScreen";
import CoachBranchScreen from "../screens/CoachBranchScreen";
import BranchSelectScreen from "../screens/BranchSelectScreen";
import MyScheduleScreen from "../screens/MyScheduleScreen";
import MySessionDetailScreen from "../screens/MySessionDetailScreen";
import MyDayScheduleDetailScreen from "../screens/MyDayScheduleDetailScreen";
import MyAttendanceScreen from "../screens/MyAttendanceScreen";
import MyPaymentsScreen from "../screens/MyPaymentsScreen";
import PaymentsListScreen from "../screens/PaymentsListScreen";
import PaymentFormScreen from "../screens/PaymentFormScreen";
import StandardFeeScreen from "../screens/StandardFeeScreen";
import PaymentGroupsScreen from "../screens/PaymentGroupsScreen";
import PaymentAthletesScreen from "../screens/PaymentAthletesScreen";
import AthletePaymentsScreen from "../screens/AthletePaymentsScreen";
import PaymentReceiptScreen from "../screens/PaymentReceiptScreen";
import ExpenseFormScreen from "../screens/ExpenseFormScreen";
import IncomeFormScreen from "../screens/IncomeFormScreen";
import FinancialDocumentsScreen from "../screens/FinancialDocumentsScreen";
import CoachPaymentsScreen from "../screens/CoachPaymentsScreen";
import CoachPaymentFormScreen from "../screens/CoachPaymentFormScreen";
import CoachAdvanceFormScreen from "../screens/CoachAdvanceFormScreen";
import AthleticPerformanceScreen from "../screens/AthleticPerformanceScreen";
import PerformanceCategoryScreen from "../screens/PerformanceCategoryScreen";
import PerformanceTestDetailScreen from "../screens/PerformanceTestDetailScreen";
import PerformanceTestFormScreen from "../screens/PerformanceTestFormScreen";
import WellnessCheckinScreen from "../screens/WellnessCheckinScreen";
import MembershipFreezeScreen from "../screens/MembershipFreezeScreen";
import CoachWellnessScreen from "../screens/CoachWellnessScreen";
import FitnessScreen from "../screens/FitnessScreen";
import FitnessTrainingScreen from "../screens/FitnessTrainingScreen";
import FitnessProgramScreen from "../screens/FitnessProgramScreen";
import FitnessProgramBuilderScreen from "../screens/FitnessProgramBuilderScreen";
import FitnessGroupsScreen from "../screens/FitnessGroupsScreen";
import FitnessGroupFormScreen from "../screens/FitnessGroupFormScreen";
import FitnessProgramDetailScreen from "../screens/FitnessProgramDetailScreen";
import FitnessCategoryScreen from "../screens/FitnessCategoryScreen";
import FitnessExerciseDetailScreen from "../screens/FitnessExerciseDetailScreen";
import FitnessExerciseFormScreen from "../screens/FitnessExerciseFormScreen";
import FitnessExerciseVisibilityScreen from "../screens/FitnessExerciseVisibilityScreen";
import IndividualFitnessProgramListScreen from "../screens/IndividualFitnessProgramListScreen";
import IndividualFitnessProgramsHubScreen from "../screens/IndividualFitnessProgramsHubScreen";
import IndividualFitnessProgramBuilderScreen from "../screens/IndividualFitnessProgramBuilderScreen";
import IndividualFitnessProgramDetailScreen from "../screens/IndividualFitnessProgramDetailScreen";
import AthleteWellnessDetailScreen from "../screens/AthleteWellnessDetailScreen";
import NutritionScreen from "../screens/NutritionScreen";
import NutritionFoodsScreen from "../screens/NutritionFoodsScreen";
import NutritionFoodCategoryScreen from "../screens/NutritionFoodCategoryScreen";
import NutritionFoodDetailScreen from "../screens/NutritionFoodDetailScreen";
import NutritionFoodFormScreen from "../screens/NutritionFoodFormScreen";
import NutritionRecipesScreen from "../screens/NutritionRecipesScreen";
import NutritionRecipeCategoryScreen from "../screens/NutritionRecipeCategoryScreen";
import NutritionRecipeDetailScreen from "../screens/NutritionRecipeDetailScreen";
import NutritionRecipeFormScreen from "../screens/NutritionRecipeFormScreen";
import NutritionArticlesScreen from "../screens/NutritionArticlesScreen";
import NutritionArticleCategoryScreen from "../screens/NutritionArticleCategoryScreen";
import NutritionArticleDetailScreen from "../screens/NutritionArticleDetailScreen";
import NutritionArticleFormScreen from "../screens/NutritionArticleFormScreen";
import SuperAdminClubsScreen from "../screens/SuperAdminClubsScreen";
import SuperAdminSubscriptionsScreen from "../screens/SuperAdminSubscriptionsScreen";
import SuperAdminReportScreen from "../screens/SuperAdminReportScreen";
import SuperAdminScreensScreen from "../screens/SuperAdminScreensScreen";
import SuperAdminRolePreviewScreen from "../screens/SuperAdminRolePreviewScreen";
import SuperAdminAnnounceScreen from "../screens/SuperAdminAnnounceScreen";
import SuperAdminFinanceScreen from "../screens/SuperAdminFinanceScreen";
import MyAthleteListScreen from "../screens/MyAthleteListScreen";
import AthleteTrackingHubScreen from "../screens/AthleteTrackingHubScreen";
import AthletePerformanceViewScreen from "../screens/AthletePerformanceViewScreen";
import AthleteFitnessViewScreen from "../screens/AthleteFitnessViewScreen";
import AthleteFitnessProgramScreen from "../screens/AthleteFitnessProgramScreen";
import MakePaymentScreen from "../screens/MakePaymentScreen";
import AthleteBulkImportScreen from "../screens/AthleteBulkImportScreen";
import ComingSoonScreen from "../screens/ComingSoonScreen";
import ShopScreen from "../screens/ShopScreen";
import ShopProductDetailScreen from "../screens/ShopProductDetailScreen";
import ShopPurchaseScreen from "../screens/ShopPurchaseScreen";
import MyShopOrdersScreen from "../screens/MyShopOrdersScreen";
import ShopManageScreen from "../screens/ShopManageScreen";
import ShopProductFormScreen from "../screens/ShopProductFormScreen";
import ShopOrdersScreen from "../screens/ShopOrdersScreen";
import ShopStockScreen from "../screens/ShopStockScreen";
import EventsListScreen from "../screens/EventsListScreen";
import EventDetailScreen from "../screens/EventDetailScreen";
import EventFormScreen from "../screens/EventFormScreen";
import EventsManageScreen from "../screens/EventsManageScreen";
import EventRegisterScreen from "../screens/EventRegisterScreen";
import EventRegistrationsScreen from "../screens/EventRegistrationsScreen";
import MyEventRegistrationsScreen from "../screens/MyEventRegistrationsScreen";
import type { FoodCategoryKey, ArticleCategoryKey } from "../lib/nutritionCategories";

export type HomeStackParamList = {
  Home: undefined;
  ClubStructure: undefined;
  GroupsList: undefined;
  GroupForm: { groupId: string | undefined };
  BranchesList: undefined;
  VenuesList: undefined;
  VenueForm: { venueId: string | undefined };
  AthleteGroups: undefined;
  AthletesList: { groupId: string; groupName: string };
  AthleteForm: { athleteId: string | undefined; groupId?: string; groupName?: string };
  AthleteDetail: { athleteId: string };
  AllAthletes: undefined;
  AthleteInjuries: { athleteId: string; athleteName: string };
  InjuryForm: { athleteId: string; athleteName: string };
  AthleteNotes: { athleteId: string; athleteName: string };
  TrainingSessions: undefined;
  WeeklySchedule: undefined;
  DayScheduleDetail: {
    date: string;
    sessions: import("../lib/api/trainingSessions").TrainingSession[];
    matches: import("../lib/api/matches").MatchRow[];
    staffing: Record<string, import("../lib/api/coaches").GroupStaffing>;
    isAdminOrCoordinator: boolean;
    authorizedVenueIds: string[];
    individualBranchNames: string[];
    branchByGroupId: Record<string, string>;
    attendanceWindowBeforeMinutes: number;
    attendanceWindowAfterMinutes: number;
    completionWindowBeforeMinutes: number;
  };
  TodayAttendance: undefined;
  TrainingSessionForm: { sessionId: string | undefined };
  Attendance: { sessionId: string; groupId: string; groupName: string };
  SessionRoster: { sessionId: string; groupId: string; groupName: string };
  SocialFeed: { initialTab?: "feed" | "pending" } | undefined;
  SocialPostForm: undefined;
  InviteUser: { presetRole?: "parent" | "athlete" | "coach" } | undefined;
  CoachesList: undefined;
  CoachesOverview: undefined;
  CoachDetail: { coachId: string };
  CoachForm: { coachId: string };
  MatchForm: { matchId: string | undefined };
  MatchResult: { matchId: string };
  MatchResults: undefined;
  CoachGroups: { coachId: string; coachName: string };
  CoachLeave: { coachId: string; coachName: string };
  CoachBranch: { coachId: string; coachName: string };
  BranchSelect: undefined;
  MySchedule: undefined;
  MyDayScheduleDetail: {
    date: string;
    sessions: import("../lib/api/trainingSessions").TrainingSession[];
    attendanceMap: Record<string, import("../lib/api/attendance").AttendanceStatus>;
    athleteId: string;
    athleteName: string;
  };
  MySessionDetail: { sessionId: string; athleteId: string; athleteName: string };
  MyAttendance: undefined;
  MyPayments: undefined;
  PaymentsList: { filter: "paid" | "pending" | "overdue" };
  PaymentForm: { athleteId?: string; athleteName?: string } | undefined;
  StandardFee: undefined;
  PaymentGroups: undefined;
  PaymentAthletes: { groupId: string; groupName: string };
  AthletePayments: { athleteId: string; athleteName: string };
  PaymentReceipt: {
    paymentId: string;
    amount: number;
    period: "weekly" | "monthly" | "yearly";
    dueDate: string;
    paidAt: string | null;
    athleteName: string;
    parentName?: string | null;
    method?: "bank_transfer" | "cash" | "credit_card" | "qr" | null;
  };
  ExpenseForm: undefined;
  IncomeForm: undefined;
  FinancialDocuments: undefined;
  CoachPayments: undefined;
  CoachPaymentForm: undefined;
  CoachAdvanceForm: undefined;
  AthleticPerformance: undefined;
  PerformanceCategory: { category: string };
  PerformanceTestDetail: { testKey: string; athleteId?: string; athleteName?: string; readOnly?: boolean };
  PerformanceTestForm: { testId?: string } | undefined;
  WellnessCheckin: undefined;
  MembershipFreeze: { athleteId?: string; athleteName?: string } | undefined;
  CoachWellness: undefined;
  AthleteWellnessDetail: { athleteId: string; athleteName: string };
  Fitness: undefined;
  FitnessTraining: undefined;
  FitnessProgram: undefined;
  FitnessProgramBuilder: undefined;
  FitnessProgramDetail: { programId: string; athleteId?: string; athleteName?: string };
  FitnessCategory: { category: string };
  FitnessGroups: undefined;
  FitnessGroupForm: { fitnessGroupId?: string } | undefined;
  FitnessExerciseDetail: { exerciseKey: string };
  FitnessExerciseForm: { exerciseId?: string } | undefined;
  FitnessExerciseVisibility: { category: string };
  IndividualFitnessProgramsHub: undefined;
  IndividualFitnessProgramList: { athleteId: string; athleteName: string };
  IndividualFitnessProgramBuilder: { athleteId: string };
  IndividualFitnessProgramDetail: { programId: string; athleteId: string; athleteName: string };
  Nutrition: undefined;
  NutritionFoods: undefined;
  NutritionFoodCategory: { category: FoodCategoryKey };
  NutritionFoodDetail: { foodId: string };
  NutritionFoodForm: { foodId: string | undefined; category: FoodCategoryKey };
  NutritionRecipes: undefined;
  NutritionRecipeCategory: { category: FoodCategoryKey };
  NutritionRecipeDetail: { recipeId: string };
  NutritionRecipeForm: { recipeId: string | undefined; category: FoodCategoryKey };
  NutritionArticles: undefined;
  NutritionArticleCategory: { category: ArticleCategoryKey };
  NutritionArticleDetail: { articleId: string };
  NutritionArticleForm: { articleId: string | undefined; category: ArticleCategoryKey };
  SuperAdminClubs: undefined;
  SuperAdminSubscriptions: undefined;
  SuperAdminReport: undefined;
  SuperAdminScreens: undefined;
  SuperAdminRolePreview: { role: UserRole; label: string; coordinator: boolean };
  SuperAdminAnnounce: undefined;
  SuperAdminFinance: undefined;
  MyAthleteList: undefined;
  AthleteTrackingHub: { athleteId: string; athleteName: string };
  AthletePerformanceView: { athleteId: string; athleteName: string };
  AthleteFitnessView: { athleteId: string; athleteName: string };
  AthleteFitnessProgram: { athleteId: string; athleteName: string };
  MakePayment: { paymentId: string; amount: number; dueDate: string; athleteName: string };
  AthleteBulkImport: undefined;
  ComingSoon: { title: string; description: string };
  Shop: undefined;
  ShopProductDetail: { productId: string };
  ShopPurchase: { productId: string; title: string; price: number };
  MyShopOrders: undefined;
  ShopManage: undefined;
  ShopProductForm: { productId: string | undefined };
  ShopOrders: undefined;
  ShopStock: undefined;
  EventsList: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId: string | undefined };
  EventsManage: undefined;
  EventRegister: { eventId: string };
  EventRegistrations: { eventId: string };
  MyEventRegistrations: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack({ role }: { role: UserRole }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Home" options={{ headerShown: false, title: "Ana Sayfa" }}>
        {({ navigation }) => <HomeScreen role={role} navigation={navigation} />}
      </Stack.Screen>
      <Stack.Screen name="ClubStructure" component={ClubStructureScreen} options={{ title: "Kulüp Yapısı" }} />
      <Stack.Screen name="GroupsList" component={GroupsListScreen} options={{ title: "Gruplar" }} />
      <Stack.Screen name="GroupForm" component={GroupFormScreen} />
      <Stack.Screen name="BranchesList" component={BranchesListScreen} options={{ title: "Branşlar" }} />
      <Stack.Screen name="VenuesList" component={VenuesListScreen} options={{ title: "Salonlar" }} />
      <Stack.Screen name="VenueForm" component={VenueFormScreen} />
      <Stack.Screen name="AthleteGroups" component={AthleteGroupsScreen} options={{ title: "Sporcu Yönetimi" }} />
      <Stack.Screen name="AthletesList" component={AthletesListScreen} />
      <Stack.Screen name="AthleteForm" component={AthleteFormScreen} />
      <Stack.Screen name="AthleteDetail" component={AthleteDetailScreen} options={{ title: "Sporcu Detayı" }} />
      <Stack.Screen name="AllAthletes" component={AllAthletesScreen} options={{ title: "Tüm Sporcular" }} />
      <Stack.Screen name="AthleteInjuries" component={AthleteInjuriesScreen} options={{ title: "Sakatlık Geçmişi" }} />
      <Stack.Screen name="InjuryForm" component={InjuryFormScreen} options={{ title: "Sakatlık Bildir" }} />
      <Stack.Screen name="AthleteNotes" component={AthleteNotesScreen} options={{ title: "Koç Notları" }} />
      <Stack.Screen name="TrainingSessions" component={TrainingSessionsScreen} options={{ title: "Antrenman ve Müsabaka Takvimi" }} />
      <Stack.Screen name="DayScheduleDetail" component={DayScheduleDetailScreen} options={{ title: "Gün Detayı" }} />
      <Stack.Screen name="WeeklySchedule" component={WeeklyScheduleScreen} options={{ title: "Haftalık Program" }} />
      <Stack.Screen name="TodayAttendance" component={TodayAttendanceScreen} options={{ title: "Yoklama Al" }} />
      <Stack.Screen name="TrainingSessionForm" component={TrainingSessionFormScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: "Yoklama Al" }} />
      <Stack.Screen name="SocialFeed" component={SocialFeedScreen} options={{ title: "Sosyal Alan" }} />
      <Stack.Screen name="SocialPostForm" component={SocialPostFormScreen} options={{ title: "Yeni Paylaşım" }} />
      <Stack.Screen name="SessionRoster" component={SessionRosterScreen} options={{ title: "Sporcular" }} />
      <Stack.Screen name="InviteUser" component={InviteUserScreen} options={{ title: "Antrenör Ekle" }} />
      <Stack.Screen name="CoachesList" component={CoachesListScreen} options={{ title: "Antrenörler" }} />
      <Stack.Screen name="CoachesOverview" component={CoachesOverviewScreen} options={{ title: "Antrenör Atamaları" }} />
      <Stack.Screen name="CoachDetail" component={CoachDetailScreen} options={{ title: "Antrenör Detayı" }} />
      <Stack.Screen name="CoachForm" component={CoachFormScreen} options={{ title: "Antrenörü Düzenle" }} />
      <Stack.Screen name="MatchForm" component={MatchFormScreen} />
      <Stack.Screen name="MatchResult" component={MatchResultScreen} options={{ title: "Sonuç Gir" }} />
      <Stack.Screen name="MatchResults" component={MatchResultsScreen} options={{ title: "Müsabaka Sonuçları" }} />
      <Stack.Screen name="CoachGroups" component={CoachGroupsScreen} options={{ title: "Grup Atamaları" }} />
      <Stack.Screen name="CoachLeave" component={CoachLeaveScreen} options={{ title: "İzin İşlemleri" }} />
      <Stack.Screen name="CoachBranch" component={CoachBranchScreen} options={{ title: "Branş ve Belge İşlemleri" }} />
      <Stack.Screen name="BranchSelect" component={BranchSelectScreen} options={{ title: "Branş Seç" }} />
      <Stack.Screen name="MySchedule" component={MyScheduleScreen} options={{ title: "Takvim" }} />
      <Stack.Screen name="MySessionDetail" component={MySessionDetailScreen} options={{ title: "Antrenman Detayı" }} />
      <Stack.Screen name="MyDayScheduleDetail" component={MyDayScheduleDetailScreen} options={{ title: "Gün Detayı" }} />
      <Stack.Screen name="MyAttendance" component={MyAttendanceScreen} options={{ title: "Antrenman Katılım Durumu" }} />
      <Stack.Screen name="MyPayments" component={MyPaymentsScreen} options={{ title: "Aidat" }} />
      <Stack.Screen name="PaymentsList" component={PaymentsListScreen} />
      <Stack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: "Yeni Aidat Planı" }} />
      <Stack.Screen name="StandardFee" component={StandardFeeScreen} options={{ title: "Sabit Aidat Ücreti" }} />
      <Stack.Screen name="PaymentGroups" component={PaymentGroupsScreen} options={{ title: "Finans" }} />
      <Stack.Screen name="PaymentAthletes" component={PaymentAthletesScreen} options={{ title: "Sporcular" }} />
      <Stack.Screen name="AthletePayments" component={AthletePaymentsScreen} options={{ title: "Aidat Geçmişi" }} />
      <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} options={{ title: "Makbuz" }} />
      <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ title: "Yeni Gider" }} />
      <Stack.Screen name="IncomeForm" component={IncomeFormScreen} options={{ title: "Yeni Gelir" }} />
      <Stack.Screen name="FinancialDocuments" component={FinancialDocumentsScreen} options={{ title: "Finansal Dökümanlarım" }} />
      <Stack.Screen name="CoachPayments" component={CoachPaymentsScreen} options={{ title: "Antrenör Ödemeleri" }} />
      <Stack.Screen name="CoachPaymentForm" component={CoachPaymentFormScreen} options={{ title: "Yeni Ödeme Planı" }} />
      <Stack.Screen name="CoachAdvanceForm" component={CoachAdvanceFormScreen} options={{ title: "Avans Ver" }} />
      <Stack.Screen name="AthleticPerformance" component={AthleticPerformanceScreen} options={{ title: "Performans Ölçümleri" }} />
      <Stack.Screen name="PerformanceCategory" component={PerformanceCategoryScreen} />
      <Stack.Screen name="PerformanceTestDetail" component={PerformanceTestDetailScreen} />
      <Stack.Screen name="PerformanceTestForm" component={PerformanceTestFormScreen} options={{ title: "Test Ekle" }} />
      <Stack.Screen name="WellnessCheckin" component={WellnessCheckinScreen} options={{ title: "Günlük Check-in" }} />
      <Stack.Screen name="MembershipFreeze" component={MembershipFreezeScreen} options={{ title: "Kayıt Dondurma" }} />
      <Stack.Screen name="CoachWellness" component={CoachWellnessScreen} options={{ title: "Sporcu Check-in'leri" }} />
      <Stack.Screen name="AthleteWellnessDetail" component={AthleteWellnessDetailScreen} />
      <Stack.Screen name="Fitness" component={FitnessScreen} options={{ title: "Fitness" }} />
      <Stack.Screen name="FitnessTraining" component={FitnessTrainingScreen} options={{ title: "Çalışma" }} />
      <Stack.Screen name="FitnessProgram" component={FitnessProgramScreen} options={{ title: "Program" }} />
      <Stack.Screen name="FitnessProgramBuilder" component={FitnessProgramBuilderScreen} options={{ title: "Program Ekle" }} />
      <Stack.Screen name="FitnessProgramDetail" component={FitnessProgramDetailScreen} options={{ title: "Program Detayı" }} />
      <Stack.Screen name="FitnessCategory" component={FitnessCategoryScreen} />
      <Stack.Screen name="FitnessGroups" component={FitnessGroupsScreen} options={{ title: "Fitness Grupları" }} />
      <Stack.Screen name="FitnessGroupForm" component={FitnessGroupFormScreen} options={{ title: "Fitness Grubu" }} />
      <Stack.Screen name="FitnessExerciseDetail" component={FitnessExerciseDetailScreen} />
      <Stack.Screen name="FitnessExerciseForm" component={FitnessExerciseFormScreen} options={{ title: "Çalışma Ekle" }} />
      <Stack.Screen name="FitnessExerciseVisibility" component={FitnessExerciseVisibilityScreen} options={{ title: "Hareketleri Yönet" }} />
      <Stack.Screen name="IndividualFitnessProgramsHub" component={IndividualFitnessProgramsHubScreen} options={{ title: "Bireysel Programlar" }} />
      <Stack.Screen name="IndividualFitnessProgramList" component={IndividualFitnessProgramListScreen} options={{ title: "Bireysel Programım" }} />
      <Stack.Screen name="IndividualFitnessProgramBuilder" component={IndividualFitnessProgramBuilderScreen} options={{ title: "Program Ekle" }} />
      <Stack.Screen name="IndividualFitnessProgramDetail" component={IndividualFitnessProgramDetailScreen} options={{ title: "Program Detayı" }} />
      <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ title: "Beslenme" }} />
      <Stack.Screen name="NutritionFoods" component={NutritionFoodsScreen} options={{ title: "Besinler" }} />
      <Stack.Screen name="NutritionFoodCategory" component={NutritionFoodCategoryScreen} />
      <Stack.Screen name="NutritionFoodDetail" component={NutritionFoodDetailScreen} options={{ title: "Besin Detayı" }} />
      <Stack.Screen name="NutritionFoodForm" component={NutritionFoodFormScreen} options={{ title: "Besin" }} />
      <Stack.Screen name="NutritionRecipes" component={NutritionRecipesScreen} options={{ title: "Sporcu Tarifleri" }} />
      <Stack.Screen name="NutritionRecipeCategory" component={NutritionRecipeCategoryScreen} />
      <Stack.Screen name="NutritionRecipeDetail" component={NutritionRecipeDetailScreen} options={{ title: "Tarif" }} />
      <Stack.Screen name="NutritionRecipeForm" component={NutritionRecipeFormScreen} options={{ title: "Tarif" }} />
      <Stack.Screen name="NutritionArticles" component={NutritionArticlesScreen} options={{ title: "Beslenme Rehberi" }} />
      <Stack.Screen name="NutritionArticleCategory" component={NutritionArticleCategoryScreen} />
      <Stack.Screen name="NutritionArticleDetail" component={NutritionArticleDetailScreen} options={{ title: "Yazı" }} />
      <Stack.Screen name="NutritionArticleForm" component={NutritionArticleFormScreen} options={{ title: "Yazı" }} />
      <Stack.Screen name="SuperAdminClubs" component={SuperAdminClubsScreen} options={{ title: "Kulüpler" }} />
      <Stack.Screen name="SuperAdminSubscriptions" component={SuperAdminSubscriptionsScreen} options={{ title: "Abonelikler" }} />
      <Stack.Screen name="SuperAdminReport" component={SuperAdminReportScreen} options={{ title: "Platform Raporu" }} />
      <Stack.Screen name="SuperAdminScreens" component={SuperAdminScreensScreen} options={{ title: "Ekranlar" }} />
      <Stack.Screen name="SuperAdminRolePreview" component={SuperAdminRolePreviewScreen} options={{ title: "Rol Önizlemesi" }} />
      <Stack.Screen name="SuperAdminAnnounce" component={SuperAdminAnnounceScreen} options={{ title: "Duyurular" }} />
      <Stack.Screen name="SuperAdminFinance" component={SuperAdminFinanceScreen} options={{ title: "Finans" }} />
      <Stack.Screen name="MyAthleteList" component={MyAthleteListScreen} options={{ title: "Sporcum" }} />
      <Stack.Screen name="AthleteTrackingHub" component={AthleteTrackingHubScreen} />
      <Stack.Screen name="AthletePerformanceView" component={AthletePerformanceViewScreen} />
      <Stack.Screen name="AthleteFitnessView" component={AthleteFitnessViewScreen} />
      <Stack.Screen name="AthleteFitnessProgram" component={AthleteFitnessProgramScreen} options={{ title: "Program" }} />
      <Stack.Screen name="MakePayment" component={MakePaymentScreen} options={{ title: "Ödeme Yap" }} />
      <Stack.Screen name="AthleteBulkImport" component={AthleteBulkImportScreen} options={{ title: "Excelden Aktar" }} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <Stack.Screen name="Shop" component={ShopScreen} options={{ title: "Mağaza" }} />
      <Stack.Screen name="ShopProductDetail" component={ShopProductDetailScreen} options={{ title: "Ürün" }} />
      <Stack.Screen name="ShopPurchase" component={ShopPurchaseScreen} options={{ title: "Satın Al" }} />
      <Stack.Screen name="MyShopOrders" component={MyShopOrdersScreen} options={{ title: "Siparişlerim" }} />
      <Stack.Screen name="ShopManage" component={ShopManageScreen} options={{ title: "Mağaza" }} />
      <Stack.Screen name="ShopProductForm" component={ShopProductFormScreen} options={{ title: "Ürün" }} />
      <Stack.Screen name="ShopOrders" component={ShopOrdersScreen} options={{ title: "Siparişler" }} />
      <Stack.Screen name="ShopStock" component={ShopStockScreen} options={{ title: "Stok" }} />
      <Stack.Screen name="EventsList" component={EventsListScreen} options={{ title: "Etkinlik/Turnuva/Kamp" }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Etkinlik" }} />
      <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: "Etkinlik" }} />
      <Stack.Screen name="EventsManage" component={EventsManageScreen} options={{ title: "Etkinlik/Turnuva/Kamp" }} />
      <Stack.Screen name="EventRegister" component={EventRegisterScreen} options={{ title: "Kayıt Ol" }} />
      <Stack.Screen name="EventRegistrations" component={EventRegistrationsScreen} options={{ title: "Kayıtlar" }} />
      <Stack.Screen name="MyEventRegistrations" component={MyEventRegistrationsScreen} options={{ title: "Kayıtlarım" }} />
    </Stack.Navigator>
  );
}
