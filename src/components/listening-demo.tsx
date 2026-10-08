"use client";

import { useState } from "react";
import { Arrow } from "./arrow";

const ideas = [
  { id: "learning", label: "Aprendizagem", title: "Mais espaço para estudar?", origin: "Uma ideia de estudante", question: "E se houvesse um lugar tranquilo para estudar ou tirar dúvidas entre as aulas?", feedback: "Em quais horários esse espaço faria diferença?", next: "Ouvir as turmas, testar o formato e avaliar juntos." },
  { id: "spaces", label: "Espaços", title: "Um pátio melhor para todos?", origin: "Uma ideia da comunidade", question: "Como os espaços comuns poderiam ser mais acolhedores e acessíveis?", feedback: "Qual mudança seria mais útil no dia a dia?", next: "Mapear prioridades e combinar um próximo passo viável." },
  { id: "recess", label: "Recreio", title: "Mais opções para o recreio?", origin: "Um exemplo de proposta", question: "Que tal ter jogos para juntar a turma no intervalo?", feedback: "Quais jogos cabem no tempo e no espaço disponíveis?", next: "Testar uma opção no recreio e perguntar depois como foi." },
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
