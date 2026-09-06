"use client";

import { useState } from "react";
import { Arrow } from "./arrow";

const ideas = [
  { id: "music", label: "Música", title: "Uma trilha para o intervalo?", origin: "Uma ideia do GEF", question: "E se a gente experimentasse música em alguns recreios?", feedback: "O que você gostaria de ouvir? Em quais dias?", next: "Ouvir, testar e perguntar depois como foi." },
  { id: "games", label: "Jogos e movimento", title: "Cabe uma partida no recreio?", origin: "Uma ideia dos alunos", question: "Que tal ter jogos para juntar a turma no intervalo?", feedback: "Quais jogos cabem no tempo e no espaço do recreio?", next: "Combinar o teste, abrir para mais gente e avaliar juntos." },
  { id: "quiet", label: "Uma pausa", title: "Também vale desacelerar.", origin: "Uma experiência compartilhada", question: "E se eu só quiser um lugar tranquilo para conversar ou descansar?", feedback: "O que torna uma pausa mais confortável?", next: "Considerar também quem prefere desacelerar." },
];

export function ListeningDemo() {
  const [selected, setSelected] = useState(ideas[0]);
  return (
    <div className="demo">
      <div className="demo-options" role="group" aria-label="Escolha um exemplo de escuta">
        {ideas.map((idea) => (
          <button key={idea.id} type="button" aria-pressed={selected.id === idea.id} aria-controls="demo-result" onClick={() => setSelected(idea)}>
            <span>{idea.label}</span><Arrow />
          </button>
        ))}
      </div>
      <div className="demo-result" id="demo-result" aria-live="polite" aria-atomic="true">
        <div key={selected.id} className="demo-content">
          <h3>{selected.title}</h3>
          <p className="demo-origin">{selected.origin}</p>
          <p className="demo-question">“{selected.question}”</p>
          <div className="demo-followup"><h4>A conversa começa aqui</h4><p>{selected.feedback}</p></div>
          <div className="demo-next"><Arrow /><p>{selected.next}</p></div>
        </div>
      </div>
    </div>
  );
}
