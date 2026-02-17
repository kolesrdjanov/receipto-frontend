import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from './components/protected-route'
import { AdminRoute } from './components/admin-route'

// Eagerly load core sidebar pages — they're small (~5-20KB each gzipped)
// and lazy-loading them causes a jarring navigation delay (sidebar disappears).
import Dashboard from './pages/dashboard'
import Receipts from './pages/receipts'
import Categories from './pages/categories'
import Groups from './pages/groups'
import Warranties from './pages/warranties'
import Settings from './pages/settings'
import Items from './pages/items'

// Lazy-load pages behind secondary navigation or auth walls
const SignIn = lazy(() => import('./pages/auth/sign-in'))
const SignUp = lazy(() => import('./pages/auth/sign-up'))
const ForgotPassword = lazy(() => import('./pages/auth/forgot-password'))
const ResetPassword = lazy(() => import('./pages/auth/reset-password'))
const Templates = lazy(() => import('./pages/templates'))
const ItemDetail = lazy(() => import('./pages/items/[id]'))
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
    path: '/sign-up',
    element: <SignUp />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
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
  // Price Tracker routes — hidden from nav, re-enable when feature is ready
  // {
  //   path: '/items',
  //   element: (
  //     <ProtectedRoute>
  //       <Items />
  //     </ProtectedRoute>
  //   ),
  // },
  // {
  //   path: '/items/:id',
  //   element: (
  //     <ProtectedRoute>
  //       <ItemDetail />
  //     </ProtectedRoute>
  //   ),
  // },
  {
    path: '/groups',
    element: (
      <ProtectedRoute>
        <Groups />
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
    path: '/warranties',
    element: (
      <ProtectedRoute>
        <Warranties />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
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
