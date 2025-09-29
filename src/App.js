import React, { useState, useEffect } from "react";
import axios from "axios";
import cheerio from "cheerio";

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
          if (ativo.nome.endsWith("11")) {
            // Buscar preço real do FII no Google Finance
          //  const url = `https://www.google.com/finance/quote/${ativo.nome}:BVMF`;
          //  const res = await axios.get(url);
          //  const $ = cheerio.load(res.data);

            // Extrair preço atual do FII
         //     const priceText = $('div[data-last-price]').attr('data-last-price');
       //       const price = priceText ? parseFloat(priceText.replace(',', '.')) : null;
                
       //     resultados.push({
       //       symbol: ativo.nome,
       //       shortName: ativo.nome,
      //        regularMarketPrice: price,
     //         regularMarketChange: null,
      //        regularMarketChangePercent: null,
   //          regularMarketDayHigh: null,
    //          regularMarketDayLow: null,
    //          priceEarnings: null,
    //          earningsPerShare: null,
  //            regularMarketVolume: null,
    //          logourl: null,
  //          });
// Buscar preço real do FII no Google Finance
const url = `https://www.google.com/finance/quote/${ativo.nome}:BVMF`;

try {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  // Extrair preço atual do FII
  const priceText = $('div.YMlKec.fxKbKc').first().text().trim();

  // Se não encontrar preço, price será null
  const price = priceText
    ? parseFloat(
        priceText
          .replace('R$', '')     // Remove símbolo R$
          .replace(/\./g, '')    // Remove pontos de milhar
          .replace(',', '.')     // Troca vírgula decimal por ponto
          .trim()
      )
    : null;

  resultados.push({
    symbol: ativo.nome,
    shortName: ativo.nome,
    regularMarketPrice: price,
    regularMarketChange: null,
    regularMarketChangePercent: null,
    regularMarketDayHigh: null,
    regularMarketDayLow: null,
    priceEarnings: null,
    earningsPerShare: null,
    regularMarketVolume: null,
    logourl: null,
  });

} catch (error) {
  console.error(`Erro ao buscar preço para ${ativo.nome}:`, error);
  resultados.push({
    symbol: ativo.nome,
    shortName: ativo.nome,
    regularMarketPrice: null,
    regularMarketChange: null,
    regularMarketChangePercent: null,
    regularMarketDayHigh: null,
    regularMarketDayLow: null,
    priceEarnings: null,
    earningsPerShare: null,
    regularMarketVolume: null,
    logourl: null,
  });
}        
          } else {
            // Ações via brapi.dev
            const res = await axios.get(`https://brapi.dev/api/quote/${ativo.nome}`);
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

  if (dados.length === 0) return <p>Nenhuma cotação para mostrar.</p>;

  return (
    <div className="main-grid">
      {dados.map((stock) => {
        const changeClass = stock.regularMarketChange >= 0 ? "up" : "down";
        const changeSign = stock.regularMarketChange >= 0 ? "+" : "";

        return (
          <div key={stock.symbol} className="card">
            <img src={stock.logourl || "%PUBLIC_URL%/icon-192.png"} alt={stock.symbol} />
            <div className="name">{stock.shortName}</div>
            <div className="price">R$ {stock.regularMarketPrice?.toFixed(2)}</div>
            <div className={`change ${changeClass}`}>
              {stock.regularMarketChange != null &&
                `${changeSign}${stock.regularMarketChange?.toFixed(2)} (${changeSign}${stock.regularMarketChangePercent?.toFixed(2)}%)`}
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
          if (a.nome.endsWith("11")) {
            // Dividendos simulados para FIIs
            const dividendosSimulados = [
              { paymentDate: "2025-09-29", value: 0.50 },
              { paymentDate: "2025-10-30", value: 0.52 },
            ];

            dividendosSimulados.forEach(d => {
              const mes = new Date(d.paymentDate).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
              if (!dados[mes]) dados[mes] = [];
              dados[mes].push({
                ticker: a.nome,
                valor: (d.value * (a.qtComprada || 1)).toFixed(2),
                pagamento: d.paymentDate,
                isFII: true
              });
            });
          } else {
            const res = await axios.get(`https://brapi.dev/api/quote/${a.nome}?modules=dividends`);
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
              <li key={i} className={`border-b py-1 ${p.isFII ? "bg-yellow-100 text-gray-800" : "bg-white text-gray-900"}`}>
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
                <li key={index} className={`flex justify-between items-center p-2 rounded shadow ${acao.nome.endsWith("11") ? "bg-yellow-100 text-gray-800" : "bg-white text-gray-900"}`}>
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
