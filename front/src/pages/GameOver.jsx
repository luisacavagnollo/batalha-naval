import { useNavigate, useSearchParams } from "react-router-dom";

export default function GameOver() {
  const [params] = useSearchParams();
  const winner = params.get("winner");
  const username = localStorage.getItem("username");
  const isVictory = winner === username;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <h1
        className={`text-5xl font-bold mb-4 ${isVictory ? "text-green-400" : "text-red-400"}`}
      >
        {isVictory ? " Vitória!" : " Derrota"}
      </h1>
      <p className="text-slate-300 mb-8">
        {isVictory
          ? "Você afundou todos os navios inimigos!"
          : `${winner} venceu a partida.`}
      </p>
      <button
        onClick={() => navigate("/lobby")}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
      >
        Jogar Novamente
      </button>
    </div>
  );
}
