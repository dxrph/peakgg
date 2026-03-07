import { createContext, useContext, useState, type ReactNode } from "react";
import { type GameId } from "./ranks";

interface GameContextType {
  selectedGame: GameId;
  setSelectedGame: (game: GameId) => void;
}

const GameContext = createContext<GameContextType>({ selectedGame: "valorant", setSelectedGame: () => {} });

export function GameProvider({ children }: { children: ReactNode }) {
  const [selectedGame, setSelectedGame] = useState<GameId>("valorant");
  return (
    <GameContext.Provider value={{ selectedGame, setSelectedGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
