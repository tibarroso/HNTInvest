import React, { useState, useEffect } from "react";
import axios from "axios";

function Cotacoes({ carteira }) {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    const fetchCotacoes = async () => {
      const ativosMonitorados = carteira.filter(a => a.monitorar).map(a => a.nome);
      if (ativosMonitorados.length === 0) {
        setDados([]);
        return;
      }

      const resultados = [];
      for (const ticker of ativosMonitorados) {
        try {
          const res = await axios.get(`https://brapi.dev/api/quote/${ticker}`);
          const r = res.data.results[0];
          resultados.push(r);
        } catch (err) {
          console.error("Erro ao buscar cotação:", ticker, err);
        }
      }
      setDados(resultados);
    };

    fetchCotacoes();
    const interval = setInterval(fetchCotacoes, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [carteira]);

  if (dados.length === 0) return <p>Nenhuma cotação para mostrar.</p>;

  return (
    <div className="p-4 flex flex-wrap gap-4 justify-center">
      {dados.map((stock) => {
        const changeClass = stock.regularMarketChange >= 0 ? "text-green-600" : "text-red-600";
        const changeSign = stock.regularMarketChange >= 0 ? "+" : "";

        return (
          <div
            key={stock.symbol}
            className="bg-white shadow-md rounded-xl p-4 w-64 hover:scale-105 transition-transform"
          >
            <img src={stock.logourl || "%PUBLIC_URL%/icon-192.png"} alt={stock.symbol} className="w-12 h-12 mx-auto mb-2" />
            <div className="text-center font-bold text-lg">{stock.shortName}</div>
            <div className="text-center text-2xl font-semibold">R$ {stock.regularMarketPrice?.toFixed(2)}</div>
            <div className={`text-center ${changeClass}`}>
              {changeSign}{stock.regularMarketChange?.toFixed(2)} ({changeSign}{stock.regularMarketChangePercent?.toFixed(2)}%)
            </div>
            <div className="text-sm mt-2">
              <div><strong>Máx/Dia:</strong> R$ {stock.regularMarketDayHigh?.toFixed(2)}</div>
              <div><strong>Mín/Dia:</strong> R$ {stock.regularMarketDayLow?.toFixed(2)}</div>
              {stock.priceEarnings && <div><strong>P/L:</strong> {stock.priceEarnings.toFixed(2)}</div>}
              {stock.earningsPerShare && <div><strong>EPS:</strong> {stock.earningsPerShare.toFixed(2)}</div>}
              <div><strong>Volume:</strong> {stock.regularMarketVolume?.toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Proventos({ carteira }) {
  const [divs, setDivs] = useState({});

  useEffect(() => {
    const fetchProventos = async () => {
      const dados = {};
      const ativosMonitorados = carteira.filter(a => a.monitorar);

      for (const a of ativosMonitorados) {
        try {
          let res = await axios.get(`https://brapi.dev/api/quote/${a.nome}?modules=dividends`);
          const r = res.data.results[0];

          let dividendos = [];
          if (r.dividendsData?.cashDividends) {
            dividendos = r.dividendsData.cashDividends;
          } else {
            res = await axios.get(`https://brapi.dev/api/funds/${a.nome}/dividends`);
            dividendos = res.data.results || [];
          }

          dividendos.forEach(d => {
            const mes = new Date(d.paymentDate).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
            if (!dados[mes]) dados[mes] = [];
            dados[mes].push({
              ticker: a.nome,
              valor: (d.rate * (a.qtComprada || 1)).toFixed(2),
              pagamento: d.paymentDate,
            });
          });
        } catch (err) {
          console.warn("Erro ao buscar proventos:", a.nome, err);
        }
      }

      setDivs(dados);
    };

    fetchProventos();
  }, [carteira]);

  if (Object.keys(divs).length === 0) return <p>Nenhum provento encontrado.</p>;

  return (
    <div>
      {Object.entries(divs).map(([mes, lista]) => (
        <div key={mes} className="mb-4">
          <h3 className="font-semibold">{mes}</h3>
          <ul>
            {lista.map((p, i) => (
              <li key={i} className="border-b py-1">
                {p.ticker} → R$ {p.valor} (pagamento {p.pagamento})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [aba, setAba] = useState("cotacoes");
  const [carteira, setCarteira] = useState([]);
  const [novaAcao, setNovaAcao] = useState("");

  // Carrega carteira do localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("carteira") || "[]");
    setCarteira(stored);
  }, []);

  // Salva carteira no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("carteira", JSON.stringify(carteira));
  }, [carteira]);

  const adicionarAcao = () => {
    if (novaAcao.trim() && !carteira.some(a => a.nome === novaAcao.trim().toUpperCase())) {
      setCarteira([
        ...carteira,
        {
          nome: novaAcao.trim().toUpperCase(),
          qtComprada: 1,
          dtCompra: new Date().toISOString().slice(0,10),
          monitorar: true
        }
      ]);
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
        {aba === "cotacoes" && <Cotacoes carteira={carteira} />}

        {aba === "carteira" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o código do ativo (ex: PETR4, MXRF11)"
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

            {carteira.length === 0 && <p className="text-gray-600">Nenhum ativo na carteira.</p>}

            <ul className="space-y-2">
              {carteira.map((acao, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-2 bg-white shadow rounded"
                >
                  <span className="font-semibold">{acao.nome} • Qt: {acao.qtComprada} • Dt: {acao.dtCompra}</span>
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

        {aba === "proventos" && <Proventos carteira={carteira} />}
      </main>

      <footer className="text-sm text-gray-500 mt-4 p-2 border-t text-center">
        Desenvolvedor: Helquys Ande • +55 869 81250-154
      </footer>
    </div>
  );
}

export default App;
