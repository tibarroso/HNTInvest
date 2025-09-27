import React, { useState, useEffect } from "react";
import CotacoesPWA from "./CotacoesPWA";
import axios from "axios";

function App() {
  const [aba, setAba] = useState("cotacoes");
  const [carteira, setCarteira] = useState([]);
  const [novaAcao, setNovaAcao] = useState("");
  const BRAPI_TOKEN = "SEU_TOKEN_AQUI"; // Substitua pelo seu token da BRAPI

  const adicionarAcao = () => {
    if (novaAcao.trim() && !carteira.some(a => a.nome === novaAcao.trim().toUpperCase())) {
      setCarteira([...carteira, { nome: novaAcao.trim().toUpperCase(), monitorar: true }]);
      setNovaAcao("");
    }
  };

  const toggleMonitorar = (index) => {
    const updated = [...carteira];
    updated[index].monitorar = !updated[index].monitorar;
    setCarteira(updated);
  };

  const removerAcao = (index) => {
    const updated = [...carteira];
    updated.splice(index, 1);
    setCarteira(updated);
  };

  // Função para buscar proventos da BRAPI
  const obterDividendos = async (ticker) => {
    try {
      const res = await axios.get(`https://brapi.dev/api/dividendos/${ticker}?token=${BRAPI_TOKEN}`);
      return res.data.results || [];
    } catch (err) {
      console.error("Erro ao buscar dividendos:", err);
      return [];
    }
  };

  const [proventos, setProventos] = useState([]);

  useEffect(() => {
    const fetchProventos = async () => {
      const provs = [];
      for (const acao of carteira) {
        if (acao.monitorar) {
          const divs = await obterDividendos(acao.nome);
          provs.push({ nome: acao.nome, dividendos: divs });
        }
      }
      setProventos(provs);
    };

    fetchProventos();
  }, [carteira]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      <header className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">NoralieInvest</h1>
        <nav className="flex gap-4">
          <button onClick={() => setAba("cotacoes")}>Cotações</button>
          <button onClick={() => setAba("carteira")}>Carteira</button>
          <button onClick={() => setAba("proventos")}>Proventos</button>
        </nav>
      </header>

      <main className="flex-1 p-4">
        {aba === "cotacoes" && <CotacoesPWA carteira={carteira.filter(a => a.monitorar)} />}

        {aba === "carteira" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o código da ação (ex: PETR4)"
                className="flex-1 p-2 border rounded"
                value={novaAcao}
                onChange={(e) => setNovaAcao(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && adicionarAcao()}
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={adicionarAcao}
              >
                Adicionar
              </button>
            </div>

            {carteira.length === 0 && <p className="text-gray-600">Nenhuma ação na carteira.</p>}

            <ul className="space-y-2">
              {carteira.map((acao, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-2 bg-white shadow rounded"
                >
                  <span className="font-semibold">{acao.nome}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={acao.monitorar}
                        onChange={() => toggleMonitorar(index)}
                      />
                      Monitorar
                    </label>
                    <button
                      className="text-red-500 font-bold"
                      onClick={() => removerAcao(index)}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {aba === "proventos" && (
          <div className="space-y-4">
            {proventos.length === 0 && (
              <p className="text-gray-600">Nenhuma ação monitorada com dividendos disponíveis.</p>
            )}
            {proventos.map((acao) => (
              <div key={acao.nome} className="p-4 bg-white rounded shadow">
                <h2 className="font-bold">{acao.nome}</h2>
                <ul className="mt-2">
                  {acao.dividendos.length > 0 ? (
                    acao.dividendos.map((div, i) => (
                      <li key={i} className="text-gray-800">
                        {div.tipo}: R$ {div.valor} • {div.dataPagamento}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">Nenhum provento disponível.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-sm text-gray-500 mt-4 p-2 border-t text-center">
        Desenvolvedor: Helquys Ande • +55 869 81250-154
      </footer>
    </div>
  );
}

export default App;
