import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import CreatorRoute from './components/CreatorRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import FavoritesPage from './pages/FavoritesPage';
import NotificationsPage from './pages/NotificationsPage';
import RecipesPage from './pages/RecipesPage';
import MealPlanPage from './pages/MealPlanPage';
import ShoppingListPage from './pages/ShoppingListPage';
import MyRecipesPage from './pages/MyRecipesPage';
import CreateRecipePage from './pages/CreateRecipePage';
import FollowersPage from './pages/FollowersPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* "/" est la page officielle pour tout le monde, créateurs inclus */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes"
          element={
            <ProtectedRoute>
              <RecipesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <MealPlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shopping"
          element={
            <ProtectedRoute>
              <ShoppingListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creator/:id"
          element={
            <ProtectedRoute>
              <CreatorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipe/:id"
          element={
            <ProtectedRoute>
              <RecipeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Espace créateur — mêmes sidebar/thème que le reste du site, réservé au role "creator" */}
        <Route
          path="/my-recipes"
          element={
            <CreatorRoute>
              <MyRecipesPage />
            </CreatorRoute>
          }
        />
        <Route
          path="/my-recipes/new"
          element={
            <CreatorRoute>
              <CreateRecipePage />
            </CreatorRoute>
          }
        />
        <Route
          path="/followers"
          element={
            <CreatorRoute>
              <FollowersPage />
            </CreatorRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <CreatorRoute>
              <StatisticsPage />
            </CreatorRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Toute URL inconnue — évite l'écran blanc */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
