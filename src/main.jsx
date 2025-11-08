import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PendingProducts from "./pages/PendingProducts";
import EditProductPending from "./pages/EditProductPending";
import Users from "./pages/Users";
import Products from "./pages/Products";
import FeedbackScreen from "./pages/FeedbackScreen";
import Login from "./pages/Login";
import Partners from "./pages/Partners";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "pending-products",
        element: <PendingProducts />,
      },
      {
        path: "edit-product-pending/:barcode",
        element: <EditProductPending />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "feedback",
        element: <FeedbackScreen />,
      },
      {
        path: "partners",
        element: <Partners />,
      },
    ],
  },
  {
    path: "*",
    element: <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page non trouvée</p>
        <a href="/home" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
          Retour à l'accueil
        </a>
      </div>
    </div>,
  },
]);ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);