import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger automatiquement vers /home
    navigate("/home");
  }, [navigate]);

  return null;
}