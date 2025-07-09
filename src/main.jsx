import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import PendingProducts from "./pages/PendingProducts";
import EditProductPending from "./pages/EditProductPending";
import Users from "./pages/Users";
import Products from "./pages/Products";
import FeedbackScreen from "./pages/FeedbackScreen";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/pending-products",
    element: <PendingProducts />,
  },
  {
    path: "/edit-product-pending/:barcode",
    element: <EditProductPending />,
  },
  {
    path: "/users",
    element: <Users />,
  },
  {
    path: "/products",
    element: <Products />,
  },
  {
    path: "/feedback",
    element: <FeedbackScreen />,
  },
  {
    path: "*",
    element: <div>404 - Page non trouvée</div>,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);