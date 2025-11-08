import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { FaLock, FaPhone } from "react-icons/fa6";

const API_URL =  "http://localhost:8080/api";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation simple
    if (!phoneNumber.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      setIsLoading(false);
      return;
    }

   

    try {
     
      const res = await fetch(`${API_URL}/auth/supplier/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Échec de la connexion");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Numéro de téléphone ou mot de passe invalide");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">
            Hanoutik
          </h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre espace fournisseur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone
            </label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="phoneNumber"
                type="text"
                placeholder="+21612345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "phone-error" : undefined}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all bg-white/50 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "password-error" : undefined}
              />
            </div>
          </div>

          {error && (
            <p id="error-message" className="text-red-500 text-sm text-center" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#1E3A8A] text-white py-3 rounded-xl hover:bg-[#D4AF37] transition-colors duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

       
      </div>
    </div>
  );
}