"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]); // histórico de mensagens tipo terminal

  const pushLog = (line) => {
    setLog((l) => [...l, line]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    pushLog('> verificando credenciais...');

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
        pushLog('> ACESSO NEGADO — credenciais inválidas');
        setLoading(false);
        return;
      }

      if (data && data.token) {
        localStorage.setItem("token", data.token);
        pushLog('> acesso autorizado');
        pushLog('> carregando painel...');

        setTimeout(() => {
          router.push("/dashboard");
        }, 900);
      } else {
        pushLog('> resposta inesperada do servidor');
        setLoading(false);
      }

    } catch (err) {
      pushLog('> erro de conexão — verifique se a API está ativa');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden p-6">

  <div className="absolute inset-0 opacity-8 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>

      <div className="z-10 w-full max-w-md border border-white/10 p-8 backdrop-blur-sm bg-white/3 shadow-[0_0_30px_rgba(255,0,0,0.05)]">

        <div className="text-center mb-2">
          <h1 className="logo-special text-3xl">FICHA OPRPG</h1>
          <p className="text-center text-red-500 text-xs mt-1">ACESSO RESTRITO</p>
        </div>

  <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <input
            type="email"
            placeholder="usuário (email)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black border border-white/10 p-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500"
          />

          <input
            type="password"
            placeholder="senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black border border-white/10 p-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-green-500"
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="border border-green-500 py-2 px-4 hover:bg-green-500 hover:text-black transition-all duration-150 text-sm"
            >
              {loading ? '...' : 'ACESSAR'}
            </button>

            <button
              type="button"
              onClick={() => { setEmail('teste@email.com'); setPassword('1234'); pushLog('> credenciais de teste preenchidas'); }}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              usar credenciais de teste
            </button>
          </div>
        </form>

  <div className="mt-5 terminal">
          {log.length === 0 ? (
            <div className="terminal-line status-muted">&gt; aguardando ação...</div>
          ) : (
            log.map((line, i) => (
              <div className="terminal-line" key={i}>{line}</div>
            ))
          )}

          {/* cursor quando loading */}
          {loading && <div className="inline-block mt-2"><span className="cursor" aria-hidden /></div>}
        </div>

        

      </div>
    </div>
  );
}