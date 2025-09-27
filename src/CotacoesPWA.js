import React, { useEffect, useState } from "react";

function CotacoesPWA() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://brapi.dev/api/quote/PETR4");
        const data = await res.json();
        setDados(data.results); // Pegando o array results
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();

    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!dados) {
    return <p>Carregando cotações...</p>;
  }

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
            <img src={stock.logourl} alt={stock.symbol} className="w-12 h-12 mx-auto mb-2" />
            <div className="text-center font-bold text-lg">{stock.shortName}</div>
            <div className="text-center text-2xl font-semibold">R$ {stock.regularMarketPrice.toFixed(2)}</div>
            <div className={`text-center ${changeClass}`}>
              {changeSign}{stock.regularMarketChange.toFixed(2)} ({changeSign}{stock.regularMarketChangePercent.toFixed(2)}%)
            </div>
            <div className="text-sm mt-2">
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
