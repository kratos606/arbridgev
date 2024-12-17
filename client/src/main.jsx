import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css'


// Lazy-loaded components
const App = lazy(() => import('./App.jsx'));
const ErrorPage = lazy(() => import('./pages/Error.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const RedirectToChrome = lazy(() => import('./pages/RedirectToChrome.jsx'));
const Model = lazy(() => import('./pages/Model.jsx'));
const PosterAR = lazy(() => import('./pages/PosterAR.jsx'));

const router = createBrowserRouter([
  {
    path: "/model/:model",
    element: (
        <Suspense fallback={<div />}>
          <App />
        </Suspense>
    ),
    errorElement: (
        <Suspense fallback={<div />}>
           <ErrorPage />
        </Suspense>
    ),
  },
  {
    path: "/model/:model/redirect-to-chrome",
    element: (
        <Suspense fallback={<div />}>
            <RedirectToChrome />
         </Suspense>
    ),
  },
  {
    path: "/model/:model/view",
    element: (
        <Suspense fallback={<div />}>
            <Model />
        </Suspense>
    ),
  },
  {
    path: "/model/:model/view/:art",
    element: (
        <Suspense fallback={<div />}>
             <Model />
        </Suspense>
    ),
  },
  {
    path: "/poster/:image/view",
    element: (
        <Suspense fallback={<div />}>
            <PosterAR />
        </Suspense>
    ),
    errorElement: (
        <Suspense fallback={<div />}>
             <ErrorPage />
        </Suspense>
    ),
  },
  {
    path: "*",
    element: (
        <Suspense fallback={<div />}>
            <NotFound />
        </Suspense>
    ),
  },
]);

createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />,
)
