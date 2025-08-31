import React from "react";
import { createRoot } from "react-dom/client";
import Projetos from "./components/Projetos";

function App() {
  return (
    <div>
      <h1>Sistema de Gestão</h1>
      <Projetos />
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
