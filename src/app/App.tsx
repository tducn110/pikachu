import { Game } from "./components/game/Game";
import { Dashboard } from "./components/dashboard/Dashboard";
import { MainLayout } from "./components/layout/MainLayout";

export default function App() {
  return (
    <MainLayout>
      <Game />
      <Dashboard />
    </MainLayout>
  );
}
