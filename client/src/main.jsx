import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css'

import App from './App.jsx'
import ErrorPage from './pages/Error.jsx';
import NotFound from './pages/NotFound.jsx';
import RedirectToChrome from './pages/RedirectToChrome.jsx';
import Model from './pages/Model.jsx';
import PosterAR from './pages/PosterAR.jsx';

const router = createBrowserRouter([
  {
    path: "/model/:model",
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/model/:model/redirect-to-chrome",
    element: <RedirectToChrome />,
  },
  {
    path: "/model/:model/view",
    element: <Model />,
  },
  {
    path: "/model/:model/view/:art",
    element: <Model />,
  },
  {
    path: "/poster/:image/view",
    element: <PosterAR />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />,
)
