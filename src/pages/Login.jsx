import { useState } from "react";
import { useNavigate } from "react-router-dom"; 

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:8080/api/auth/supplier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }) 
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();

      localStorage.setItem("token", data.token);
      console.log("Login successful", data.token);

      navigate("/home"); 
    } catch (err) {
      setError("Numéro de téléphone ou mot de passe invalide");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Numéro de téléphone"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
