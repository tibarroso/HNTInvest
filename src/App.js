import React, { useState, useEffect } from "react";
import axios from "axios";

function Cotacoes({ carteira }) {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    const fetchCotacoes = async () => {
      if (carteira.length === 0) {
        setDados([]);
        return;
      }

      const resultados = [];
      for (const ativo of carteira) {
        try {
          let res;
          // Se for FII, buscar no Fundsexplorer
          if (ativo.nome.includes("FII")) {
            res = await axios.get(`https://www.fundsexplorer.com.br/funds/${ativo.nome}`);
            resultados.push({
              symbol: ativo.nome,
              shortName: ativo.nome,
              regularMarketPrice: null, // Sem preço direto
              regularMarketChange: null,
              regularMarketChangePercent: null,
              regularMarketDayHigh: null,
              regularMarketDayLow: null,
              priceEarnings: null,
              earningsPerShare: null,
              regularMarketVolume: null,
              logourl: "%PUBLIC_URL%/icon-192.png"
            });
          } else {
            res = await axios.get(`https://brapi.dev/api/quote/${ativo.nome}`);
            const r = res.data.results[0];
            resultados.push(r);
          }
        } catch (err) {
          console.error("Erro ao buscar cotação:", ativo.nome, err);
        }
      }
      setDados(resultados);
    };

    fetchCotacoes();
    const interval = setInterval(fetchCotacoes, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [carteira]);

  if (dados.length === 0) return <p className="text-center mt-10">Nenhuma cotação para mostrar.</p>;

  return (
    <div className="p-4 flex flex-wrap gap-6 justify-center">
      {dados.map((stock) => {
        const changeClass =
          stock.regularMarketChange >= 0 ? "text-green-400" : "text-red-400";
        const changeSign = stock.regularMarketChange >= 0 ? "+" : "";
        const isFII = stock.symbol.includes("FII");

        return (
          <div
            key={stock.symbol}
            className={`backdrop-blur-lg bg-white/10 rounded-xl p-4 w-64 shadow-lg transition-transform hover:scale-105`}
          >
            <img
              src={stock.logourl || "%PUBLIC_URL%/icon-192.png"}
              alt={stock.symbol}
              className="w-12 h-12 mx-auto mb-2"
            />
            <div className="text-center font-bold text-lg">{stock.shortName}</div>
            <div className="text-center text-2xl font-semibold">
              {stock.regularMarketPrice !== null ? `R$ ${stock.regularMarketPrice?.toFixed(2)}` : "N/D"}
            </div>
            {stock.regularMarketChange !== null && (
              <div className={`text-center ${changeClass}`}>
                {changeSign}{stock.regularMarketChange?.toFixed(2)} (
                {changeSign}{stock.regularMarketChangePercent?.toFixed(2)}%)
              </div>
            )}
            <div className="text-sm mt-2 text-left">
              {stock.regularMarketDayHigh && <div><strong>Máx/Dia:</strong> R$ {stock.regularMarketDayHigh?.toFixed(2)}</div>}
              {stock.regularMarketDayLow && <div><strong>Mín/Dia:</strong> R$ {stock.regularMarketDayLow?.toFixed(2)}</div>}
              {stock.priceEarnings && <div><strong>P/L:</strong> {stock.priceEarnings.toFixed(2)}</div>}
              {stock.earningsPerShare && <div><strong>EPS:</strong> {stock.earningsPerShare.toFixed(2)}</div>}
              {stock.regularMarketVolume && <div><strong>Volume:</strong> {stock.regularMarketVolume?.toLocaleString()}</div>}
              {isFII && <div className="text-yellow-300 mt-1 font-semibold">FII</div>}
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
      for (const a of carteira) {
        try {
          let res;
          let dividendos = [];

          if (a.nome.includes("FII")) {
            // FII pelo Fundsexplorer
            res = await axios.get(`https://www.fundsexplorer.com.br/funds/${a.nome}/dividends`);
            dividendos = res.data.results || [];
          } else {
            res = await axios.get(`https://brapi.dev/api/quote/${a.nome}?modules=dividends`);
            const r = res.data.results[0];
            dividendos = r.dividendsData?.cashDividends || [];
          }

          dividendos.forEach(d => {
            const mes = new Date(d.paymentDate).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
            if (!dados[mes]) dados[mes] = [];
            dados[mes].push({
              ticker: a.nome,
              valor: (d.rate * (a.qtComprada || 1)).toFixed(2),
              pagamento: d.paymentDate,
              isFII: a.nome.includes("FII"),
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

  if (Object.keys(divs).length === 0) return <p className="text-center mt-10">Nenhum provento encontrado.</p>;

  return (
    <div className="p-4 flex flex-col gap-4">
      {Object.entries(divs).map(([mes, lista]) => (
        <div key={mes}>
          <h3 className="font-semibold text-lg">{mes}</h3>
          <ul className="mt-2">
            {lista.map((p, i) => (
              <li key={i} className={`p-2 rounded ${p.isFII ? "bg-yellow-200/30" : "bg-white/10"}`}>
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

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("carteira") || "[]");
    setCarteira(stored);
  }, []);

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
          dtCompra: new Date().toLocaleDateString("pt-BR"),
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

  const atualizarQt = (index, qt) => {
    const updated = [...carteira];
    updated[index].qtComprada = qt < 1 ? 1 : qt;
    setCarteira(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-500 text-white">
      <header className="backdrop-blur-lg bg-white/10 p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold">NoralieInvest</h1>
        <nav className="flex gap-4">
          <button onClick={() => setAba("cotacoes")} className="font-semibold hover:underline">Cotações</button>
          <button onClick={() => setAba("carteira")} className="font-semibold hover:underline">Carteira</button>
          <button onClick={() => setAba("proventos")} className="font-semibold hover:underline">Proventos</button>
        </nav>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {aba === "cotacoes" && <Cotacoes carteira={carteira} />}
        {aba === "carteira" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Código do ativo (ex: PETR4, MXRF11)"
                className="flex-1 p-2 rounded text-black"
                value={novaAcao}
                onChange={(e) => setNovaAcao(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && adicionarAcao()}
              />
              <button
                className="px-4 py-2 bg-blue-600 rounded font-semibold"
                onClick={adicionarAcao}
              >
                Adicionar
              </button>
            </div>

            {carteira.length === 0 && <p className="text-center text-white/70">Nenhum ativo na carteira.</p>}

            <ul className="space-y-2">
              {carteira.map((acao, index) => (
                <li key={index} className="flex justify-between items-center p-2 rounded shadow bg-white/10">
                  <span className="font-semibold">
                    {acao.nome} • Qt:
                    <input
                      type="number"
                      min="1"
                      value={acao.qtComprada}
                      onChange={(e) => atualizarQt(index, parseInt(e.target.value))}
                      className="ml-1 w-16 p-1 rounded text-black"
                    /> • Dt: {acao.dtCompra}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={acao.monitorar} onChange={() => toggleMonitorar(index)} />
                      Monitorar
                    </label>
                    <button onClick={() => removerAcao(index)} className="text-red-500 font-bold">✕</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {aba === "proventos" && <Proventos carteira={carteira} />}
      </main>

      <footer className="p-3 text-center bg-white/10 text-sm">
        Desenvolvedor: Helquys Ande • +55 869 81250-154
      </footer>
    </div>
  );
}

export default App;
