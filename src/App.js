import React, { useState, useEffect } from "react";
import axios from "axios";

function Cotacoes({ carteira }) {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!carteira.length) return;
        const tickers = carteira.map(a => a.nome).join(",");
        const res = await axios.get(`https://brapi.dev/api/quote/${tickers}`);
        setDados(res.data.results || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [carteira]);

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {dados.map((stock) => {
        const acao = carteira.find(a => a.nome === stock.symbol);
        const changeClass = stock.regularMarketChange >= 0 ? "text-green-600" : "text-red-600";
        const changeSign = stock.regularMarketChange >= 0 ? "+" : "";

        return (
          <div key={stock.symbol} className="bg-white shadow-md rounded-xl p-4 w-64">
            <img src={stock.logourl} alt={stock.symbol} className="w-12 h-12 mx-auto mb-2" />
            <div className="text-center font-bold text-lg">{stock.shortName}</div>
            <div className="text-center text-2xl font-semibold">R$ {stock.regularMarketPrice.toFixed(2)}</div>
            <div className={`text-center ${changeClass}`}>
              {changeSign}{stock.regularMarketChange.toFixed(2)} ({changeSign}{stock.regularMarketChangePercent.toFixed(2)}%)
            </div>
            <div className="text-sm mt-2 text-left">
              <div>QtComprada: {acao?.qtComprada || 0}</div>
              <div>Total Investido: R$ {acao ? (acao.qtComprada * stock.regularMarketPrice).toFixed(2) : "0.00"}</div>
              <div>Máx/Dia: R$ {stock.regularMarketDayHigh.toFixed(2)}</div>
              <div>Mín/Dia: R$ {stock.regularMarketDayLow.toFixed(2)}</div>
              <div>P/L: {stock.priceEarnings.toFixed(2)}</div>
              <div>EPS: {stock.earningsPerShare.toFixed(2)}</div>
              <div>Volume: {stock.regularMarketVolume.toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [aba, setAba] = useState("cotacoes");
  const [carteira, setCarteira] = useState([]);
  const [novaAcao, setNovaAcao] = useState("");
  const [qtComprada, setQtComprada] = useState("");
  const [dtCompra, setDtCompra] = useState("");
  const [monitora, setMonitora] = useState("SIM");

  // Adicionar ativo
  const adicionarAcao = () => {
    if (!novaAcao.trim()) return;
    setCarteira([
      ...carteira,
      {
        nome: novaAcao.trim().toUpperCase(),
        qtComprada: parseFloat(qtComprada) || 0,
        dtCompra: dtCompra || new Date().toISOString().split("T")[0],
        monitorar: monitora === "SIM"
      }
    ]);
    setNovaAcao("");
    setQtComprada("");
    setDtCompra("");
    setMonitora("SIM");
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

  // Proventos agrupados por mês
  const [divs, setDivs] = useState({});

  useEffect(() => {
    async function carregarProventos() {
      let dados = {};
      const monitorados = carteira.filter(a => a.monitorar);
      for (let a of monitorados) {
        try {
          const resp = await fetch(`https://brapi.dev/api/quote/${a.nome}?modules=dividends`);
          const json = await resp.json();
          if (json.results && json.results[0].dividendsData) {
            json.results[0].dividendsData.cashDividends.forEach((d) => {
              const mes = new Date(d.paymentDate).toLocaleDateString("pt-BR", {
                month: "2-digit",
                year: "numeric",
              });
              if (!dados[mes]) dados[mes] = [];
              dados[mes].push({
                ticker: a.nome,
                valor: (d.rate * a.qtComprada).toFixed(2),
                pagamento: d.paymentDate,
              });
            });
          }
        } catch (e) {
          console.warn("Erro ao buscar proventos", e);
        }
      }
      setDivs(dados);
    }

    if (carteira.length) carregarProventos();
  }, [carteira]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">NoralieInvest</h1>
        <nav className="flex gap-4">
          <button onClick={() => setAba("cotacoes")}>Cotações</button>
          <button onClick={() => setAba("carteira")}>Carteira</button>
          <button onClick={() => setAba("proventos")}>Proventos</button>
        </nav>
      </header>

      <main className="flex-1 p-4">
        {aba === "cotacoes" && <Cotacoes carteira={carteira.filter(a => a.monitorar)} />}

        {aba === "carteira" && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Adicionar Ativo</h2>
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                type="text"
                placeholder="Ativo (ex: MXRF11)"
                className="p-2 border rounded flex-1"
                value={novaAcao}
                onChange={(e) => setNovaAcao(e.target.value)}
              />
              <input
                type="number"
                placeholder="QtComprada"
                className="p-2 border rounded flex-1"
                value={qtComprada}
                onChange={(e) => setQtComprada(e.target.value)}
              />
              <input
                type="date"
                className="p-2 border rounded flex-1"
                value={dtCompra}
                onChange={(e) => setDtCompra(e.target.value)}
              />
              <select
                className="p-2 border rounded flex-1"
                value={monitora}
                onChange={(e) => setMonitora(e.target.value)}
              >
                <option value="SIM">SIM</option>
                <option value="NAO">NAO</option>
              </select>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={adicionarAcao}
              >
                Adicionar
              </button>
            </div>

            {carteira.length === 0 && <p className="text-gray-600">Nenhuma ação na carteira.</p>}

            <ul className="space-y-2 mt-4">
              {carteira.map((acao, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-white shadow rounded">
                  <span className="font-semibold">
                    {acao.nome} • Qt: {acao.qtComprada} • Dt: {acao.dtCompra} • Monitora: {acao.monitorar ? "SIM" : "NAO"}
                  </span>
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

        {aba === "proventos" && (
          <div className="space-y-4">
            {Object.keys(divs).length === 0 && <p className="text-gray-600">Nenhum provento encontrado.</p>}
            {Object.entries(divs).map(([mes, lista]) => (
              <div key={mes} className="mb-4 p-4 bg-white rounded shadow">
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
        )}
      </main>

      <footer className="text-sm text-gray-500 mt-4 p-2 border-t text-center">
        Desenvolvedor: Helquys Ande • +55 869 81250-154
      </footer>
    </div>
  );
}

export default App;
