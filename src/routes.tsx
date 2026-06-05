import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from './components/protected-route'
import { AdminRoute } from './components/admin-route'
import { FeatureRoute } from './components/feature-route'

// Eagerly load core sidebar pages — they're small (~5-20KB each gzipped)
// and lazy-loading them causes a jarring navigation delay (sidebar disappears).
import Dashboard from './pages/dashboard'
import Receipts from './pages/receipts'
import Categories from './pages/categories'
import Groups from './pages/groups'
import Warranties from './pages/warranties'
import Settings from './pages/settings'
import Items from './pages/items'
import RecurringExpenses from './pages/recurring-expenses'
import LoyaltyCards from './pages/loyalty-cards'

// Lazy-load pages behind secondary navigation or auth walls
const SignIn = lazy(() => import('./pages/auth/sign-in'))
const CompleteProfile = lazy(() => import('./pages/auth/complete-profile'))
const Templates = lazy(() => import('./pages/templates'))
const ItemDetail = lazy(() => import('./pages/items/[id]'))
const JoinGroup = lazy(() => import('./pages/groups/join'))
const GroupDetail = lazy(() => import('./pages/groups/[id]'))
const AdminUsers = lazy(() => import('./pages/admin/users'))
const AdminUserDetails = lazy(() => import('./pages/admin/user-details'))
const AdminRatings = lazy(() => import('./pages/admin/ratings'))
const AdminAnnouncements = lazy(() => import('./pages/admin/announcements'))
const AdminSettings = lazy(() => import('./pages/admin/settings'))

// Prefetch remaining lazy chunks after initial load so they're instant when needed
export function prefetchLazyRoutes() {
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1))
  idle(() => {
    import('./pages/items/[id]')
    import('./pages/groups/[id]')
    import('./pages/templates')
  })
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/sign-in',
    element: <SignIn />,
  },
  {
    path: '/complete-profile',
    element: (
      <ProtectedRoute>
        <CompleteProfile />
      </ProtectedRoute>
    ),
  },
  // Legacy auth routes → unified passwordless sign-in
  { path: '/sign-up', element: <Navigate to="/sign-in" replace /> },
  { path: '/forgot-password', element: <Navigate to="/sign-in" replace /> },
  { path: '/reset-password', element: <Navigate to="/sign-in" replace /> },
  { path: '/check-email', element: <Navigate to="/sign-in" replace /> },
  { path: '/verify-email', element: <Navigate to="/sign-in" replace /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/categories',
    element: (
      <ProtectedRoute>
        <Categories />
      </ProtectedRoute>
    ),
  },
  {
    path: '/receipts',
    element: (
      <ProtectedRoute>
        <Receipts />
      </ProtectedRoute>
    ),
  },
  {
    path: '/templates',
    element: (
      <ProtectedRoute>
        <Templates />
      </ProtectedRoute>
    ),
  },
  {
    path: '/items',
    element: (
      <ProtectedRoute>
        <FeatureRoute feature="itemPricing">
          <Items />
        </FeatureRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/items/:id',
    element: (
      <ProtectedRoute>
        <FeatureRoute feature="itemPricing">
          <ItemDetail />
        </FeatureRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/groups',
    element: (
      <ProtectedRoute>
        <Groups />
      </ProtectedRoute>
    ),
  },
  {
    path: '/groups/join/:code',
    element: (
      <ProtectedRoute>
        <JoinGroup />
      </ProtectedRoute>
    ),
  },
  {
    path: '/groups/:id',
    element: (
      <ProtectedRoute>
        <GroupDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recurring',
    element: (
      <ProtectedRoute>
        <FeatureRoute feature="recurringExpenses">
          <RecurringExpenses />
        </FeatureRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/loyalty-cards',
    element: (
      <ProtectedRoute>
        <FeatureRoute feature="loyaltyCards">
          <LoyaltyCards />
        </FeatureRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/warranties',
    element: (
      <ProtectedRoute>
        <FeatureRoute feature="warranties">
          <Warranties />
        </FeatureRoute>
      </ProtectedRoute>
    ),
  },
  // Settings routes
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  { path: '/settings/app', element: <Navigate to="/settings" replace /> },
  { path: '/settings/profile', element: <Navigate to="/settings" replace /> },
  { path: '/settings/account', element: <Navigate to="/settings" replace /> },
  // Admin routes
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <AdminUsers />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/users/:id',
    element: (
      <AdminRoute>
        <AdminUserDetails />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/ratings',
    element: (
      <AdminRoute>
        <AdminRatings />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/announcements',
    element: (
      <AdminRoute>
        <AdminAnnouncements />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <AdminRoute>
        <AdminSettings />
      </AdminRoute>
    ),
  },
]
