import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from './components/protected-route'

const SignIn = lazy(() => import('./pages/auth/sign-in'))
const SignUp = lazy(() => import('./pages/auth/sign-up'))
const Dashboard = lazy(() => import('./pages/dashboard'))
const Categories = lazy(() => import('./pages/categories'))
const Receipts = lazy(() => import('./pages/receipts'))
const Groups = lazy(() => import('./pages/groups'))
const Settings = lazy(() => import('./pages/settings'))

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
    path: '/groups',
    element: (
      <ProtectedRoute>
        <Groups />
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
]
