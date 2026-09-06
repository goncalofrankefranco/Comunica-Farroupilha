"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "student" | "gef";
type View = "proposals" | "saved" | "agenda" | "chapas" | "notifications" | "gef";
type ProposalStatus = "received" | "analysis" | "development" | "scheduled" | "completed" | "archived";

type User = {
  id: string;
  name: string;
  turma: string;
  role: Role;
};

type Account = User & { password: string };

type Proposal = {
  id: string;
  title: string;
  body: string;
  author: string;
  authorId: string;
  anonymous: boolean;
  theme: string;
  status: ProposalStatus;
  supports: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  origin?: "student" | "gef";
  gefResponse?: string;
  gefResponseAt?: string;
};

type ProposalComment = {
  id: string;
  proposalId: string;
  author: string;
  authorId: string;
  role: Role;
  anonymous: boolean;
  body: string;
  createdAt: string;
  parentId?: string;
};

type Supporter = {
  id: string;
  name: string;
  turma: string;
};

type Activity = {
  id: string;
  proposalId: string;
  title: string;
  date: string;
  time: string;
  place: string;
  audience: string;
  status: "upcoming" | "done" | "cancelled";
};

type ActivityFeedbackRating = "great" | "good" | "ok" | "poor";

type ActivityFeedback = {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  turma: string;
  participated: boolean;
  reasonNotParticipated?: string;
  rating?: ActivityFeedbackRating;
  comment?: string;
  createdAt: string;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  activityId?: string;
};

type ChapaProposal = { area: string; title: string; detail: string };
type Chapa = { id: string; name: string; tagline: string; color: string; proposals: ChapaProposal[] };

type ChapaQuestion = {
  id: string;
  chapaId: string;
  proposalArea: string;
  proposalTitle?: string;
  question: string;
  author: string;
  authorId: string;
  turma: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
};

type DemoState = {
  user: User | null;
  accounts: Account[];
  proposals: Proposal[];
  comments: ProposalComment[];
  activities: Activity[];
  notifications: Notification[];
  supportedByUser: Record<string, string[]>;
  savedByUser: Record<string, string[]>;
  supporters: Record<string, Supporter[]>;
  activityFeedbacks: Record<string, ActivityFeedback[]>;
  chapaQuestions: ChapaQuestion[];
};

const THEMES = ["Esportes", "Jogos de mesa", "Música e cultura", "Convivência", "Descanso", "Outros"];
const CHAPA_AREAS = ["Esportes e movimento", "Cultura e música", "Convivência e descanso", "Participação"];

const STATUS: Record<ProposalStatus, { label: string; color: string; step: number }> = {
  received: { label: "Recebida", color: "#6c7d8c", step: 1 },
  analysis: { label: "Em análise", color: "#f07832", step: 2 },
  development: { label: "Em desenvolvimento", color: "#d99a18", step: 3 },
  scheduled: { label: "Agendada", color: "#e65b28", step: 4 },
  completed: { label: "Concluída", color: "#20805e", step: 5 },
  archived: { label: "Arquivada", color: "#526475", step: 1 },
};

