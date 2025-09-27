import React, { useEffect, useState } from "react";

function CotacoesPWA({ carteira }) {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (carteira.length === 0) {
          setDados([]);
          return;
        }
        const tickers = carteira.map(a => a.nome).join(",");
        const res = await fetch(`https://brapi.dev/api/quote/${tickers}`);
        const data = await res.json();
        setDados(data.results || []);
      } catch (err) {
        console.error("Erro ao buscar cotações:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [carteira]);

  if (carteira.length === 0) {
    return <p className="text-center text-gray-600">Nenhuma ação adicionada para monitorar.</p>;
  }

  if (!dados || dados.length === 0) {
    return <p className="text-center text-gray-600">Carregando cotações...</p>;
  }

  return (
    <div className="p-4 flex flex-wrap gap-4 justify-center">
      {dados.map((stock) => {
        const isPositive = stock.regularMarketChange >= 0;
        const changeClass = isPositive ? "text-green-600" : "text-red-600";
        const changeSign = isPositive ? "+" : "";

        return (
          <div
            key={stock.symbol}
            className="bg-white shadow-md rounded-xl p-4 w-64 hover:scale-105 transition-transform flex flex-col items-center"
          >
            <img
              src={stock.logourl}
              alt={stock.symbol}
              className="w-14 h-14 mb-2"
            />
            <div className="text-center font-bold text-lg">{stock.shortName}</div>
            <div className="text-center text-2xl font-semibold mt-1">
              R$ {stock.regularMarketPrice.toFixed(2)}
            </div>
            <div className={`text-center font-medium ${changeClass}`}>
              {changeSign}{stock.regularMarketChange.toFixed(2)} ({changeSign}{stock.regularMarketChangePercent.toFixed(2)}%)
            </div>
            <div className="text-sm mt-3 w-full text-left space-y-1">
              <div><strong>Máx/Dia:</strong> R$ {stock.regularMarketDayHigh.toFixed(2)}</div>
              <div><strong>Mín/Dia:</strong> R$ {stock.regularMarketDayLow.toFixed(2)}</div>
              <div><strong>P/L:</strong> {stock.priceEarnings.toFixed(2)}</div>
              <div><strong>EPS:</strong> {stock.earningsPerShare.toFixed(2)}</div>
              <div><strong>Volume:</strong> {stock.regularMarketVolume.toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CotacoesPWA;
