"use client";

import { useState } from "react";
import { Arrow } from "./arrow";

const ideas = [
  { id: "music", label: "Música e encontros", title: "Uma trilha para o intervalo?", origin: "Uma ideia que poderia vir do GEF", question: "E se a gente experimentasse música em alguns recreios?", feedback: "O que você gostaria de ouvir? Em quais dias? Como preservar um espaço tranquilo para quem prefere silêncio?", next: "Ouvir diferentes preferências, testar um formato viável e perguntar depois como foi." },
  { id: "games", label: "Jogos e movimento", title: "Cabe uma partida no recreio?", origin: "Uma ideia que poderia vir dos alunos", question: "Que tal ter jogos para juntar a turma no intervalo?", feedback: "Quais jogos combinam com o tempo do recreio? O que ajudaria quem ainda não conhece ninguém a participar?", next: "Consultar os alunos, combinar materiais e espaço com o GEF e avaliar a experiência após o teste." },
  { id: "quiet", label: "Uma pausa tranquila", title: "Também vale desacelerar.", origin: "Uma experiência que poderia ser compartilhada", question: "E se eu só quiser um lugar tranquilo para conversar ou descansar?", feedback: "O que torna a pausa mais confortável? Há algo no recreio que dificulta esse momento?", next: "Entender as necessidades menos visíveis e considerar essas vozes no planejamento das atividades." },
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
