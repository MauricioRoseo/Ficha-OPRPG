"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("> verificando credenciais...");

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("> ACESSO NEGADO");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);

      setStatus("> acesso autorizado");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);

    } catch (err) {
      setStatus("> erro de conexão");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">

      {/* efeito de ruído */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>

      <div className="z-10 w-full max-w-md border border-white/20 p-8 backdrop-blur-sm bg-white/5 shadow-[0_0_30px_rgba(255,0,0,0.1)]">

        {/* LOGO */}
        <h1 className="text-center text-2xl tracking-[0.3em] mb-2">
          FICHA OPRPG
        </h1>

        <p className="text-center text-red-500 text-sm mb-6">
          ACESSO RESTRITO
        </p>

        {/* FORM */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="usuário"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black border border-white/20 p-2 focus:outline-none focus:border-red-500"
          />

          <input
            type="password"
            placeholder="senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black border border-white/20 p-2 focus:outline-none focus:border-red-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="border border-red-500 py-2 mt-2 hover:bg-red-500 hover:text-black transition-all duration-200"
          >
            {loading ? "..." : "ACESSAR"}
          </button>
        </form>

        {/* STATUS */}
        <p className="mt-6 text-xs text-green-400 font-mono">
          {status}
        </p>

      </div>
    </div>
  );
}