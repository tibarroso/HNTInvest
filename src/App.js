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
          if (ativo.nome.includes("FII")) {
            // Buscar FII do Funds Explorer
            res = await axios.get(`https://api.fundsexplorer.com.br/funds/${ativo.nome}`);
            const r = res.data;
            resultados.push({
              symbol: ativo.nome,
              shortName: r.name,
              regularMarketPrice: r.last_price,
              regularMarketChange: r.variation,
              regularMarketChangePercent: r.variation,
              regularMarketDayHigh: r.max_price,
              regularMarketDayLow: r.min_price,
              priceEarnings: null,
              earningsPerShare: null,
              regularMarketVolume: null,
              logourl: null
            });
          } else {
            // Ações via brapi.dev
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
    const interval = setInterval(fetchCotacoes, 30000);
    return () => clearInterval(interval);
  }, [carteira]);

  if (dados.length === 0) return <p>Nenhuma cotação para mostrar.</p>;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {dados.map((stock) => {
        const changeClass = stock.regularMarketChange >= 0 ? "text-green-600" : "text-red-600";
        const changeSign = stock.regularMarketChange >= 0 ? "+" : "";

        return (
          <div key={stock.symbol} className="p-4 rounded-xl shadow bg-white hover:shadow-lg transition">
            <div className="flex items-center gap-2 mb-2">
              <img src={stock.logourl || "%PUBLIC_URL%/icon-192.png"} alt={stock.symbol} className="w-8 h-8 rounded" />
              <span className="font-semibold text-gray-800">{stock.shortName}</span>
            </div>
            <div className="text-xl font-bold">R$ {stock.regularMarketPrice?.toFixed(2)}</div>
            <div className={`text-sm font-semibold ${changeClass}`}>
              {changeSign}{stock.regularMarketChange?.toFixed(2)} ({changeSign}{stock.regularMarketChangePercent?.toFixed(2)}%)
            </div>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div>📈 Máx/Dia: {stock.regularMarketDayHigh?.toFixed(2)}</div>
              <div>📉 Mín/Dia: {stock.regularMarketDayLow?.toFixed(2)}</div>
              {stock.priceEarnings && <div>📊 P/L: {stock.priceEarnings.toFixed(2)}</div>}
              {stock.earningsPerShare && <div>💵 EPS: {stock.earningsPerShare.toFixed(2)}</div>}
              {stock.regularMarketVolume && <div>🔄 Volume: {stock.regularMarketVolume?.toLocaleString()}</div>}
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
          if (a.nome.includes("FII")) {
            res = await axios.get(`https://api.fundsexplorer.com.br/funds/${a.nome}/dividends`);
            const dividendos = res.data || [];
            dividendos.forEach(d => {
              const mes = new Date(d.payment_date).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
              if (!dados[mes]) dados[mes] = [];
              dados[mes].push({
                ticker: a.nome,
                valor: (d.value * (a.qtComprada || 1)).toFixed(2),
                pagamento: d.payment_date,
                isFII: true
              });
            });
          } else {
            res = await axios.get(`https://brapi.dev/api/quote/${a.nome}?modules=dividends`);
            const r = res.data.results[0];
            let dividendos = r.dividendsData?.cashDividends || [];
            dividendos.forEach(d => {
              const mes = new Date(d.paymentDate).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
              if (!dados[mes]) dados[mes] = [];
              dados[mes].push({
                ticker: a.nome,
                valor: (d.rate * (a.qtComprada || 1)).toFixed(2),
                pagamento: d.paymentDate,
                isFII: false
              });
            });
          }
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
              <li key={i} className={`border-b py-1 px-2 rounded ${p.isFII ? "bg-yellow-100 text-gray-800" : "bg-white text-gray-900"}`}>
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
      setCarteira([...carteira, {
        nome: novaAcao.trim().toUpperCase(),
        qtComprada: 1,
        dtCompra: new Date().toLocaleDateString("pt-BR"),
        monitorar: true
      }]);
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
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      <header className="p-4 bg-blue-900 text-white flex justify-between items-center">
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={adicionarAcao}>Adicionar</button>
            </div>

            {carteira.length === 0 && <p className="text-gray-600">Nenhum ativo na carteira.</p>}

            <ul className="space-y-2">
              {carteira.map((acao, index) => (
                <li key={index} className={`flex justify-between items-center p-2 rounded shadow ${acao.nome.includes("FII") ? "bg-yellow-100 text-gray-800" : "bg-white text-gray-900"}`}>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">
                      {acao.nome} • Qt:
                      <input type="number" min="1" step="1" value={acao.qtComprada} onChange={(e) => atualizarQt(index, parseInt(e.target.value))} className="ml-1 w-16 p-1 border rounded" />
                      • Dt: {acao.dtCompra}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={acao.monitorar} onChange={() => toggleMonitorar(index)} />
                      Monitorar
                    </label>
                    <button className="text-red-500 font-bold" onClick={() => removerAcao(index)}>✕</button>
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