const ICON_PATHS: Record<string, string[]> = {
  message: ["M4 5.5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4.5 3v-3H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z", "M7 11.5h.01M12 11.5h.01M17 11.5h.01"],
  calendar: ["M5 3v4M19 3v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z", "M7 13h3M14 13h3M7 17h3"],
  bell: ["M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 22h4"],
  search: ["m20 20-4.4-4.4M10.8 18a7.2 7.2 0 1 1 0-14.4A7.2 7.2 0 0 1 10.8 18Z"],
  plus: ["M12 5v14M5 12h14"],
  grid: ["M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"],
  thumbs: ["M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3ZM7 20h9.6a2 2 0 0 0 1.9-1.4l2.1-6A2 2 0 0 0 18.7 10H14l.7-3.2A2.3 2.3 0 0 0 12.5 4L7 10v10Z"],
  users: ["M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11a3.5 3.5 0 0 0 0-7M22 20v-1.5a4 4 0 0 0-3-3.8"],
  filter: ["M4 6h16M7 12h10M10 18h4"],
  arrow: ["M5 12h13M13 6l6 6-6 6"],
  check: ["m5 12 4 4L19 6"],
  close: ["m6 6 12 12M18 6 6 18"],
  chevron: ["m7 10 5 5 5-5"],
  bookmark: ["M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-3-6 3V4Z"],
  spark: ["M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"],
  logout: ["M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5M14 16l4-4-4-4M18 12H8"],
  info: ["M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
  refresh: ["M20 11a8 8 0 0 0-14.6-3L3 11M3 5v6h6M4 13a8 8 0 0 0 14.6 3L21 13M21 19v-6h-6"],
  star: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"],
  help: ["M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 15a1 1 0 1 1 1-1 1 1 0 0 1-1 1Zm1.5-6.5a1.5 1.5 0 0 0-1.5 1.5v.5h-2v-.5a3.5 3.5 0 1 1 5 3.15V13h-2v-.5a1.5 1.5 0 0 0-1-1Z"],
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths = ICON_PATHS[name] ?? ICON_PATHS.info;
  return (
    <svg aria-hidden="true" className="app-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((path, index) => <path key={`${name}-${index}`} d={path} />)}
    </svg>
  );
}

function Avatar({ name, role, small = false }: { name: string; role?: Role; small?: boolean }) {
  const initials = role === "gef" ? "GEF" : name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <span className={`avatar ${role === "gef" ? "avatar-gef" : ""} ${small ? "avatar-small" : ""}`} aria-hidden="true">{initials}</span>;
}

function StatusBadge({ status }: { status: ProposalStatus }) {
  const item = STATUS[status] ?? STATUS.received;
  return <span className="status-badge" style={{ color: item.color, backgroundColor: `${item.color}18` }}><span className="status-dot" style={{ backgroundColor: item.color }} />{item.label}</span>;
}

function ProgressSteps({ status }: { status: ProposalStatus }) {
  const active = STATUS[status]?.step ?? 1;
  const labels = ["Recebida", "Em análise", "Em desenvolvimento", "Agendada", "Concluída"];
  return (
    <div className="progress-steps" aria-label={`Situação: ${STATUS[status]?.label}`}>
      {labels.map((label, index) => {
        const step = index + 1;
        const done = step < active || status === "completed";
        const current = step === active && status !== "completed";
        return (
          <div className="progress-step" key={label}>
            <span className={`progress-circle ${done ? "is-done" : ""} ${current ? "is-current" : ""}`} style={done ? { backgroundColor: "#0758b1", borderColor: "#0758b1" } : current ? { borderColor: STATUS[status]?.color, color: STATUS[status]?.color } : undefined}>
              {done ? <Icon name="check" size={13} /> : current ? <span /> : null}
            </span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const seedProposals: Proposal[] = [
  { id: "p1", title: "Mais pontos de recarga USB nas áreas comuns", body: "Instalar pontos de recarga USB nas salas de estudo e na biblioteca para que todos possam carregar seus dispositivos durante o dia.", author: "Demonstração Estudante", authorId: "demo", anonymous: false, theme: "Outros", status: "analysis", supports: 14, comments: 2, createdAt: "Há 2 dias", updatedAt: "Há 1 dia", gefResponse: "Estamos levantando custos e locais viáveis junto à coordenação.", gefResponseAt: "Há 1 dia" },
  { id: "p2", title: "Torneio relâmpago de vôlei no recreio", body: "Organizar partidas curtas com inscrição simples e rodízio de times, para mais gente conseguir jogar durante o intervalo.", author: "Marina Costa", authorId: "marina", anonymous: false, theme: "Esportes", status: "development", supports: 22, comments: 4, createdAt: "Há 3 dias", updatedAt: "Há 4 horas", gefResponse: "Vamos testar a quadra menor no próximo recreio e ouvir quem participar.", gefResponseAt: "Há 1 dia" },
  { id: "p3", title: "Playlist colaborativa para os intervalos", body: "Criar uma playlist com sugestões dos estudantes e um horário de música escolhido pelo GEF.", author: "Estudante anônimo", authorId: "anonymous-3", anonymous: true, theme: "Música e cultura", status: "received", supports: 10, comments: 3, createdAt: "Há 5 dias", updatedAt: "Há 2 dias" },
  { id: "p4", title: "Espaço tranquilo para descansar", body: "Reservar uma área com bancos e sombra para quem prefere conversar ou descansar sem participar de uma atividade.", author: "João Pedro", authorId: "joao", anonymous: false, theme: "Descanso", status: "scheduled", supports: 18, comments: 5, createdAt: "Há 1 semana", updatedAt: "Há 1 dia", gefResponse: "Atividade agendada para terça no Pátio das Árvores.", gefResponseAt: "Há 1 dia" },
  { id: "p5", title: "Jogos de tabuleiro na biblioteca", body: "Disponibilizar jogos rápidos e um sistema de empréstimo durante os intervalos para criar novas opções de convivência.", author: "Estudante anônimo", authorId: "anonymous-5", anonymous: true, theme: "Jogos de mesa", status: "completed", supports: 26, comments: 6, createdAt: "Há 2 semanas", updatedAt: "Ontem", gefResponse: "Jogos implementados com sucesso e disponíveis no balcão da biblioteca.", gefResponseAt: "Ontem" },
  { id: "p6", title: "Oficina de desenho e colagem no pátio", body: "Montar uma mesa com materiais simples para quem quiser desenhar, criar colagens e compartilhar produções durante o recreio.", author: "Beatriz Lima", authorId: "bia", anonymous: false, theme: "Música e cultura", status: "analysis", supports: 12, comments: 2, createdAt: "Há 4 dias", updatedAt: "Há 6 horas" },
  { id: "p7", title: "Caixa de trocas de livros e revistas", body: "Criar um ponto de troca voluntária para renovar as leituras e descobrir histórias diferentes sem precisar levar um livro novo.", author: "Estudante anônimo", authorId: "anonymous-7", anonymous: true, theme: "Convivência", status: "received", supports: 9, comments: 1, createdAt: "Há 6 dias", updatedAt: "Há 3 dias" },
  { id: "p8", title: "Desafio de xadrez relâmpago", body: "Organizar partidas de até dez minutos com um quadro de inscrições aberto a iniciantes e a quem já joga.", author: "Rafael Mendes", authorId: "rafael", anonymous: false, theme: "Jogos de mesa", status: "received", supports: 16, comments: 2, createdAt: "Há 8 dias", updatedAt: "Há 2 dias" },
];

const seedComments: ProposalComment[] = [
  { id: "c1", proposalId: "p1", author: "Demonstração Estudante", authorId: "demo", role: "student", anonymous: false, body: "Ótima ideia! Isso ajudaria muito durante os trabalhos em grupo.", createdAt: "Há 1 dia" },
  { id: "c2", proposalId: "p1", author: "GEF", authorId: "admin", role: "gef", anonymous: false, body: "Estamos levantando custos e locais viáveis. Seguimos em análise e traremos novidades em breve.", createdAt: "Há 1 dia" },
  { id: "c3", proposalId: "p2", author: "Lívia", authorId: "livia", role: "student", anonymous: false, body: "Dá para usar a quadra menor para não atrapalhar quem está passando?", createdAt: "Há 2 dias" },
  { id: "c4", proposalId: "p2", author: "GEF", authorId: "admin", role: "gef", anonymous: false, body: "Sim. Vamos testar a quadra menor no próximo recreio e ouvir quem participar.", createdAt: "Há 1 dia" },
  { id: "c5", proposalId: "p3", author: "Demonstração", authorId: "demo", role: "student", anonymous: false, body: "Também seria legal ter uma opção mais calma para estudar.", createdAt: "Há 3 dias" },
  { id: "c6", proposalId: "p6", author: "Caio", authorId: "caio", role: "student", anonymous: false, body: "Podemos deixar a mesa perto da biblioteca para proteger os materiais do vento?", createdAt: "Há 1 dia" },
  { id: "c7", proposalId: "p6", author: "GEF", authorId: "admin", role: "gef", anonymous: false, body: "Boa sugestão. Vamos testar um espaço coberto e uma lista curta de materiais.", createdAt: "Há 10 horas" },
  { id: "c8", proposalId: "p7", author: "Nina", authorId: "nina", role: "student", anonymous: false, body: "Adorei a ideia para os dias de chuva também.", createdAt: "Há 2 dias" },
  { id: "c9", proposalId: "p8", author: "GEF", authorId: "admin", role: "gef", anonymous: false, body: "Vamos buscar tabuleiros e testar partidas curtas no próximo ciclo.", createdAt: "Ontem" },
  { id: "c10", proposalId: "p8", author: "Léo", authorId: "leo", role: "student", anonymous: false, body: "Seria legal ter uma mesa para quem está aprendendo.", createdAt: "Há 2 dias" },
];

const seedActivities: Activity[] = [
  { id: "a1", proposalId: "p4", title: "Teste do espaço tranquilo", date: "2026-09-08", time: "10:15–10:35", place: "Pátio das árvores", audience: "Todas as turmas", status: "upcoming" },
];

const defaultState: DemoState = {
  user: null,
  accounts: [
    { id: "demo", name: "Demonstração", turma: "Turma A — demonstração", role: "student", password: "demo1234" },
    { id: "admin", name: "administrador", turma: "GEF", role: "gef", password: "admteste123" },
  ],
  proposals: seedProposals,
  comments: seedComments,
  activities: seedActivities,
  notifications: [
    { id: "n1", title: "Nova atividade no recreio", body: "O teste do espaço tranquilo acontece na terça, no Pátio das árvores.", createdAt: "Há 2 horas", read: false, activityId: "a1" },
    { id: "n2", title: "Uma proposta recebeu resposta", body: "O GEF comentou a proposta de pontos de recarga USB.", createdAt: "Ontem", read: false },
    { id: "n3", title: "A proposta está em análise", body: "A proposta de pontos de recarga avançou de etapa.", createdAt: "Há 2 dias", read: false },
  ],
  supportedByUser: {
    demo: ["p1", "p3"],
  },
  savedByUser: {
    demo: ["p2"],
  },
  supporters: {
    p1: [{ id: "marina", name: "Marina Costa", turma: "8º ano" }, { id: "joao", name: "João Pedro", turma: "1º EM" }, { id: "livia", name: "Lívia", turma: "9º ano" }],
    p2: [{ id: "bia", name: "Beatriz Lima", turma: "8º ano" }, { id: "rafael", name: "Rafael Mendes", turma: "2º EM" }, { id: "nina", name: "Nina", turma: "7º ano" }],
    p3: [{ id: "caio", name: "Caio", turma: "9º ano" }, { id: "leo", name: "Léo", turma: "1º EM" }],
    p4: [{ id: "marina", name: "Marina Costa", turma: "8º ano" }, { id: "nina", name: "Nina", turma: "7º ano" }],
    p5: [{ id: "joao", name: "João Pedro", turma: "1º EM" }, { id: "bia", name: "Beatriz Lima", turma: "8º ano" }, { id: "caio", name: "Caio", turma: "9º ano" }],
    p6: [{ id: "livia", name: "Lívia", turma: "9º ano" }, { id: "leo", name: "Léo", turma: "1º EM" }],
    p7: [{ id: "nina", name: "Nina", turma: "7º ano" }],
    p8: [{ id: "marina", name: "Marina Costa", turma: "8º ano" }, { id: "caio", name: "Caio", turma: "9º ano" }],
  },
  activityFeedbacks: {
    a1: [
      { id: "af-1", activityId: "a1", userId: "marina", userName: "Marina Costa", turma: "8º ano", participated: true, rating: "great", comment: "Foi muito bom ter um lugar silencioso com sombra!", createdAt: "Há 1 hora" },
      { id: "af-2", activityId: "a1", userId: "rafael", userName: "Rafael Mendes", turma: "2º EM", participated: false, reasonNotParticipated: "Estava estudando para prova no intervalo", comment: "Gostei da iniciativa, pretendo ir no próximo.", createdAt: "Há 30 min" },
    ],
  },
  chapaQuestions: [
    {
      id: "cq-1",
      chapaId: "chapa-1",
      proposalArea: "Esportes e movimento",
      proposalTitle: "Circuito de jogos rápidos",
      question: "Como será feita a divisão dos horários entre as turmas do Fundamental e Médio?",
      author: "Caio",
      authorId: "caio",
      turma: "9º ano",
      answer: "Haverá revezamento por dias da semana: segundas e quartas para Fundamental, terças e quintas para Médio, e sextas aberto a todos.",
      answeredBy: "Chapa 1",
      answeredAt: "Há 1 dia",
      createdAt: "Há 2 dias",
    },
    {
      id: "cq-2",
      chapaId: "chapa-2",
      proposalArea: "Cultura e música",
      proposalTitle: "Rádio do intervalo",
      question: "Quem vai escolher as músicas da rádio para garantir que não haja músicas inadequadas?",
      author: "Lívia",
      authorId: "livia",
      turma: "9º ano",
      answer: "Teremos uma comissão mista de alunos representantes e o GEF com formulário aberto e diretrizes de respeito mútuo.",
      answeredBy: "Chapa 2",
      answeredAt: "Ontem",
      createdAt: "Há 1 dia",
    },
  ],
};

const seedChapas: Chapa[] = [
  { id: "chapa-1", name: "Chapa 1", tagline: "Mais opções para cada jeito de viver o intervalo.", color: "#0758b1", proposals: [
    { area: CHAPA_AREAS[0], title: "Circuito de jogos rápidos", detail: "Rodízio de modalidades curtas em dias combinados com as turmas." },
    { area: CHAPA_AREAS[1], title: "Palco aberto", detail: "Espaço para apresentações voluntárias de música, poesia e dança." },
    { area: CHAPA_AREAS[2], title: "Pátio de convivência", detail: "Mais bancos, sombra e jogos tranquilos em uma área sinalizada." },
    { area: CHAPA_AREAS[3], title: "Calendário construído com as turmas", detail: "Encontros mensais para acompanhar propostas e devolver decisões." },
  ] },
  { id: "chapa-2", name: "Chapa 2", tagline: "Um recreio ativo, criativo e aberto a novas ideias.", color: "#f45a1a", proposals: [
    { area: CHAPA_AREAS[0], title: "Desafio recreativo semanal", detail: "Atividades inclusivas com inscrição simples e participação por rodízio." },
    { area: CHAPA_AREAS[1], title: "Rádio do intervalo", detail: "Seleção musical sugerida pelos estudantes em horários definidos." },
    { area: CHAPA_AREAS[2], title: "Estações de descanso", detail: "Cantinhos com leitura, conversa e jogos de mesa para diferentes ritmos." },
    { area: CHAPA_AREAS[3], title: "Mural de acompanhamento", detail: "Atualizações públicas sobre cada proposta e seus próximos passos." },
  ] },
];

function authorLabel(proposal: Proposal) {
  if (proposal.origin === "gef") return "Grêmio Estudantil Farroupilha";
  return proposal.anonymous ? "Estudante anônimo" : proposal.author;
}

function ChapasView({
  questions,
  isGef,
  onAskQuestion,
  onAnswerQuestion,
}: {
  questions: ChapaQuestion[];
  isGef: boolean;
  onAskQuestion: (chapaId: string, area: string, title: string, question: string) => Promise<void>;
  onAnswerQuestion: (questionId: string, answer: string) => Promise<void>;
}) {
  const [chapaId, setChapaId] = useState(seedChapas[0].id);
  const [area, setArea] = useState("Todas");
  const [activeQuestionForm, setActiveQuestionForm] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [busy, setBusy] = useState(false);

  const chapa = seedChapas.find((item) => item.id === chapaId) ?? seedChapas[0];
  const proposals = chapa.proposals.filter((proposal) => area === "Todas" || proposal.area === area);

  async function handleAsk(proposalTitle: string, proposalArea: string) {
    if (questionText.trim().length < 5) return;
    setBusy(true);
    await onAskQuestion(chapa.id, proposalArea, proposalTitle, questionText.trim());
    setQuestionText("");
    setActiveQuestionForm(null);
    setBusy(false);
  }

  async function handleAnswer(qId: string) {
    if (answerText.trim().length < 2) return;
    setBusy(true);
    await onAnswerQuestion(qId, answerText.trim());
    setAnswerText("");
    setAnsweringId(null);
    setBusy(false);
  }

  return (
    <section className="page-section chapas-page">
      <div className="content-heading">
        <div>
          <span className="eyebrow">PROPOSTAS ORGANIZADAS</span>
          <h2>Propostas das chapas</h2>
          <p>Consulte os compromissos por área em uma apresentação informativa, sem ordem de preferência e com espaço para dúvidas.</p>
        </div>
      </div>
      <div className="chapa-tabs" role="tablist" aria-label="Selecionar chapa">
        {seedChapas.map((item) => (
          <button key={item.id} role="tab" aria-selected={item.id === chapa.id} className={item.id === chapa.id ? "active" : ""} style={{ "--chapa-color": item.color } as React.CSSProperties} onClick={() => setChapaId(item.id)}>
            {item.name}
          </button>
        ))}
      </div>
      <div className="chapa-toolbar">
        <label>
          <span>Área</span>
          <select value={area} onChange={(event) => setArea(event.target.value)}>
            <option>Todas</option>
            {CHAPA_AREAS.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Icon name="chevron" size={14} />
        </label>
        <span className="chapa-count">{proposals.length} {proposals.length === 1 ? "proposta" : "propostas"}</span>
      </div>
      <article className="chapa-profile" style={{ "--chapa-color": chapa.color } as React.CSSProperties}>
        <div className="chapa-profile-mark">{chapa.name.replace("Chapa ", "").slice(0, 1)}</div>
        <div>
          <h3>{chapa.name}</h3>
          <p>{chapa.tagline}</p>
        </div>
      </article>
      <div className="chapa-proposal-list">
        {proposals.map((proposal) => {
          const proposalQuestions = questions.filter((q) => q.chapaId === chapa.id && q.proposalArea === proposal.area && (!q.proposalTitle || q.proposalTitle === proposal.title));
          const isAsking = activeQuestionForm === proposal.title;
          return (
            <article className="chapa-proposal" key={`${chapa.id}-${proposal.area}-${proposal.title}`}>
              <div className="chapa-proposal-top">
                <span className="chapa-area">{proposal.area}</span>
                <span className="chapa-q-count"><Icon name="message" size={14} /> {proposalQuestions.length} dúvidas</span>
              </div>
              <h3>{proposal.title}</h3>
              <p>{proposal.detail}</p>

              <div className="chapa-proposal-actions">
                <button type="button" className="text-action chapa-action-btn" onClick={() => setActiveQuestionForm(isAsking ? null : proposal.title)}>
                  <Icon name="help" size={15} /> {isAsking ? "Fechar dúvidas" : "Tirar dúvida ou ver respostas"}
                </button>
              </div>

              {isAsking && (
                <div className="chapa-doubts-panel">
                  <h4>Dúvidas sobre esta proposta</h4>
                  <div className="doubts-list">
                    {proposalQuestions.map((q) => (
                      <div className="doubt-item" key={q.id}>
                        <div className="doubt-author">
                          <strong>{q.author}</strong> <small>({q.turma}) · {q.createdAt}</small>
                        </div>
                        <p className="doubt-text">{q.question}</p>
                        {q.answer ? (
                          <div className="doubt-answer">
                            <span className="mini-label">RESPOSTA DA CHAPA ({q.answeredBy ?? "Chapa"})</span>
                            <p>{q.answer}</p>
                            <small>{q.answeredAt}</small>
                          </div>
                        ) : isGef ? (
                          <div className="doubt-reply-form">
                            {answeringId === q.id ? (
                              <div className="reply-box">
                                <textarea placeholder="Escreva a resposta da chapa..." value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={2} />
                                <div className="reply-actions">
                                  <button type="button" className="secondary-button" onClick={() => setAnsweringId(null)}>Cancelar</button>
                                  <button type="button" className="primary-button" disabled={busy || answerText.trim().length < 2} onClick={() => handleAnswer(q.id)}>Publicar resposta</button>
                                </div>
                              </div>
                            ) : (
                              <button type="button" className="outline-button reply-btn" onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}>
                                Responder dúvida
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="doubt-waiting">Aguardando resposta da chapa.</p>
                        )}
                      </div>
                    ))}
                    {proposalQuestions.length === 0 && <p className="empty-copy">Nenhuma dúvida registrada ainda. Seja a primeira pessoa a perguntar.</p>}
                  </div>

                  {!isGef && (
                    <div className="ask-box">
                      <textarea placeholder="Escreva sua dúvida com clareza e respeito..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={2} maxLength={300} />
                      <button type="button" className="primary-button ask-submit" disabled={busy || questionText.trim().length < 5} onClick={() => handleAsk(proposal.title, proposal.area)}>
                        Enviar dúvida <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {proposals.length === 0 && (
          <div className="empty-state">
            <Icon name="filter" size={25} />
            <h3>Nenhuma proposta nessa área</h3>
            <p>Selecione outra área para continuar a consulta.</p>
          </div>
        )}
      </div>
      <div className="neutral-note">
        <Icon name="info" size={17} />
        <p>As propostas aparecem com o mesmo espaço e sem pontuação. Estudantes podem enviar dúvidas para obter esclarecimentos diretamente com as chapas.</p>
      </div>
    </section>
  );
}

function ProposalCard({
  proposal,
  selected,
  supported,
  saved,
  isGef,
  onSelect,
  onSupport,
  onSave,
  onStatus,
}: {
  proposal: Proposal;
  selected: boolean;
  supported: boolean;
  saved: boolean;
  isGef: boolean;
  onSelect: () => void;
  onSupport: () => void;
  onSave: () => void;
  onStatus: (status: ProposalStatus) => void;
}) {
  return (
    <article className={`proposal-card ${selected ? "is-selected" : ""}`}>
      <button className="proposal-card-main" onClick={onSelect} aria-expanded={selected}>
        <div className="proposal-card-top">
          <StatusBadge status={proposal.status} />
          {proposal.origin === "gef" && <span className="gef-origin-tag"><Icon name="spark" size={13} /> Consulta do GEF</span>}
          <span className="card-date">{proposal.createdAt}</span>
        </div>
        <div className="proposal-card-heading">
          <div>
            <h3>{proposal.title}</h3>
            <p>{proposal.body}</p>
          </div>
          {selected && <ProgressSteps status={proposal.status} />}
        </div>
        <div className="proposal-card-meta">
          <span className="author-meta">
            <Avatar name={proposal.origin === "gef" ? "GEF" : proposal.anonymous ? "EA" : proposal.author} role={proposal.origin === "gef" ? "gef" : undefined} small />
            <span>
              <strong>{authorLabel(proposal)}</strong>
              <small>{proposal.anonymous ? "Autoria preservada" : `${proposal.updatedAt} · ${proposal.theme}`}</small>
            </span>
          </span>
          <span className="support-count"><Icon name="users" size={19} /><span><strong>{proposal.supports}</strong><small>Apoios</small></span></span>
          <span className="comment-count"><Icon name="message" size={18} /> {proposal.comments}</span>
          <span className={`support-button ${supported ? "is-supported" : ""}`} role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onSupport(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSupport(); } }}>
            <Icon name="thumbs" size={18} />{supported ? "Apoiado" : "Apoiar"}
          </span>
          <button type="button" className={`save-button ${saved ? "is-saved" : ""}`} aria-label={saved ? "Remover proposta dos acompanhados" : "Acompanhar proposta"} title={saved ? "Acompanhando proposta" : "Acompanhar proposta"} onClick={(event) => { event.stopPropagation(); onSave(); }}>
            <Icon name="bookmark" size={18} />
          </button>
        </div>
      </button>

      {isGef && selected && (
        <div className="gef-card-actions">
          <span className="admin-note"><Icon name="spark" size={15} /> Ações do GEF</span>
          {proposal.status === "received" && <button onClick={() => onStatus("analysis")}>Enviar para análise <Icon name="arrow" size={15} /></button>}
          {proposal.status === "analysis" && <button onClick={() => onStatus("development")}>Selecionar para desenvolvimento <Icon name="arrow" size={15} /></button>}
          {proposal.status === "development" && <button onClick={() => onStatus("scheduled")}>Marcar como agendada <Icon name="arrow" size={15} /></button>}
          {proposal.status === "scheduled" && <button onClick={() => onStatus("completed")}>Marcar como concluída <Icon name="arrow" size={15} /></button>}
          {proposal.status !== "archived" && <button onClick={() => onStatus("archived")} className="archive-btn">Arquivar <Icon name="close" size={14} /></button>}
        </div>
      )}
    </article>
  );
}

function CommentThread({
  comments,
  proposalId,
  user,
  onComment,
}: {
  comments: ProposalComment[];
  proposalId: string;
  user: User;
  onComment: (body: string, anonymous: boolean, parentId?: string) => void;
}) {
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const roots = comments.filter((comment) => comment.proposalId === proposalId && !comment.parentId);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length < 3) return;
    onComment(body.trim(), anonymous);
    setBody("");
    setAnonymous(false);
  }

  return (
    <section className="comments-section" aria-labelledby="comments-title">
      <div className="comments-heading">
        <h3 id="comments-title">Comentários ({comments.filter((comment) => comment.proposalId === proposalId).length})</h3>
        <span>Conversa aberta para a comunidade</span>
      </div>
      <div className="comment-list">
        {roots.map((comment) => (
          <div className="comment-group" key={comment.id}>
            <div className={`comment ${comment.role === "gef" ? "comment-gef" : ""}`}>
              <Avatar name={comment.anonymous ? "EA" : comment.author} role={comment.role} />
              <div className="comment-content">
                <div className="comment-byline">
                  <strong>{comment.anonymous ? "Estudante anônimo" : comment.author}</strong>
                  {comment.role === "gef" && <span className="gef-tag">Equipe do Grêmio</span>}
                  <small>{comment.createdAt}</small>
                </div>
                <p>{comment.body}</p>
                <button className="reply-link" onClick={() => setBody(`@${comment.anonymous ? "estudante" : comment.author} `)}>
                  Responder <span><Icon name="thumbs" size={14} /> 1</span>
                </button>
              </div>
            </div>
            {comments.filter((reply) => reply.parentId === comment.id).map((reply) => (
              <div className="comment comment-reply" key={reply.id}>
                <Avatar name={reply.author} role={reply.role} small />
                <div className="comment-content">
                  <div className="comment-byline">
                    <strong>{reply.author}</strong>
                    <small>{reply.createdAt}</small>
                  </div>
                  <p>{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
        {roots.length === 0 && <p className="empty-copy">Ainda não há comentários. Comece a conversa.</p>}
      </div>
      <form className="comment-composer" onSubmit={submit}>
        <Avatar name={user.name} role={user.role} small />
        <div className="composer-input">
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Compartilhe uma ideia ou responda à conversa…" rows={2} maxLength={1000} />
          <div className="composer-footer">
            <label><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> Comentar anonimamente</label>
            <button type="submit" disabled={body.trim().length < 3}>Comentar <Icon name="arrow" size={15} /></button>
          </div>
        </div>
      </form>
    </section>
  );
}

function SupportersPanel({ supporters = [], total }: { supporters?: Supporter[]; total: number }) {
  const visible = supporters.slice(0, 4);
  const remaining = Math.max(0, total - visible.length);
  return (
    <aside className="supporters-card" aria-label="Pessoas que apoiaram esta proposta">
      <div className="supporters-head">
        <span className="how-icon"><Icon name="users" size={19} /></span>
        <div>
          <h3>Quem apoiou</h3>
          <p>{total} {total === 1 ? "apoio" : "apoios"} da comunidade</p>
        </div>
      </div>
      <ul className="supporter-list">
        {visible.map((supporter) => (
          <li key={supporter.id}>
            <Avatar name={supporter.name} small />
            <span><strong>{supporter.name}</strong><small>{supporter.turma}</small></span>
          </li>
        ))}
        {remaining > 0 && (
          <li className="supporter-more">
            <span className="supporter-more-count">+{remaining}</span>
            <span><strong>Outras pessoas</strong><small>apoios registrados</small></span>
          </li>
        )}
        {visible.length === 0 && <li className="supporters-empty">Seja a primeira pessoa a apoiar.</li>}
      </ul>
    </aside>
  );
}

function ProposalDetail({
  proposal,
  comments,
  supporters,
  user,
  isGef,
  onComment,
  onSubmitGefResponse,
}: {
  proposal: Proposal;
  comments: ProposalComment[];
  supporters: Supporter[];
  user: User;
  isGef: boolean;
  onComment: (body: string, anonymous: boolean, parentId?: string) => void;
  onSubmitGefResponse?: (id: string, response: string) => Promise<void>;
}) {
  const [showGefReply, setShowGefReply] = useState(true);
  const [editingGefResponse, setEditingGefResponse] = useState(false);
  const [gefResponseText, setGefResponseText] = useState(proposal.gefResponse ?? "");
  const [savingResponse, setSavingResponse] = useState(false);

  const gefReplies = comments.filter((comment) => comment.proposalId === proposal.id && comment.role === "gef");
  const latestGefReply = gefReplies[gefReplies.length - 1];

  async function handleSaveGefResponse() {
    if (!onSubmitGefResponse || !gefResponseText.trim()) return;
    setSavingResponse(true);
    await onSubmitGefResponse(proposal.id, gefResponseText.trim());
    setSavingResponse(false);
    setEditingGefResponse(false);
  }

  return (
    <div className="detail-grid">
      <CommentThread comments={comments} proposalId={proposal.id} user={user} onComment={onComment} />
      <div className="detail-side">
        <SupportersPanel supporters={supporters} total={proposal.supports} />
        <aside className="how-card">
          <span className="how-icon"><Icon name="info" size={22} /></span>
          <h3>{isGef ? "Visão do GEF" : "Como funciona?"}</h3>
          <p>{isGef ? "Acompanhe a conversa, dê um retorno e mova a ideia para o próximo passo." : "As propostas são analisadas pelo GEF e podem virar atividades no recreio."}</p>

          {proposal.gefResponse && (
            <div className="gef-response-preview">
              <span className="mini-label">RESPOSTA E JUSTIFICATIVA DO GEF</span>
              <p>{proposal.gefResponse}</p>
              <small>{proposal.gefResponseAt}</small>
            </div>
          )}

          {isGef && onSubmitGefResponse && (
            <div className="gef-response-manager">
              {editingGefResponse ? (
                <div className="response-editor">
                  <textarea value={gefResponseText} onChange={(e) => setGefResponseText(e.target.value)} placeholder="Escreva a resposta ou justificativa oficial do GEF..." rows={3} />
                  <div className="editor-actions">
                    <button type="button" className="secondary-button" onClick={() => setEditingGefResponse(false)}>Cancelar</button>
                    <button type="button" className="primary-button" disabled={savingResponse || !gefResponseText.trim()} onClick={handleSaveGefResponse}>Salvar resposta</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="outline-button edit-response-btn" onClick={() => { setGefResponseText(proposal.gefResponse ?? ""); setEditingGefResponse(true); }}>
                  <Icon name="spark" size={14} /> {proposal.gefResponse ? "Editar resposta do GEF" : "Publicar resposta oficial"}
                </button>
              )}
            </div>
          )}

          {!proposal.gefResponse && (
            <>
              <button type="button" className="learn-more-button" onClick={() => setShowGefReply((current) => !current)}>
                {showGefReply ? "Ocultar comentários do GEF" : "Ver comentários do GEF"} <Icon name="arrow" size={14} />
              </button>
              {showGefReply && (
                <div className="gef-response-preview">
                  <span className="mini-label">ÚLTIMO RETORNO DO GEF</span>
                  <p>{latestGefReply?.body ?? "O GEF ainda não respondeu esta proposta. Acompanhe os comentários para ver as próximas atualizações."}</p>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function ProposalPreview({
  proposal,
  comments,
  supporters,
  user,
  isGef,
  supported,
  saved,
  onSupport,
  onSave,
  onStatus,
  onComment,
  onSubmitGefResponse,
  onClose,
}: {
  proposal: Proposal;
  comments: ProposalComment[];
  supporters: Supporter[];
  user: User;
  isGef: boolean;
  supported: boolean;
  saved: boolean;
  onSupport: () => void;
  onSave: () => void;
  onStatus: (status: ProposalStatus) => void;
  onComment: (body: string, anonymous: boolean, parentId?: string) => void;
  onSubmitGefResponse?: (id: string, response: string) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <section className="context-proposal" aria-labelledby={`context-proposal-${proposal.id}`}>
      <div className="context-proposal-head">
        <div>
          <span className="eyebrow">PROPOSTA SELECIONADA</span>
          <h3 id={`context-proposal-${proposal.id}`}>{proposal.title}</h3>
          <p>{proposal.body}</p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar visualização da proposta"><Icon name="close" size={19} /></button>
      </div>
      <div className="context-proposal-meta">
        <StatusBadge status={proposal.status} />
        {proposal.origin === "gef" && <span className="gef-origin-tag"><Icon name="spark" size={13} /> Consulta do GEF</span>}
        <span>{proposal.theme}</span>
        <span>{proposal.supports} apoios</span>
        <span>{proposal.comments} comentários</span>
        <button type="button" className={`support-button ${supported ? "is-supported" : ""}`} onClick={onSupport}>
          <Icon name="thumbs" size={17} />{supported ? "Apoiado" : "Apoiar"}
        </button>
        <button type="button" className={`save-button ${saved ? "is-saved" : ""}`} onClick={onSave} aria-label={saved ? "Remover proposta dos acompanhados" : "Acompanhar proposta"}>
          <Icon name="bookmark" size={17} />{saved ? "Acompanhando" : "Acompanhar"}
        </button>
      </div>
      <ProposalDetail proposal={proposal} comments={comments} supporters={supporters} user={user} isGef={isGef} onComment={onComment} onSubmitGefResponse={onSubmitGefResponse} />
      {isGef && (
        <div className="context-proposal-actions">
          <span><Icon name="spark" size={15} /> Ações do GEF</span>
          {proposal.status === "received" && <button type="button" onClick={() => onStatus("analysis")}>Enviar para análise <Icon name="arrow" size={15} /></button>}
          {proposal.status === "analysis" && <button type="button" onClick={() => onStatus("development")}>Selecionar para desenvolvimento <Icon name="arrow" size={15} /></button>}
          {proposal.status === "development" && <button type="button" onClick={() => onStatus("scheduled")}>Marcar como agendada <Icon name="arrow" size={15} /></button>}
          {proposal.status === "scheduled" && <button type="button" onClick={() => onStatus("completed")}>Marcar como concluída <Icon name="arrow" size={15} /></button>}
          {proposal.status !== "archived" && <button type="button" onClick={() => onStatus("archived")}>Arquivar proposta</button>}
        </div>
      )}
    </section>
  );
}

function Composer({ user, onCancel, onCreate }: { user: User; onCancel: () => void; onCreate: (proposal: { title: string; body: string; theme: string; anonymous: boolean }) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);
  const [anonymous, setAnonymous] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (title.trim().length < 5 || body.trim().length < 20) return;
    onCreate({ title: title.trim(), body: body.trim(), anonymous, theme });
  }

  const isGef = user.role === "gef";

  return (
    <form className="composer-panel" onSubmit={submit}>
      <div className="composer-panel-head">
        <div>
          <span className="eyebrow">{isGef ? "CONSULTA À COMUNIDADE (GEF)" : "NOVA PROPOSTA"}</span>
          <h2>{isGef ? "Qual ideia você gostaria de consultar com os alunos?" : "O que você gostaria de mudar no recreio?"}</h2>
          <p>{isGef ? "Publique uma ideia ou teste de lazer para ouvir a comunidade escolar." : "Conte a experiência e sugira um próximo passo para a comunidade."}</p>
        </div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Fechar criação"><Icon name="close" size={20} /></button>
      </div>
      <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Mais jogos para jogar em grupo" maxLength={120} /></label>
      <label>Sua proposta<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="O que acontece hoje? Qual mudança você gostaria de experimentar?" rows={6} maxLength={3000} /></label>
      <div className="form-row">
        <label>Tema<select value={theme} onChange={(event) => setTheme(event.target.value)}>{THEMES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {!isGef ? (
          <label className="visibility-select">Autoria<select value={anonymous ? "anonymous" : "named"} onChange={(event) => setAnonymous(event.target.value === "anonymous")}><option value="named">Publicar com meu nome</option><option value="anonymous">Publicar anonimamente</option></select></label>
        ) : (
          <label>Autoria<input value="Grêmio Estudantil Farroupilha" disabled /></label>
        )}
      </div>
      <div className="composer-help">
        <Icon name="info" size={16} /> {isGef ? "Essa proposta será identificada como uma consulta oficial do GEF." : "Seu nome e sua turma ficam protegidos quando você escolhe publicar anonimamente."}
      </div>
      <div className="composer-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary-button" disabled={title.trim().length < 5 || body.trim().length < 20}>Publicar {isGef ? "consulta" : "proposta"} <Icon name="arrow" size={16} /></button>
      </div>
    </form>
  );
}

function ActivityFeedbackModal({
  activity,
  existingFeedback,
  onClose,
  onSubmit,
}: {
  activity: Activity;
  existingFeedback?: ActivityFeedback;
  onClose: () => void;
  onSubmit: (data: { participated: boolean; reasonNotParticipated?: string; rating?: ActivityFeedbackRating; comment?: string }) => Promise<void>;
}) {
  const [participated, setParticipated] = useState<boolean>(existingFeedback ? existingFeedback.participated : true);
  const [rating, setRating] = useState<ActivityFeedbackRating>(existingFeedback?.rating ?? "great");
  const [reason, setReason] = useState(existingFeedback?.reasonNotParticipated ?? "");
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [busy, setBusy] = useState(false);

  const REASONS = [
    "Estava estudando para prova/trabalho",
    "Preferi descansar ou ficar conversando",
    "Não fiquei sabendo da atividade a tempo",
    "O local ou a quadra estavam cheios",
    "Não tenho interesse nesta modalidade",
    "Outro motivo",
  ];

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await onSubmit({
      participated,
      reasonNotParticipated: !participated ? reason : undefined,
      rating: participated ? rating : undefined,
      comment: comment.trim() || undefined,
    });
    setBusy(false);
    onClose();
  }

  return (
    <div className="feedback-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div className="feedback-modal-card">
        <div className="feedback-modal-head">
          <div>
            <span className="eyebrow">AVALIAÇÃO PÓS-RECREIO</span>
            <h3 id="feedback-title">{activity.title}</h3>
            <p>{activity.date} · {activity.place}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><Icon name="close" size={18} /></button>
        </div>

        <form onSubmit={handleSend}>
          <div className="feedback-question">
            <label className="question-title">Você participou desta atividade no intervalo?</label>
            <div className="participated-toggle">
              <button type="button" className={participated ? "active" : ""} onClick={() => setParticipated(true)}>Sim, participei</button>
              <button type="button" className={!participated ? "active" : ""} onClick={() => setParticipated(false)}>Não participei</button>
            </div>
          </div>

          {participated ? (
            <div className="feedback-question">
              <label className="question-title">O que achou da atividade?</label>
              <div className="rating-selector">
                <button type="button" className={rating === "great" ? "active" : ""} onClick={() => setRating("great")}>🌟 Adorei</button>
                <button type="button" className={rating === "good" ? "active" : ""} onClick={() => setRating("good")}>👍 Foi boa</button>
                <button type="button" className={rating === "ok" ? "active" : ""} onClick={() => setRating("ok")}>😐 Regular</button>
                <button type="button" className={rating === "poor" ? "active" : ""} onClick={() => setRating("poor")}>👎 Precisa melhorar</button>
              </div>
            </div>
          ) : (
            <div className="feedback-question">
              <label className="question-title">Qual foi o motivo de não participar?</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} required>
                <option value="">Selecione o motivo principal...</option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          <div className="feedback-question">
            <label className="question-title">Comentários ou sugestões para o GEF (opcional)</label>
            <textarea placeholder="O que funcionou bem? O que podemos adaptar para o próximo recreio?" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} />
          </div>

          <div className="composer-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="primary-button" disabled={busy || (!participated && !reason)}>
              {busy ? "Enviando..." : "Enviar avaliação"} <Icon name="arrow" size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActivitySummaryModal({
  activity,
  feedbacks,
  onClose,
  onUpdateStatus,
}: {
  activity: Activity;
  feedbacks: ActivityFeedback[];
  onClose: () => void;
  onUpdateStatus: (status: "upcoming" | "done" | "cancelled") => Promise<void>;
}) {
  const total = feedbacks.length;
  const participatedCount = feedbacks.filter((f) => f.participated).length;
  const participationRate = total > 0 ? Math.round((participatedCount / total) * 100) : 0;
  const ratingCounts = {
    great: feedbacks.filter((f) => f.rating === "great").length,
    good: feedbacks.filter((f) => f.rating === "good").length,
    ok: feedbacks.filter((f) => f.rating === "ok").length,
    poor: feedbacks.filter((f) => f.rating === "poor").length,
  };
  const reasonsMap: Record<string, number> = {};
  feedbacks.filter((f) => !f.participated && f.reasonNotParticipated).forEach((f) => {
    const r = f.reasonNotParticipated!;
    reasonsMap[r] = (reasonsMap[r] ?? 0) + 1;
  });

  return (
    <div className="feedback-modal-overlay" role="dialog" aria-modal="true">
      <div className="feedback-modal-card summary-card">
        <div className="feedback-modal-head">
          <div>
            <span className="eyebrow">RELATÓRIO DO GEF · AVALIAÇÕES</span>
            <h3>{activity.title}</h3>
            <p>{activity.date} · {activity.place} · Status atual: <strong>{activity.status}</strong></p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="activity-status-manager">
          <span>Alterar situação da atividade:</span>
          <div className="status-button-group">
            <button type="button" className={activity.status === "upcoming" ? "active" : ""} onClick={() => onUpdateStatus("upcoming")}>Agendada</button>
            <button type="button" className={activity.status === "done" ? "active" : ""} onClick={() => onUpdateStatus("done")}>Concluída / Realizada</button>
            <button type="button" className={activity.status === "cancelled" ? "active" : ""} onClick={() => onUpdateStatus("cancelled")}>Cancelada</button>
          </div>
        </div>

        <div className="summary-stats-grid">
          <div className="stat-box">
            <strong>{total}</strong>
            <span>Avaliações recebidas</span>
          </div>
          <div className="stat-box">
            <strong>{participationRate}%</strong>
            <span>Taxa de participação</span>
          </div>
          <div className="stat-box">
            <strong>{ratingCounts.great + ratingCounts.good}</strong>
            <span>Avaliações positivas</span>
          </div>
        </div>

        {Object.keys(reasonsMap).length > 0 && (
          <div className="summary-reasons-block">
            <h4>Motivos de quem não participou:</h4>
            <ul>
              {Object.entries(reasonsMap).map(([reason, count]) => (
                <li key={reason}><span>{reason}</span> <b>{count} ({Math.round((count / (total - participatedCount)) * 100)}%)</b></li>
              ))}
            </ul>
          </div>
        )}

        <div className="summary-comments-block">
          <h4>Comentários dos estudantes ({feedbacks.filter((f) => f.comment).length}):</h4>
          <div className="comments-scroll">
            {feedbacks.filter((f) => f.comment).map((f) => (
              <div key={f.id} className="feedback-comment-item">
                <div className="f-comment-head">
                  <strong>{f.userName}</strong> <small>({f.turma})</small>
                  {f.rating && <span className="f-rating-tag">{f.rating === "great" ? "🌟 Adorou" : f.rating === "good" ? "👍 Bom" : f.rating === "ok" ? "😐 Regular" : "👎 Melhorar"}</span>}
                </div>
                <p>{f.comment}</p>
              </div>
            ))}
            {feedbacks.filter((f) => f.comment).length === 0 && <p className="empty-copy">Nenhum comentário por escrito ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function GraphMap({ proposals, onSelect }: { proposals: Proposal[]; onSelect: (id: string) => void }) {
  const positions: Record<string, { x: number; y: number }> = { "Esportes": { x: 18, y: 27 }, "Jogos de mesa": { x: 82, y: 25 }, "Música e cultura": { x: 15, y: 79 }, "Convivência": { x: 50, y: 18 }, "Descanso": { x: 86, y: 79 }, "Outros": { x: 51, y: 79 } };
  const groups = THEMES.map((theme) => ({ theme, proposals: proposals.filter((proposal) => proposal.theme === theme) })).filter((group) => group.proposals.length);
  const points = proposals.map((proposal) => {
    const center = positions[proposal.theme] ?? { x: 50, y: 50 };
    const siblings = proposals.filter((item) => item.theme === proposal.theme);
    const localIndex = siblings.findIndex((item) => item.id === proposal.id);
    const spread = siblings.length > 1 ? (localIndex - (siblings.length - 1) / 2) * 9 : 0;
    const vertical = siblings.length > 1 ? (localIndex % 2 ? 13 : -13) : -15;
    return { proposal, x: Math.min(93, Math.max(7, center.x + spread)), y: Math.min(92, Math.max(8, center.y + vertical)) };
  });

  return (
    <div className="topic-map" aria-label="Mapa de propostas agrupadas por tema">
      <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {points.map((point) => {
          const center = positions[point.proposal.theme] ?? { x: 50, y: 50 };
          return <line key={point.proposal.id} x1={center.x} y1={center.y} x2={point.x} y2={point.y} />;
        })}
      </svg>
      {groups.map((group) => {
        const center = positions[group.theme] ?? { x: 50, y: 50 };
        const size = 76 + group.proposals.length * 10;
        return (
          <div key={group.theme} className="topic-group" style={{ left: `${center.x}%`, top: `${center.y}%` }}>
            <button className="topic-node" style={{ width: size, height: size }} onClick={() => group.proposals[0] && onSelect(group.proposals[0].id)} aria-label={`${group.theme}: ${group.proposals.length} propostas`}>
              <strong>{group.proposals.length}</strong>
              <span>{group.theme}</span>
            </button>
          </div>
        );
      })}
      {points.map((point) => (
        <button key={point.proposal.id} className="proposal-node" style={{ left: `${point.x}%`, top: `${point.y}%`, borderColor: STATUS[point.proposal.status]?.color ?? "#6c7d8c" }} onClick={() => onSelect(point.proposal.id)} title={point.proposal.title}>
          <span style={{ backgroundColor: STATUS[point.proposal.status]?.color ?? "#6c7d8c" }} />
          {point.proposal.title}
        </button>
      ))}
    </div>
  );
}

const CALENDAR_WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const next = new Date(year, month - 1 + amount, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function CalendarMonth({
  activities,
  monthKey,
  onMonthChange,
  onSelect,
}: {
  activities: Activity[];
  monthKey: string;
  onMonthChange: (monthKey: string) => void;
  onSelect: (proposalId: string) => void;
}) {
  const [year, monthNumber] = monthKey.split("-").map(Number);
  const month = monthNumber - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: leading + daysInMonth }, (_, index) => index < leading ? null : index - leading + 1);

  function dayActivities(day: number) {
    const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return activities.filter((activity) => activity.date === date);
  }

  return (
    <section className="calendar-card" aria-labelledby="calendar-title">
      <div className="calendar-head">
        <div>
          <span className="eyebrow">VISUALIZAÇÃO MENSAL</span>
          <h3 id="calendar-title">{monthLabel(monthKey)}</h3>
        </div>
        <div className="calendar-month-actions">
          <button type="button" className="calendar-nav" onClick={() => onMonthChange(shiftMonth(monthKey, -1))} aria-label="Mês anterior"><Icon name="arrow" size={15} /></button>
          <button type="button" className="calendar-nav next" onClick={() => onMonthChange(shiftMonth(monthKey, 1))} aria-label="Próximo mês"><Icon name="arrow" size={15} /></button>
          <span className="calendar-legend"><i /> atividade publicada</span>
        </div>
      </div>
      <div className="calendar-grid calendar-weekdays" aria-hidden="true">{CALENDAR_WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid calendar-days" role="grid" aria-label={`Calendário de ${monthLabel(monthKey)}`}>
        {cells.map((day, index) => {
          if (!day) return <span className="calendar-cell is-empty" key={`empty-${index}`} aria-hidden="true" />;
          const dayItems = dayActivities(day);
          const activity = dayItems[0];
          const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <button type="button" role="gridcell" className={`calendar-cell ${dayItems.length ? "has-activity" : ""} ${date === "2026-09-08" ? "is-today" : ""}`} key={day} onClick={() => activity && onSelect(activity.proposalId)} aria-label={`${day} de ${monthLabel(monthKey)}${dayItems.length ? `: ${dayItems.map((item) => item.title).join(", ")}` : ""}`}>
              <span>{day}</span>
              {activity && <><i title={activity.title} />{dayItems.length > 1 && <b>{dayItems.length}</b>}</>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActivityComposer({ proposals, onCancel, onCreate }: { proposals: Proposal[]; onCancel: () => void; onCreate: (activity: { proposalId: string; title: string; date: string; time: string; place: string; audience: string }) => void }) {
  const eligible = proposals.filter((proposal) => proposal.status === "development" || proposal.status === "analysis");
  const list = eligible.length ? eligible : proposals;
  const [proposalId, setProposalId] = useState(list[0]?.id ?? "");
  const [title, setTitle] = useState(list[0]?.title ?? "Atividade no recreio");
  const [date, setDate] = useState("2026-09-15");
  const [time, setTime] = useState("10:15–10:35");
  const [place, setPlace] = useState("Pátio central");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !date || !place.trim()) return;
    onCreate({ proposalId, title: title.trim(), date, time, place: place.trim(), audience: "Todas as turmas" });
  }

  return (
    <form className="activity-form" onSubmit={submit}>
      <div className="composer-panel-head">
        <div>
          <span className="eyebrow">NOVA ATIVIDADE</span>
          <h2>Colocar uma proposta na agenda</h2>
          <p>O aviso será criado para todos os alunos e a proposta entrará em agendada.</p>
        </div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Fechar agenda"><Icon name="close" size={20} /></button>
      </div>
      <label>
        Proposta de origem
        <select value={proposalId} onChange={(event) => { setProposalId(event.target.value); const p = list.find((item) => item.id === event.target.value); if (p) setTitle(p.title); }}>
          {list.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </label>
      <label>Título da atividade<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <div className="form-row">
        <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label>Horário<input value={time} onChange={(event) => setTime(event.target.value)} /></label>
      </div>
      <label>Local<input value={place} onChange={(event) => setPlace(event.target.value)} /></label>
      <div className="composer-help"><Icon name="bell" size={16} /> Todas as turmas receberão o aviso dentro da plataforma.</div>
      <div className="composer-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary-button">Publicar na agenda <Icon name="arrow" size={16} /></button>
      </div>
    </form>
  );
}

function AuthView({ onLogin, onSignup }: { onLogin: (name: string, password: string) => Promise<string | null>; onSignup: (name: string, turma: string, password: string) => Promise<string | null> }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [turma, setTurma] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = mode === "login" ? await onLogin(name.trim(), password) : await onSignup(name.trim(), turma, password);
    setBusy(false);
    if (result) setError(result);
  }

  return (
    <main className="auth-page">
      <div className="auth-brand" aria-label="Comunica Farroupilha">
        <Image src="/brand/gremio-comunica.webp" alt="Megafone do GEF" width={120} height={80} priority />
      </div>
      <div className="auth-card">
        <span className="eyebrow">COMUNICA FARROUPILHA</span>
        <h1>{mode === "login" ? "Que bom ter você por aqui." : "Faça parte da conversa."}</h1>
        <p>{mode === "login" ? "Entre para acompanhar as propostas e ajudar a construir o próximo recreio." : "Crie uma conta para propor, apoiar e avaliar atividades."}</p>
        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Entrar</button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Criar conta</button>
        </div>
        <form onSubmit={submit}>
          <label>Nome de usuário<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: ana.silva ou administrador" autoComplete="username" required /></label>
          {mode === "signup" && <label>Turma<input value={turma} onChange={(event) => setTurma(event.target.value)} placeholder="Ex.: 8º ano A ou 2º EM" autoComplete="organization" required /></label>}
          <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres (adm: admteste123)" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? "Aguarde…" : mode === "login" ? "Entrar na plataforma" : "Criar minha conta"}
            <Icon name="arrow" size={16} />
          </button>
        </form>
        <div className="auth-note">
          <Icon name="info" size={16} />
          <span>Contas de demonstração pré-configuradas: <strong>Demonstração / demo1234</strong> (estudante) ou <strong>administrador / admteste123</strong> (GEF).</span>
        </div>
      </div>
      <p className="auth-demo-note">Plataforma 100% funcional com persistência e backend ativo</p>
    </main>
  );
}

export function GEFShell() {
  const [state, setState] = useState<DemoState>(defaultState);
  const [view, setView] = useState<View>("proposals");
  const [selectedId, setSelectedId] = useState("p1");
  const [query, setQuery] = useState("");
  const [themeFilter, setThemeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all");
  const [sort, setSort] = useState<"recent" | "supports">("recent");
  const [composerOpen, setComposerOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [agendaMonthKey, setAgendaMonthKey] = useState("2026-09");
  const [agendaProposalId, setAgendaProposalId] = useState<string | null>(null);
  const [gefProposalId, setGefProposalId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [evaluatingActivity, setEvaluatingActivity] = useState<Activity | null>(null);
  const [summaryActivity, setSummaryActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // 1. Initial fast local hydration
      try {
        const saved = window.localStorage.getItem("comunica-farroupilha-demo") ?? window.localStorage.getItem("gremio-comunica-demo");
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<DemoState>;
          setState((curr) => ({
            ...curr,
            ...parsed,
            accounts: parsed.accounts && parsed.accounts.length > 0 ? parsed.accounts : curr.accounts,
            proposals: parsed.proposals ?? curr.proposals,
            comments: parsed.comments ?? curr.comments,
            activities: parsed.activities ?? curr.activities,
            supporters: parsed.supporters ?? curr.supporters,
            supportedByUser: parsed.supportedByUser ?? curr.supportedByUser,
            savedByUser: parsed.savedByUser ?? curr.savedByUser,
            activityFeedbacks: parsed.activityFeedbacks ?? curr.activityFeedbacks,
            chapaQuestions: parsed.chapaQuestions ?? curr.chapaQuestions,
          }));
        }
      } catch {}

      // 2. Load active session from /api/auth/me
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setState((curr) => ({ ...curr, user: data.user }));
          }
        })
        .catch(() => {});

      // 3. Load live platform store from /api/platform
      fetch("/api/platform")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            const p = data.data;
            setState((curr) => ({
              ...curr,
              proposals: p.proposals ?? curr.proposals,
              comments: p.comments ?? curr.comments,
              activities: p.activities ?? curr.activities,
              notifications: p.notifications ?? curr.notifications,
              supporters: p.supportersByProposal ?? curr.supporters,
              supportedByUser: p.supportedByUser ?? curr.supportedByUser,
              savedByUser: p.savedByUser ?? curr.savedByUser,
              activityFeedbacks: p.activityFeedbacks ?? curr.activityFeedbacks,
              chapaQuestions: p.chapaQuestions ?? curr.chapaQuestions,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setAuthReady(true));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authReady) {
      try {
        window.localStorage.setItem("comunica-farroupilha-demo", JSON.stringify(state));
      } catch {}
    }
  }, [state, authReady]);

  const user = state.user;
  const isGef = user?.role === "gef";
  const unread = state.notifications.filter((notification) => !notification.read).length;

  const filteredProposals = useMemo(() => {
    return state.proposals
      .filter((proposal) => {
        const matchesQuery = !query.trim() || `${proposal.title} ${proposal.body} ${proposal.theme}`.toLowerCase().includes(query.toLowerCase());
        const matchesTheme = themeFilter === "Todos" || proposal.theme === themeFilter;
        const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
        return matchesQuery && matchesTheme && matchesStatus;
      })
      .sort((a, b) => sort === "supports" ? b.supports - a.supports : state.proposals.indexOf(a) - state.proposals.indexOf(b));
  }, [state.proposals, query, themeFilter, statusFilter, sort]);

  const userSupportedIds = useMemo(() => {
    if (!user) return [];
    const direct = state.supportedByUser?.[user.id] ?? [];
    const fromSupporters = Object.entries(state.supporters)
      .filter(([, list]) => list?.some((s) => s.id === user.id))
      .map(([propId]) => propId);
    return Array.from(new Set([...direct, ...fromSupporters]));
  }, [user, state.supportedByUser, state.supporters]);

  const userSavedIds = useMemo(() => {
    if (!user) return [];
    return state.savedByUser?.[user.id] ?? [];
  }, [user, state.savedByUser]);

  const selected = state.proposals.find((proposal) => proposal.id === selectedId) ?? filteredProposals[0] ?? state.proposals[0];
  const savedProposals = useMemo(() => {
    if (!user) return [];
    return state.proposals.filter((proposal) => userSavedIds.includes(proposal.id));
  }, [user, state.proposals, userSavedIds]);
  const agendaActivities = useMemo(() => state.activities.filter((activity) => activity.date.slice(0, 7) === agendaMonthKey), [state.activities, agendaMonthKey]);
  const agendaProposal = agendaProposalId ? state.proposals.find((proposal) => proposal.id === agendaProposalId) : undefined;
  const gefProposal = gefProposalId ? state.proposals.find((proposal) => proposal.id === gefProposalId) : undefined;

  async function login(name: string, password: string): Promise<string | null> {
    const trimmedName = name.trim();
    const localAccount = state.accounts.find(
      (a) => a.name.toLowerCase() === trimmedName.toLowerCase() && a.password === password
    );

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          password,
          clientAccount: localAccount ? { name: localAccount.name, turma: localAccount.turma, password: localAccount.password } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (localAccount) {
          setState((curr) => ({
            ...curr,
            user: { id: localAccount.id, name: localAccount.name, turma: localAccount.turma, role: localAccount.role },
          }));
          setView("proposals");
          return null;
        }
        return data.error || "Nome de usuário ou senha incorretos.";
      }
      setState((curr) => ({ ...curr, user: data.user }));
      setView("proposals");
      return null;
    } catch {
      if (localAccount) {
        setState((curr) => ({
          ...curr,
          user: { id: localAccount.id, name: localAccount.name, turma: localAccount.turma, role: localAccount.role },
        }));
        setView("proposals");
        return null;
      }
      return "Erro ao conectar com o servidor.";
    }
  }

  async function signup(name: string, turma: string, password: string): Promise<string | null> {
    const trimmedName = name.trim();
    const trimmedTurma = turma.trim() || "Turma não informada";

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmedName, turma: trimmedTurma, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return data.error || "Não foi possível criar a conta.";
      }
      const newAccount: Account = {
        id: data.user.id,
        name: data.user.name,
        turma: data.user.turma,
        role: data.user.role,
        password,
      };
      setState((curr) => ({
        ...curr,
        user: data.user,
        accounts: [...curr.accounts.filter((a) => a.name.toLowerCase() !== trimmedName.toLowerCase()), newAccount],
      }));
      setView("proposals");
      return null;
    } catch {
      const newAccount: Account = {
        id: `acc-${Date.now()}`,
        name: trimmedName,
        turma: trimmedTurma,
        role: "student",
        password,
      };
      setState((curr) => ({
        ...curr,
        user: { id: newAccount.id, name: newAccount.name, turma: newAccount.turma, role: newAccount.role },
        accounts: [...curr.accounts.filter((a) => a.name.toLowerCase() !== trimmedName.toLowerCase()), newAccount],
      }));
      setView("proposals");
      return null;
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setState((curr) => ({ ...curr, user: null }));
    setProfileOpen(false);
  }

  function changeView(next: View) {
    setView(next);
    setProfileOpen(false);
    setComposerOpen(false);
    setActivityOpen(false);
  }

  async function toggleSupport(id: string) {
    if (!user) return;
    try {
      const res = await fetch(`/api/proposals/${id}/support`, { method: "POST" });
      const data = await res.json();
      const currentSupported = userSupportedIds.includes(id);
      const supported = data.data ? data.data.supported : !currentSupported;
      const totalSupports = data.data ? data.data.supports : undefined;
      setState((curr) => {
        const userSupports = curr.supportedByUser?.[user.id] ?? [];
        const nextUserSupports = supported
          ? (userSupports.includes(id) ? userSupports : [...userSupports, id])
          : userSupports.filter((item) => item !== id);

        const currentSupporters = curr.supporters[id] ?? [];
        const nextSupporters = supported
          ? (currentSupporters.some((s) => s.id === user.id) ? currentSupporters : [...currentSupporters, { id: user.id, name: user.name, turma: user.turma }])
          : currentSupporters.filter((s) => s.id !== user.id);

        return {
          ...curr,
          supportedByUser: {
            ...curr.supportedByUser,
            [user.id]: nextUserSupports,
          },
          supporters: { ...curr.supporters, [id]: nextSupporters },
          proposals: curr.proposals.map((p) => p.id === id ? { ...p, supports: totalSupports !== undefined ? totalSupports : Math.max(0, p.supports + (supported ? 1 : -1)) } : p),
        };
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleSaved(id: string) {
    if (!user) return;
    try {
      const res = await fetch(`/api/proposals/${id}/save`, { method: "POST" });
      const data = await res.json();
      const currentSaved = userSavedIds.includes(id);
      const saved = data.data ? data.data.saved : !currentSaved;
      setState((curr) => {
        const userSaved = curr.savedByUser?.[user.id] ?? [];
        const nextUserSaved = saved
          ? (userSaved.includes(id) ? userSaved : [...userSaved, id])
          : userSaved.filter((item) => item !== id);

        return {
          ...curr,
          savedByUser: {
            ...curr.savedByUser,
            [user.id]: nextUserSaved,
          },
        };
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function createProposal(input: { title: string; body: string; theme: string; anonymous: boolean }) {
    if (!user) return;
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      const newProposal: Proposal = data.data ?? {
        id: `p-${Date.now()}`,
        ...input,
        author: user.role === "gef" ? "Grêmio Estudantil Farroupilha" : user.name,
        authorId: user.id,
        origin: user.role === "gef" ? "gef" : "student",
        status: "received",
        supports: 0,
        comments: 0,
        createdAt: "Agora",
        updatedAt: "Agora",
      };
      setState((curr) => ({
        ...curr,
        proposals: [newProposal, ...curr.proposals],
        supporters: { ...curr.supporters, [newProposal.id]: [] },
        notifications: [
          {
            id: `n-${Date.now()}`,
            title: "Nova proposta publicada",
            body: `${newProposal.anonymous ? "Uma pessoa estudante" : newProposal.author} publicou uma ideia para o recreio.`,
            createdAt: "Agora",
            read: false,
          },
          ...curr.notifications,
        ],
      }));
      setSelectedId(newProposal.id);
      setComposerOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function changeStatus(id: string, status: ProposalStatus, gefResponse?: string) {
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, ...(gefResponse ? { gefResponse } : {}) }),
      });
      const data = await res.json();
      const updated = data.data;
      setState((curr) => ({
        ...curr,
        proposals: curr.proposals.map((p) => p.id === id ? {
          ...p,
          status: updated?.status ?? status,
          gefResponse: updated?.gefResponse ?? (gefResponse || p.gefResponse),
          gefResponseAt: updated?.gefResponseAt ?? (gefResponse ? "Agora" : p.gefResponseAt),
          updatedAt: "Agora",
        } : p),
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function submitGefResponse(id: string, gefResponse: string) {
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gefResponse }),
      });
      const data = await res.json();
      const updated = data.data;
      setState((curr) => ({
        ...curr,
        proposals: curr.proposals.map((p) => p.id === id ? {
          ...p,
          gefResponse: updated?.gefResponse ?? gefResponse,
          gefResponseAt: updated?.gefResponseAt ?? "Agora",
          updatedAt: "Agora",
        } : p),
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function addComment(body: string, anonymous: boolean, parentId?: string, proposalIdOverride?: string) {
    if (!user) return;
    const proposalId = proposalIdOverride ?? selected?.id;
    if (!proposalId) return;
    try {
      const res = await fetch(`/api/proposals/${proposalId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, anonymous, ...(parentId ? { parentId } : {}) }),
      });
      const data = await res.json();
      const newComment: ProposalComment = data.data ?? {
        id: `c-${Date.now()}`,
        proposalId,
        author: user.name,
        authorId: user.id,
        role: user.role,
        anonymous,
        body,
        createdAt: "Agora",
        ...(parentId ? { parentId } : {}),
      };
      setState((curr) => ({
        ...curr,
        comments: [...curr.comments, newComment],
        proposals: curr.proposals.map((p) => p.id === proposalId ? { ...p, comments: p.comments + 1, updatedAt: "Agora" } : p),
        notifications: [
          {
            id: `n-${Date.now()}`,
            title: "Nova interação na comunidade",
            body: `${anonymous ? "Uma pessoa estudante" : user.name} comentou uma proposta.`,
            createdAt: "Agora",
            read: false,
          },
          ...curr.notifications,
        ],
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function createActivity(activityInput: { proposalId: string; title: string; date: string; time: string; place: string; audience: string }) {
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(activityInput),
      });
      const data = await res.json();
      const newActivity: Activity = data.data ?? {
        id: `a-${Date.now()}`,
        ...activityInput,
        status: "upcoming",
      };
      setState((curr) => ({
        ...curr,
        activities: [newActivity, ...curr.activities],
        proposals: curr.proposals.map((p) => p.id === activityInput.proposalId ? { ...p, status: "scheduled", updatedAt: "Agora" } : p),
        notifications: [
          {
            id: `n-${Date.now()}`,
            title: "Nova atividade no recreio",
            body: `${newActivity.title} · ${newActivity.date} · ${newActivity.place}`,
            createdAt: "Agora",
            read: false,
            activityId: newActivity.id,
          },
          ...curr.notifications,
        ],
      }));
      setAgendaMonthKey(newActivity.date.slice(0, 7));
      setAgendaProposalId(newActivity.proposalId);
      setActivityOpen(false);
      setView("agenda");
    } catch (err) {
      console.error(err);
    }
  }

  async function updateActivityStatus(activityId: string, status: "upcoming" | "done" | "cancelled") {
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      const updated = data.data;
      setState((curr) => ({
        ...curr,
        activities: curr.activities.map((a) => a.id === activityId ? { ...a, status: updated?.status ?? status } : a),
        proposals: status === "done" ? curr.proposals.map((p) => {
          const act = curr.activities.find((a) => a.id === activityId);
          return act && act.proposalId === p.id ? { ...p, status: "completed", updatedAt: "Agora" } : p;
        }) : curr.proposals,
      }));
      if (summaryActivity && summaryActivity.id === activityId) {
        setSummaryActivity((curr) => curr ? { ...curr, status: updated?.status ?? status } : null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function submitActivityFeedback(activityId: string, feedback: { participated: boolean; reasonNotParticipated?: string; rating?: ActivityFeedbackRating; comment?: string }) {
    if (!user) return;
    try {
      const res = await fetch(`/api/activities/${activityId}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(feedback),
      });
      const data = await res.json();
      const newFeedback: ActivityFeedback = data.data ?? {
        id: `af-${Date.now()}`,
        activityId,
        userId: user.id,
        userName: user.name,
        turma: user.turma,
        ...feedback,
        createdAt: "Agora",
      };
      setState((curr) => {
        const currentList = curr.activityFeedbacks[activityId] ?? [];
        const filtered = currentList.filter((item) => item.userId !== user.id);
        return {
          ...curr,
          activityFeedbacks: {
            ...curr.activityFeedbacks,
            [activityId]: [...filtered, newFeedback],
          },
        };
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function askChapaQuestion(chapaId: string, area: string, title: string, question: string) {
    if (!user) return;
    try {
      const res = await fetch("/api/chapas/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chapaId, proposalArea: area, proposalTitle: title, question }),
      });
      const data = await res.json();
      const newQ: ChapaQuestion = data.data ?? {
        id: `cq-${Date.now()}`,
        chapaId,
        proposalArea: area,
        proposalTitle: title,
        question,
        author: user.name,
        authorId: user.id,
        turma: user.turma,
        createdAt: "Agora",
      };
      setState((curr) => ({
        ...curr,
        chapaQuestions: [newQ, ...curr.chapaQuestions],
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function answerChapaQuestion(questionId: string, answer: string) {
    if (!user) return;
    try {
      const res = await fetch("/api/chapas/questions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId, answer, answeredBy: user.name }),
      });
      const data = await res.json();
      const updated = data.data;
      setState((curr) => ({
        ...curr,
        chapaQuestions: curr.chapaQuestions.map((q) => q.id === questionId ? {
          ...q,
          answer: updated?.answer ?? answer,
          answeredBy: updated?.answeredBy ?? user.name,
          answeredAt: updated?.answeredAt ?? "Agora",
        } : q),
      }));
    } catch (err) {
      console.error(err);
    }
  }

  function markAllRead() {
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    setState((curr) => ({ ...curr, notifications: curr.notifications.map((n) => ({ ...n, read: true })) }));
  }

  function resetDemo() {
    window.localStorage.removeItem("comunica-farroupilha-demo");
    window.localStorage.removeItem("gremio-comunica-demo");
    setState(defaultState);
    setView("proposals");
    setProfileOpen(false);
  }

  if (!authReady) {
    return (
      <div className="app-loading">
        <span className="loading-mark"><Icon name="message" size={24} /></span>
        <span>Carregando a conversa…</span>
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={login} onSignup={signup} />;
  }

  return (
    <div className="app-shell">
      <a className="app-skip" href="#app-content">Pular para o conteúdo</a>
      <aside className="app-sidebar">
        <div className="app-logo" aria-label="Comunica Farroupilha">
          <Image src="/brand/gremio-comunica.webp" alt="Megafone do GEF" width={107} height={72} priority />
        </div>
        <nav aria-label="Navegação da plataforma">
          <button className={view === "proposals" ? "active" : ""} onClick={() => changeView("proposals")}><Icon name="message" size={20} />Propostas</button>
          <button className={view === "saved" ? "active" : ""} onClick={() => changeView("saved")}><Icon name="bookmark" size={20} />Acompanhando</button>
          <button className={view === "agenda" ? "active" : ""} onClick={() => changeView("agenda")}><Icon name="calendar" size={20} />Agenda</button>
          <button className={view === "chapas" ? "active" : ""} onClick={() => changeView("chapas")}><Icon name="users" size={20} />Chapas</button>
          <button className={view === "notifications" ? "active" : ""} onClick={() => changeView("notifications")}>
            <Icon name="bell" size={20} />Notificações{unread > 0 && <span className="nav-count">{unread}</span>}
          </button>
          {isGef && <button className={view === "gef" ? "active" : ""} onClick={() => changeView("gef")}><Icon name="grid" size={20} />Visão do GEF</button>}
        </nav>
        <button className="sidebar-create" onClick={() => { setComposerOpen(true); setView("proposals"); }}>
          <Icon name="plus" size={21} />{isGef ? "Criar consulta" : "Criar proposta"}
        </button>
        <div className="profile-wrap">
          <button className="profile-button" onClick={() => setProfileOpen((open) => !open)}>
            <Avatar name={user.name} role={user.role} />
            <span><strong>{user.name}</strong><small>{isGef ? "Administrador GEF" : user.turma}</small></span>
            <Icon name="chevron" size={17} />
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <button onClick={logout}><Icon name="logout" size={16} />Sair</button>
              <button onClick={resetDemo}><Icon name="refresh" size={16} />Restaurar dados</button>
            </div>
          )}
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button className="mobile-brand" onClick={() => changeView("proposals")} aria-label="Ir para propostas">
            <Image src="/brand/gremio-comunica.webp" alt="Megafone do GEF" width={58} height={42} />
          </button>
          <div className="topbar-search">
            <Icon name="search" size={19} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); if (view !== "proposals") setView("proposals"); }} placeholder="Buscar propostas…" aria-label="Buscar propostas" />
          </div>
          <div className="topbar-actions">
            <button className="top-icon notification-top" onClick={() => changeView("notifications")} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}>
              <Icon name="bell" size={21} />{unread > 0 && <span>{unread}</span>}
            </button>
            <button className="top-avatar" onClick={() => setProfileOpen((open) => !open)} aria-label="Abrir menu do perfil">
              <Avatar name={user.name} role={user.role} small />
            </button>
          </div>
        </header>

        <main id="app-content" className="app-content">
          {view === "proposals" && (
            <>
              <section className="welcome-banner">
                <div>
                  <span className="eyebrow">ESPAÇO DE PARTICIPAÇÃO</span>
                  <h1>Olá, {user.name}! <Icon name="spark" size={18} /></h1>
                  <p>Participe, proponha e construa uma escola cada vez melhor.</p>
                </div>
                <div className="welcome-shape">
                  <Image className="welcome-logo" src="/brand/gremio-comunica.webp" alt="Logo Comunica Farroupilha" width={180} height={120} priority />
                </div>
              </section>
              <p className="institutional-banner">
                <Icon name="check" size={16} />
                <span>A direção de comunicação do Grêmio Estudantil Farroupilha já aprova esta ideia e considera essencial desenvolver atividades de lazer no recreio.</span>
              </p>

              {composerOpen && <Composer user={user} onCancel={() => setComposerOpen(false)} onCreate={createProposal} />}

              <section className="content-heading">
                <div>
                  <h2>Propostas da comunidade</h2>
                  <p>Veja, apoie e comente ideias criadas por estudantes e consultas abertas pelo GEF.</p>
                </div>
                <button className="primary-button heading-action" onClick={() => setComposerOpen(true)}>
                  <Icon name="plus" size={17} />{isGef ? "Criar consulta" : "Criar proposta"}
                </button>
              </section>

              <div className="filters">
                <div className="filter-search">
                  <Icon name="search" size={17} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar propostas…" aria-label="Buscar propostas no feed" />
                </div>
                <label className="select-filter">
                  <Icon name="grid" size={16} />
                  <span className="filter-label">Tema:</span>
                  <select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value)}>
                    <option>Todos</option>
                    {THEMES.map((theme) => <option key={theme}>{theme}</option>)}
                  </select>
                  <Icon name="chevron" size={14} />
                </label>
                <label className="select-filter">
                  <span className="status-filter-dot" />
                  <span className="filter-label">Situação:</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | "all")}>
                    <option value="all">Todas</option>
                    {Object.entries(STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
                  </select>
                  <Icon name="chevron" size={14} />
                </label>
                <label className="select-filter sort-filter">
                  <Icon name="filter" size={16} />
                  <span className="filter-label">Ordenar:</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value as "recent" | "supports")}>
                    <option value="recent">Mais recentes</option>
                    <option value="supports">Mais apoiadas</option>
                  </select>
                  <Icon name="chevron" size={14} />
                </label>
              </div>

              <div className="proposal-list">
                {filteredProposals.map((proposal) => (
                  <div key={proposal.id}>
                    <ProposalCard
                      proposal={proposal}
                      selected={selected?.id === proposal.id}
                      supported={userSupportedIds.includes(proposal.id)}
                      saved={userSavedIds.includes(proposal.id)}
                      isGef={isGef}
                      onSelect={() => setSelectedId(proposal.id)}
                      onSupport={() => toggleSupport(proposal.id)}
                      onSave={() => toggleSaved(proposal.id)}
                      onStatus={(status) => changeStatus(proposal.id, status)}
                    />
                    {selected?.id === proposal.id && (
                      <ProposalDetail
                        proposal={proposal}
                        comments={state.comments}
                        supporters={state.supporters[proposal.id] ?? []}
                        user={user}
                        isGef={isGef}
                        onComment={addComment}
                        onSubmitGefResponse={submitGefResponse}
                      />
                    )}
                  </div>
                ))}
                {filteredProposals.length === 0 && (
                  <div className="empty-state">
                    <Icon name="search" size={26} />
                    <h3>Nenhuma proposta encontrada</h3>
                    <p>Tente outra busca ou limpe os filtros.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {view === "saved" && (
            <section className="page-section saved-page">
              <div className="content-heading">
                <div>
                  <span className="eyebrow">SEU ESPAÇO</span>
                  <h2>Propostas que acompanho</h2>
                  <p>Reúna ideias para voltar depois e acompanhe seus próximos passos.</p>
                </div>
              </div>
              {savedProposals.length === 0 ? (
                <div className="empty-state saved-empty">
                  <Icon name="bookmark" size={26} />
                  <h3>Nenhuma proposta acompanhada</h3>
                  <p>Toque no marcador de uma proposta para guardá-la aqui.</p>
                  <button type="button" className="primary-button" onClick={() => changeView("proposals")}>
                    Explorar propostas <Icon name="arrow" size={15} />
                  </button>
                </div>
              ) : (
                <div className="proposal-list">
                  {savedProposals.map((proposal) => (
                    <div key={proposal.id}>
                      <ProposalCard
                        proposal={proposal}
                        selected={selected?.id === proposal.id}
                        supported={userSupportedIds.includes(proposal.id)}
                        saved={userSavedIds.includes(proposal.id)}
                        isGef={isGef}
                        onSelect={() => setSelectedId(proposal.id)}
                        onSupport={() => toggleSupport(proposal.id)}
                        onSave={() => toggleSaved(proposal.id)}
                        onStatus={(status) => changeStatus(proposal.id, status)}
                      />
                      {selected?.id === proposal.id && (
                        <ProposalDetail
                          proposal={proposal}
                          comments={state.comments}
                          supporters={state.supporters[proposal.id] ?? []}
                          user={user}
                          isGef={isGef}
                          onComment={addComment}
                          onSubmitGefResponse={submitGefResponse}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {view === "agenda" && (
            <section className="page-section agenda-section">
              <div className="content-heading">
                <div>
                  <span className="eyebrow">PARTICIPAÇÃO EM AÇÃO</span>
                  <h2>Agenda do recreio</h2>
                  <p>Atividades confirmadas, horários, locais e espaço de avaliação pós-recreio.</p>
                </div>
                {isGef && (
                  <button className="primary-button heading-action" onClick={() => setActivityOpen(true)}>
                    <Icon name="plus" size={17} />Nova atividade
                  </button>
                )}
              </div>

              {activityOpen && isGef && (
                <ActivityComposer proposals={state.proposals} onCancel={() => setActivityOpen(false)} onCreate={createActivity} />
              )}

              <div className="agenda-toolbar">
                <strong>{monthLabel(agendaMonthKey)}</strong>
                <span className="agenda-view-label">Calendário mensal</span>
              </div>

              <CalendarMonth
                activities={agendaActivities}
                monthKey={agendaMonthKey}
                onMonthChange={setAgendaMonthKey}
                onSelect={(proposalId) => { setAgendaProposalId(proposalId); setSelectedId(proposalId); }}
              />

              <div className="agenda-list">
                {agendaActivities.map((activity) => {
                  const feedbacks = state.activityFeedbacks[activity.id] ?? [];
                  const userFeedback = feedbacks.find((f) => f.userId === user.id);
                  const isDone = activity.status === "done";
                  const isCancelled = activity.status === "cancelled";

                  return (
                    <article className={`activity-card ${isDone ? "is-done" : ""} ${isCancelled ? "is-cancelled" : ""}`} key={activity.id}>
                      <div className="activity-date">
                        <strong>{new Date(`${activity.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</strong>
                        <span>{new Date(`${activity.date}T12:00:00`).getDate()}</span>
                      </div>
                      <div className="activity-info">
                        <div className="activity-badges">
                          <span className={`activity-status-badge ${activity.status}`}>
                            {activity.status === "upcoming" ? "Agendada / Em breve" : activity.status === "done" ? "Realizada" : "Cancelada"}
                          </span>
                          {feedbacks.length > 0 && (
                            <span className="activity-feedback-count">
                              <Icon name="star" size={13} /> {feedbacks.length} avaliações
                            </span>
                          )}
                        </div>
                        <h3>{activity.title}</h3>
                        <p><Icon name="calendar" size={15} /> {activity.time} <span>·</span> <Icon name="info" size={15} /> {activity.place}</p>
                        <small>Público: {activity.audience}</small>
                      </div>

                      <div className="activity-actions">
                        <button className="outline-button" onClick={() => { setAgendaProposalId(activity.proposalId); setSelectedId(activity.proposalId); }}>
                          Ver proposta <Icon name="arrow" size={14} />
                        </button>

                        {!isGef && (
                          <button type="button" className={`feedback-button ${userFeedback ? "has-feedback" : ""}`} onClick={() => setEvaluatingActivity(activity)}>
                            <Icon name="star" size={15} />
                            {userFeedback ? "Minha avaliação" : "Avaliar atividade"}
                          </button>
                        )}

                        {isGef && (
                          <button type="button" className="feedback-button gef-summary-btn" onClick={() => setSummaryActivity(activity)}>
                            <Icon name="spark" size={15} />
                            Gerenciar & Avaliações ({feedbacks.length})
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {agendaActivities.length === 0 && (
                <div className="agenda-empty">
                  <Icon name="spark" size={22} />
                  <div>
                    <strong>Nenhuma atividade neste mês.</strong>
                    <p>Avance ou volte o calendário para consultar outras atividades.</p>
                  </div>
                </div>
              )}

              {agendaProposal && (
                <ProposalPreview
                  proposal={agendaProposal}
                  comments={state.comments}
                  supporters={state.supporters[agendaProposal.id] ?? []}
                  user={user}
                  isGef={isGef}
                  supported={userSupportedIds.includes(agendaProposal.id)}
                  saved={userSavedIds.includes(agendaProposal.id)}
                  onSupport={() => toggleSupport(agendaProposal.id)}
                  onSave={() => toggleSaved(agendaProposal.id)}
                  onStatus={(status) => changeStatus(agendaProposal.id, status)}
                  onComment={(body, anonymous, parentId) => addComment(body, anonymous, parentId, agendaProposal.id)}
                  onSubmitGefResponse={submitGefResponse}
                  onClose={() => setAgendaProposalId(null)}
                />
              )}

              {evaluatingActivity && (
                <ActivityFeedbackModal
                  activity={evaluatingActivity}
                  existingFeedback={(state.activityFeedbacks[evaluatingActivity.id] ?? []).find((f) => f.userId === user.id)}
                  onClose={() => setEvaluatingActivity(null)}
                  onSubmit={(data) => submitActivityFeedback(evaluatingActivity.id, data)}
                />
              )}

              {summaryActivity && (
                <ActivitySummaryModal
                  activity={summaryActivity}
                  feedbacks={state.activityFeedbacks[summaryActivity.id] ?? []}
                  onClose={() => setSummaryActivity(null)}
                  onUpdateStatus={(status) => updateActivityStatus(summaryActivity.id, status)}
                />
              )}
            </section>
          )}

          {view === "chapas" && (
            <ChapasView
              questions={state.chapaQuestions}
              isGef={isGef}
              onAskQuestion={askChapaQuestion}
              onAnswerQuestion={answerChapaQuestion}
            />
          )}

          {view === "notifications" && (
            <section className="page-section notifications-page">
              <div className="content-heading">
                <div>
                  <span className="eyebrow">FIQUE POR DENTRO</span>
                  <h2>Notificações</h2>
                  <p>Acompanhe respostas, mudanças e atividades que combinam com sua turma.</p>
                </div>
                <button className="text-action" onClick={markAllRead}>Marcar todas como lidas</button>
              </div>
              <div className="notification-list">
                {state.notifications.map((notification) => (
                  <button
                    className={`notification-item ${notification.read ? "is-read" : ""}`}
                    key={notification.id}
                    onClick={() => setState((current) => ({
                      ...current,
                      notifications: current.notifications.map((item) => item.id === notification.id ? { ...item, read: true } : item),
                    }))}
                  >
                    <span className="notification-icon"><Icon name={notification.activityId ? "calendar" : "message"} size={19} /></span>
                    <span>
                      <strong>{notification.title}</strong>
                      <small>{notification.body}</small>
                      <em>{notification.createdAt}</em>
                    </span>
                    {!notification.read && <span className="unread-dot" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {view === "gef" && isGef && (
            <section className="page-section gef-page">
              <div className="content-heading">
                <div>
                  <span className="eyebrow">ÁREA EXCLUSIVA</span>
                  <h2>Visão do GEF</h2>
                  <p>Encontre assuntos recorrentes, consulte a comunidade e acompanhe os próximos passos.</p>
                </div>
                <button className="primary-button heading-action" onClick={() => setActivityOpen(true)}>
                  <Icon name="plus" size={17} />Nova atividade
                </button>
              </div>

              {activityOpen && <ActivityComposer proposals={state.proposals} onCancel={() => setActivityOpen(false)} onCreate={createActivity} />}

              <div className="gef-overview">
                <div><strong>{state.proposals.length}</strong><span>propostas registradas</span></div>
                <div><strong>{new Set(state.proposals.map((proposal) => proposal.theme)).size}</strong><span>temas ativos</span></div>
                <div><strong>{state.proposals.filter((proposal) => proposal.status === "development" || proposal.status === "scheduled").length}</strong><span>em construção</span></div>
              </div>

              <div className="map-heading">
                <div>
                  <h3>Mapa de temas</h3>
                  <p>O tamanho mostra a quantidade de propostas; a cor mostra a situação.</p>
                </div>
                <div className="map-legend">
                  <span><i className="legend-dot received" />Recebida</span>
                  <span><i className="legend-dot analysis" />Em análise</span>
                  <span><i className="legend-dot development" />Em desenvolvimento</span>
                  <span><i className="legend-dot completed" />Concluída</span>
                </div>
              </div>

              <GraphMap proposals={state.proposals} onSelect={(id) => { setGefProposalId(id); setSelectedId(id); }} />

              <div className="map-list">
                <h3>Propostas no mapa</h3>
                {state.proposals.map((proposal) => (
                  <button key={proposal.id} onClick={() => { setGefProposalId(proposal.id); setSelectedId(proposal.id); }}>
                    <span className="map-list-status" style={{ background: STATUS[proposal.status]?.color ?? "#6c7d8c" }} />
                    <span>{proposal.title}</span>
                    <small>{proposal.theme}</small>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
              </div>

              {gefProposal && (
                <ProposalPreview
                  proposal={gefProposal}
                  comments={state.comments}
                  supporters={state.supporters[gefProposal.id] ?? []}
                  user={user}
                  isGef
                  supported={userSupportedIds.includes(gefProposal.id)}
                  saved={userSavedIds.includes(gefProposal.id)}
                  onSupport={() => toggleSupport(gefProposal.id)}
                  onSave={() => toggleSaved(gefProposal.id)}
                  onStatus={(status) => changeStatus(gefProposal.id, status)}
                  onComment={(body, anonymous, parentId) => addComment(body, anonymous, parentId, gefProposal.id)}
                  onSubmitGefResponse={submitGefResponse}
                  onClose={() => setGefProposalId(null)}
                />
              )}
            </section>
          )}
        </main>

        <nav className="mobile-nav" aria-label="Navegação móvel">
          <button className={view === "proposals" ? "active" : ""} onClick={() => changeView("proposals")}><Icon name="message" size={20} /><span>Propostas</span></button>
          <button className={view === "saved" ? "active" : ""} onClick={() => changeView("saved")}><Icon name="bookmark" size={20} /><span>Acompanhando</span></button>
          <button className={view === "agenda" ? "active" : ""} onClick={() => changeView("agenda")}><Icon name="calendar" size={20} /><span>Agenda</span></button>
          <button className={view === "chapas" ? "active" : ""} onClick={() => changeView("chapas")}><Icon name="users" size={20} /><span>Chapas</span></button>
          <button className={view === "notifications" ? "active" : ""} onClick={() => changeView("notifications")}><Icon name="bell" size={20} /><span>Notificações</span>{unread > 0 && <b>{unread}</b>}</button>
          {isGef && <button className={view === "gef" ? "active" : ""} onClick={() => changeView("gef")}><Icon name="grid" size={20} /><span>GEF</span></button>}
        </nav>
      </div>
    </div>
  );
}
