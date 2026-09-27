"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SelectMenu } from "@/components/select-menu";
import {
  applyCommentLikeState,
  applySavedState,
  applySupportState,
  beginInteraction,
  isLatestInteraction,
  loadPlatform,
  mergeById,
  mergePlatformPage,
  parseUiPreferences,
  serializeUiPreferences,
  type LoadStatus,
} from "@/lib/client-platform-state";
import { previewLegacyState, sanitizeLegacyImport } from "@/lib/legacy-import";
import { ELECTIONS_ENABLED } from "@/lib/feature-flags";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  canCancelProposal,
  filterNotifications,
  getNotificationDestination,
  isValidDateKey,
  localDateKey,
  type NotificationFilter,
  type NotificationType,
} from "@/lib/participation-domain";

type Role = "student" | "gef";
type View = "proposals" | "saved" | "agenda" | "chapas" | "notifications" | "gef";
type ProposalStatus = "received" | "analysis" | "development" | "scheduled" | "completed" | "archived" | "cancelled";

type User = {
  id: string;
  name: string;
  turma: string;
  role: Role;
};

function subscribeToLocalDate(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000);
  window.addEventListener("focus", onChange);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener("focus", onChange);
  };
}

function getLocalDateSnapshot() {
  return localDateKey(new Date());
}

function getServerDateSnapshot() {
  return "";
}

function subscribeToAuthLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getAuthErrorSnapshot() {
  return new URLSearchParams(window.location.search).get("authError") ?? "";
}

function getServerAuthErrorSnapshot() {
  return "";
}

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
  origin: "student" | "gef";
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
  likes: number;
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
  type: NotificationType;
  activityId?: string;
  proposalId?: string;
  occurrences?: number;
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
  answered: boolean;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
};

type DemoState = {
  user: User | null;
  proposals: Proposal[];
  comments: ProposalComment[];
  activities: Activity[];
  notifications: Notification[];
  commentCursorsByProposal: Record<string, string | null>;
  supportedByUser: Record<string, string[]>;
  savedByUser: Record<string, string[]>;
  likedCommentsByUser: Record<string, string[]>;
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
  cancelled: { label: "Cancelada", color: "#b24222", step: 0 },
};

function displayCount(value: number) {
  return value > 1000 ? "1.000+" : String(value);
}

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

type TactileAction = "support" | "save" | `like:${string}`;

function useTactileCommit() {
  const [committingAction, setCommittingAction] = useState<TactileAction | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
  }, []);

  function run(action: TactileAction, callback: () => void) {
    setCommittingAction(action);
    callback();
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCommittingAction(null), 360);
  }

  return { committingAction, run };
}

function ProfileMenu({ onLogout, onReset }: { onLogout: () => void; onReset: () => void }) {
  return (
    <div className="profile-menu">
      <button type="button" onClick={onLogout}><Icon name="logout" size={16} />Sair</button>
      <button type="button" onClick={onReset}><Icon name="refresh" size={16} />Recarregar dados</button>
    </div>
  );
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
const defaultState: DemoState = {
  user: null,
  proposals: [],
  comments: [],
  activities: [],
  notifications: [],
  commentCursorsByProposal: {},
  supportedByUser: {},
  savedByUser: {},
  likedCommentsByUser: {},
  supporters: {},
  activityFeedbacks: {},
  chapaQuestions: [],
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
        <div className="chapa-toolbar-control">
          <span>Área</span>
          <SelectMenu
            value={area}
            onChange={setArea}
            options={["Todas", ...CHAPA_AREAS].map((item) => ({ value: item, label: item }))}
            ariaLabel="Filtrar propostas da chapa por área"
            className="select-menu-chapa"
          />
        </div>
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
  canCancel,
  onSelect,
  onSupport,
  onSave,
  onStatus,
  onCancel,
}: {
  proposal: Proposal;
  selected: boolean;
  supported: boolean;
  saved: boolean;
  isGef: boolean;
  canCancel: boolean;
  onSelect: () => void;
  onSupport: () => void;
  onSave: () => void;
  onStatus: (status: ProposalStatus) => void;
  onCancel: () => void;
}) {
  const { committingAction, run } = useTactileCommit();

  return (
    <article id={`proposal-${proposal.id}`} className={`proposal-card ${selected ? "is-selected" : ""}`}>
      <div className="proposal-card-main">
        <button type="button" className="proposal-card-select" onClick={onSelect} aria-expanded={selected} aria-controls={`proposal-detail-${proposal.id}`}>
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
          {selected && proposal.status !== "cancelled" && proposal.status !== "archived" && <ProgressSteps status={proposal.status} />}
        </div>
        </button>
        <div className="proposal-card-meta">
          <span className="author-meta">
            <span>
              {proposal.origin === "gef" && <Image className="gef-inline-mark" src="/brand/gef.png" alt="GEF" width={18} height={18} />}
              <strong>{authorLabel(proposal)}</strong>
              <small>{proposal.anonymous ? `Autoria preservada · Criada ${proposal.createdAt}` : `Criada ${proposal.createdAt} · ${proposal.theme}`}</small>
            </span>
          </span>
          <span className="support-count"><Icon name="users" size={19} /><span><strong>{displayCount(proposal.supports)}</strong><small>Apoios</small></span></span>
          <button type="button" className="comment-count tactile-control" aria-label={`Abrir comentários da proposta (${displayCount(proposal.comments)})`} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
            <Icon name="message" size={18} /> {displayCount(proposal.comments)}
          </button>
          {proposal.status !== "cancelled" && <button type="button" className={`support-button tactile-control ${supported ? "is-supported" : ""} ${committingAction === "support" ? "is-committing" : ""}`} aria-pressed={supported} onClick={(event) => { event.stopPropagation(); run("support", onSupport); }}>
            <Icon name="thumbs" size={18} />{supported ? "Apoiado" : "Apoiar"}
          </button>}
          {proposal.status !== "cancelled" && <button type="button" className={`save-button tactile-control ${saved ? "is-saved" : ""} ${committingAction === "save" ? "is-committing" : ""}`} aria-pressed={saved} aria-label={saved ? "Remover proposta dos acompanhados" : "Acompanhar proposta"} title={saved ? "Remover dos acompanhados" : "Acompanhar proposta"} onClick={(event) => { event.stopPropagation(); run("save", onSave); }}>
            <Icon name="bookmark" size={18} />
          </button>}
        </div>
      </div>

      {canCancel && <div className="proposal-author-actions">
        <button type="button" onClick={onCancel}><Icon name="close" size={15} />Cancelar proposta</button>
      </div>}

      {isGef && selected && proposal.status !== "cancelled" && (
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
  commentCount,
  closed,
  onComment,
  onLike,
  likedCommentIds,
  hasOlderComments,
  loadingOlderComments,
  onLoadOlderComments,
}: {
  comments: ProposalComment[];
  proposalId: string;
  commentCount: number;
  closed: boolean;
  onComment: (body: string, parentId?: string) => void;
  onLike: (commentId: string) => void;
  likedCommentIds: string[];
  hasOlderComments: boolean;
  loadingOlderComments: boolean;
  onLoadOlderComments: () => void;
}) {
  const [body, setBody] = useState("");
  const roots = comments.filter((comment) => comment.proposalId === proposalId && !comment.parentId);
  const { committingAction, run } = useTactileCommit();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (body.trim().length < 3) return;
    onComment(body.trim());
    setBody("");
  }

  return (
    <section className="comments-section" aria-labelledby="comments-title">
      <div className="comments-heading">
        <span className="comments-heading-mark"><Icon name="message" size={16} /></span>
        <div className="comments-heading-copy">
          <h3 id="comments-title">Comentários ({commentCount})</h3>
          <span>Conversa aberta para a comunidade</span>
        </div>
      </div>
      <div className="comment-list">
        {roots.map((comment) => {
          const liked = likedCommentIds.includes(comment.id);
          return (
          <div className="comment-group" key={comment.id}>
            <div className={`comment ${comment.role === "gef" ? "comment-gef" : ""}`}>
              <div className="comment-content">
                <div className="comment-byline">
                  {comment.role === "gef" && <Image className="gef-inline-mark" src="/brand/gef.png" alt="GEF" width={18} height={18} />}
                  <strong>{comment.anonymous ? "Estudante anônimo" : comment.author}</strong>
                  {comment.role === "gef" && <span className="gef-tag">Equipe do Grêmio</span>}
                  <small>{comment.createdAt}</small>
                </div>
                <p>{comment.body}</p>
                <div className="comment-actions">
                  <button type="button" className="reply-link" onClick={() => setBody(`@${comment.anonymous ? "estudante" : comment.author} `)}>
                    Responder
                  </button>
                  <button
                    type="button"
                    className={`comment-like-button tactile-control ${liked ? "is-liked" : ""} ${committingAction === `like:${comment.id}` ? "is-committing" : ""}`}
                    aria-pressed={liked}
                    aria-label={liked ? "Descurtir comentário" : "Curtir comentário"}
                    onClick={() => run(`like:${comment.id}`, () => onLike(comment.id))}
                  >
                    <Icon name="thumbs" size={14} /> {comment.likes ?? 0}
                  </button>
                </div>
              </div>
            </div>
            {comments.filter((reply) => reply.parentId === comment.id && reply.proposalId === proposalId).map((reply) => (
              <div className="comment comment-reply" key={reply.id}>
                <div className="comment-content">
                  <div className="comment-byline">
                    {reply.role === "gef" && <Image className="gef-inline-mark" src="/brand/gef.png" alt="GEF" width={18} height={18} />}
                    <strong>{reply.author}</strong>
                    <small>{reply.createdAt}</small>
                  </div>
                  <p>{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
          );
        })}
        {roots.length === 0 && (
          <div className="comments-empty-state">
            <span className="comments-empty-icon"><Icon name="message" size={18} /></span>
            <strong>A conversa começa aqui.</strong>
            <p>Compartilhe uma ideia ou responda à conversa para continuar a escuta.</p>
          </div>
        )}
      </div>
      {hasOlderComments && <button type="button" className="secondary-button comment-load-older" onClick={onLoadOlderComments} disabled={loadingOlderComments}>
        {loadingOlderComments ? "Carregando…" : "Carregar comentários anteriores"}
        <Icon name="arrow" size={14} />
      </button>}
      {closed ? <p className="comments-closed" role="status">Esta proposta foi cancelada. Os comentários anteriores permanecem disponíveis.</p> : (
        <form className="comment-composer" onSubmit={submit}>
          <div className="composer-input">
            <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Compartilhe uma ideia ou responda à conversa…" rows={2} maxLength={1000} />
            <div className="composer-footer">
              <button type="submit" disabled={body.trim().length < 3}>Comentar <Icon name="arrow" size={15} /></button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

function ProposalDetail({
  proposal,
  comments,
  onComment,
  onLike,
  likedCommentIds,
  hasOlderComments,
  loadingOlderComments,
  onLoadOlderComments,
  isGef,
  onSubmitGefResponse,
}: {
  proposal: Proposal;
  comments: ProposalComment[];
  isGef: boolean;
  onComment: (body: string, parentId?: string) => void;
  onLike: (commentId: string) => void;
  likedCommentIds: string[];
  hasOlderComments: boolean;
  loadingOlderComments: boolean;
  onLoadOlderComments: () => void;
  onSubmitGefResponse?: (id: string, response: string) => Promise<void>;
}) {
  const [editingGefResponse, setEditingGefResponse] = useState(false);
  const [gefResponseText, setGefResponseText] = useState(proposal.gefResponse ?? "");
  const [savingResponse, setSavingResponse] = useState(false);

  async function handleSaveGefResponse() {
    if (!onSubmitGefResponse || !gefResponseText.trim()) return;
    setSavingResponse(true);
    await onSubmitGefResponse(proposal.id, gefResponseText.trim());
    setSavingResponse(false);
    setEditingGefResponse(false);
  }

  return (
    <div className="detail-grid" id={`proposal-detail-${proposal.id}`}>
      <CommentThread comments={comments} proposalId={proposal.id} commentCount={proposal.comments} closed={proposal.status === "cancelled"} onComment={onComment} onLike={onLike} likedCommentIds={likedCommentIds} hasOlderComments={hasOlderComments} loadingOlderComments={loadingOlderComments} onLoadOlderComments={onLoadOlderComments} />
      {isGef && proposal.status !== "cancelled" && onSubmitGefResponse && (
        <div className="detail-side">
          <div className="gef-response-tools" aria-label="Resposta oficial do GEF">
            <div className="gef-response-tools-head">
              <span className="mini-label">RETORNO OFICIAL DO GEF</span>
              {proposal.gefResponse && <span className="response-status">Publicado</span>}
            </div>
            {proposal.gefResponse && <p className="gef-response-tools-copy">{proposal.gefResponse}</p>}
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
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalPreview({
  proposal,
  comments,
  isGef,
  supported,
  saved,
  onSupport,
  onSave,
  onStatus,
  onComment,
  onLike,
  likedCommentIds,
  hasOlderComments,
  loadingOlderComments,
  onLoadOlderComments,
  onSubmitGefResponse,
  onClose,
}: {
  proposal: Proposal;
  comments: ProposalComment[];
  isGef: boolean;
  supported: boolean;
  saved: boolean;
  onSupport: () => void;
  onSave: () => void;
  onStatus: (status: ProposalStatus) => void;
  onComment: (body: string, parentId?: string) => void;
  onLike: (commentId: string) => void;
  likedCommentIds: string[];
  hasOlderComments: boolean;
  loadingOlderComments: boolean;
  onLoadOlderComments: () => void;
  onSubmitGefResponse?: (id: string, response: string) => Promise<void>;
  onClose: () => void;
}) {
  const { committingAction, run } = useTactileCommit();

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
        <span>{displayCount(proposal.supports)} apoios</span>
        <span>{displayCount(proposal.comments)} comentários</span>
        {proposal.status !== "cancelled" && <button type="button" className={`support-button tactile-control ${supported ? "is-supported" : ""} ${committingAction === "support" ? "is-committing" : ""}`} aria-pressed={supported} onClick={() => run("support", onSupport)}>
          <Icon name="thumbs" size={17} />{supported ? "Apoiado" : "Apoiar"}
        </button>}
        {proposal.status !== "cancelled" && <button type="button" className={`save-button tactile-control ${saved ? "is-saved" : ""} ${committingAction === "save" ? "is-committing" : ""}`} aria-pressed={saved} onClick={() => run("save", onSave)} aria-label={saved ? "Remover proposta dos acompanhados" : "Acompanhar proposta"} title={saved ? "Remover dos acompanhados" : "Acompanhar proposta"}>
          <Icon name="bookmark" size={17} />
        </button>}
      </div>
      <ProposalDetail proposal={proposal} comments={comments} isGef={isGef && proposal.status !== "cancelled"} onComment={onComment} onLike={onLike} likedCommentIds={likedCommentIds} hasOlderComments={hasOlderComments} loadingOlderComments={loadingOlderComments} onLoadOlderComments={onLoadOlderComments} onSubmitGefResponse={onSubmitGefResponse} />
      {isGef && proposal.status !== "cancelled" && (
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

function Composer({ user, onCancel, onCreate }: { user: User; onCancel: () => void; onCreate: (proposal: { title: string; body: string; theme: string }) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [theme, setTheme] = useState(THEMES[0]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (title.trim().length < 5 || body.trim().length < 20) return;
    onCreate({ title: title.trim(), body: body.trim(), theme });
  }

  const isGef = user.role === "gef";

  return (
    <form id="proposal-composer" className="composer-panel" onSubmit={submit}>
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
        <div className="form-field">
          <span className="form-field-label">Tema</span>
          <SelectMenu
            value={theme}
            onChange={setTheme}
            options={THEMES.map((item) => ({ value: item, label: item }))}
            ariaLabel="Tema da proposta"
            className="select-menu-field"
          />
        </div>
        {isGef && <label>Autoria<input value="Grêmio Estudantil Farroupilha" disabled /></label>}
      </div>
      <div className="composer-help">
        <Icon name="info" size={16} /> {isGef ? "Essa proposta será identificada como uma consulta oficial do GEF." : "A proposta será publicada com o nome da sua conta."}
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
              <SelectMenu
                value={reason}
                onChange={setReason}
                options={[{ value: "", label: "Selecione o motivo principal..." }, ...REASONS.map((item) => ({ value: item, label: item }))]}
                ariaLabel="Motivo de não participação"
                className="select-menu-field"
              />
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
  todayKey,
  onMonthChange,
  onToday,
  onSelect,
}: {
  activities: Activity[];
  monthKey: string;
  todayKey: string;
  onMonthChange: (monthKey: string) => void;
  onToday: () => void;
  onSelect: (activityId: string) => void;
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
          <button type="button" className="calendar-today" onClick={onToday}>Hoje</button>
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
            <button type="button" role="gridcell" className={`calendar-cell ${dayItems.length ? "has-activity" : ""} ${date === todayKey ? "is-today" : ""}`} key={day} onClick={() => activity && onSelect(activity.id)} aria-label={`${day} de ${monthLabel(monthKey)}${dayItems.length ? `: ${dayItems.map((item) => item.title).join(", ")}` : ""}`}>
              <span>{day}</span>
              {activity && <><i title={activity.title} />{dayItems.length > 1 && <b>{dayItems.length}</b>}</>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActivityComposer({ proposals, initialProposalId, onCancel, onCreate }: { proposals: Proposal[]; initialProposalId?: string; onCancel: () => void; onCreate: (activity: { proposalId: string; title: string; date: string; time: string; place: string; audience: string }) => void }) {
  const list = proposals.filter((proposal) => proposal.status === "development" || proposal.status === "analysis");
  const initialProposal = list.find((proposal) => proposal.id === initialProposalId) ?? list[0];
  const [proposalId, setProposalId] = useState(initialProposal?.id ?? "");
  const [title, setTitle] = useState(initialProposal?.title ?? "Atividade no recreio");
  const [date, setDate] = useState(localDateKey(new Date()));
  const [time, setTime] = useState("10:15–10:35");
  const [place, setPlace] = useState("Pátio central");
  const minDate = localDateKey(new Date());

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!proposalId || !title.trim() || !isValidDateKey(date) || date < minDate || !place.trim()) return;
    onCreate({ proposalId, title: title.trim(), date, time, place: place.trim(), audience: "Todas as turmas" });
  }

  return (
    <form id="activity-composer" className="activity-form" onSubmit={submit}>
      <div className="composer-panel-head">
        <div>
          <span className="eyebrow">NOVA ATIVIDADE</span>
          <h2>Colocar uma proposta na agenda</h2>
          <p>A atividade será adicionada à agenda e os estudantes receberão um aviso.</p>
        </div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Fechar agenda"><Icon name="close" size={20} /></button>
      </div>
      {list.length > 0 ? <>
        <div className="form-field">
          <span className="form-field-label">Proposta de origem</span>
          <SelectMenu
            value={proposalId}
            onChange={(value) => { setProposalId(value); const p = list.find((item) => item.id === value); if (p) setTitle(p.title); }}
            options={list.map((p) => ({ value: p.id, label: p.title }))}
            ariaLabel="Proposta de origem da atividade"
            className="select-menu-field"
          />
        </div>
        <label>Título da atividade<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <div className="form-row">
          <label>Data<input type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Horário<input value={time} onChange={(event) => setTime(event.target.value)} /></label>
        </div>
        <label>Local<input value={place} onChange={(event) => setPlace(event.target.value)} /></label>
        <div className="composer-help"><Icon name="bell" size={16} /> Todas as turmas receberão o aviso dentro da plataforma.</div>
      </> : <p className="activity-no-proposals" role="status">Só é possível agendar propostas em análise ou em desenvolvimento.</p>}
      <div className="composer-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary-button" disabled={!list.length || !proposalId || !title.trim() || !isValidDateKey(date) || date < minDate || !place.trim()}>Publicar na agenda <Icon name="arrow" size={16} /></button>
      </div>
    </form>
  );
}

function AuthView({ onLogin }: { onLogin: (name: string, password: string) => Promise<string | null> }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [legacyUsername, setLegacyUsername] = useState("");
  const [legacyPassword, setLegacyPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [legacyLinkRequested, setLegacyLinkRequested] = useState(false);
  const authErrorCode = useSyncExternalStore(subscribeToAuthLocation, getAuthErrorSnapshot, getServerAuthErrorSnapshot);
  const displayedError = error || getAuthErrorMessage(authErrorCode);
  const legacyLinkOpen = legacyLinkRequested || authErrorCode.startsWith("legacy-link-");

  function clearError() {
    setError("");
    if (authErrorCode) {
      window.history.replaceState(null, "", "/app");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    clearError();
    const result = await onLogin(name.trim(), password);
    setBusy(false);
    if (result) setError(result);
  }

  async function submitLegacyLink(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setLegacyLinkRequested(true);
    clearError();
    try {
      const response = await fetch("/api/auth/link-legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: legacyUsername, password: legacyPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        setBusy(false);
        setError(result.error || "Não foi possível validar essa conta antiga.");
        return;
      }
      const continueTo = typeof result.data?.continueTo === "string" ? result.data.continueTo : "/api/auth/google?mode=link";
      window.location.assign(continueTo);
    } catch {
      setBusy(false);
      setError("Não foi possível iniciar o vínculo agora. Tente novamente.");
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand" aria-label="Comunica Farroupilha">
        <Image src="/brand/gremio-comunica.webp" alt="Megafone do GEF" width={120} height={80} priority />
      </div>
      <div className="auth-card">
        <span className="eyebrow">COMUNICA FARROUPILHA</span>
        <h1>Que bom ter você por aqui.</h1>
        <p>Entre para acompanhar as propostas e ajudar a construir o próximo recreio.</p>
        <form onSubmit={submit}>
          <label>Nome de usuário<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: ana.silva ou administrador" autoComplete="username" required /></label>
          <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          {displayedError && !legacyLinkOpen && <p className="form-error" role="alert">{displayedError}</p>}
          <button type="submit" className="primary-button auth-submit" disabled={busy}>
            {busy ? "Aguarde…" : "Entrar na plataforma"}
            <Icon name="arrow" size={16} />
          </button>
        </form>
        <div className="auth-divider"><span>ou</span></div>
        <button
          type="button"
          className="legacy-link-trigger"
          aria-expanded={legacyLinkOpen}
          aria-controls="legacy-link-form"
          onClick={() => { setLegacyLinkRequested(!legacyLinkOpen); clearError(); }}
        >
          Já tinha uma conta? Vincular histórico
        </button>
        {legacyLinkOpen && (
          <form id="legacy-link-form" className="legacy-link-form" onSubmit={submitLegacyLink}>
            <p>Confirme seu usuário e senha antigos. Em seguida, validaremos sua conta escolar do Google para manter suas propostas e apoios.</p>
            <label>Usuário antigo<input value={legacyUsername} onChange={(event) => setLegacyUsername(event.target.value)} autoComplete="username" required /></label>
            <label>Senha antiga<input type="password" value={legacyPassword} onChange={(event) => setLegacyPassword(event.target.value)} autoComplete="current-password" required /></label>
            {displayedError && <p className="form-error" role="alert">{displayedError}</p>}
            <button type="submit" className="secondary-button" disabled={busy}>
              {busy ? "Aguarde…" : "Vincular e confirmar com Google"}
            </button>
          </form>
        )}
        <a className="google-login-button" href="/api/auth/google">
          <span aria-hidden="true">G</span>Continuar com Google
        </a>
        <div className="auth-note">
          <Icon name="info" size={16} />
          <span>Estudantes entram com uma conta Google verificada @farroups.com.br. Vincule sua conta antiga antes de continuar para preservar seu histórico. O acesso do GEF é gerenciado pela equipe responsável.</span>
        </div>
      </div>
    </main>
  );
}

function getInitialUiPreferences() {
  if (typeof window === "undefined") return {};
  return parseUiPreferences(window.localStorage.getItem("comunica-farroupilha-ui"));
}

function getLegacyBrowserState() {
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem("comunica-farroupilha-legacy-imported")) return null;
  for (const key of ["comunica-farroupilha-demo", "gremio-comunica-demo"]) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      return { key, data: JSON.parse(raw) as unknown };
    } catch {}
  }
  return null;
}

export function GEFShell() {
  const [initialPreferences] = useState(getInitialUiPreferences);
  const [state, setState] = useState<DemoState>(defaultState);
  const [view, setView] = useState<View>(() =>
    initialPreferences.view && ["proposals", "saved", "agenda", "chapas", "notifications", "gef"].includes(initialPreferences.view) &&
    (initialPreferences.view !== "chapas" || ELECTIONS_ENABLED)
      ? initialPreferences.view as View
      : "proposals",
  );
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState(initialPreferences.query ?? "");
  const [themeFilter, setThemeFilter] = useState(initialPreferences.themeFilter ?? "Todos");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">((initialPreferences.statusFilter as ProposalStatus | "all") ?? "all");
  const [sort, setSort] = useState<"recent" | "supports">(initialPreferences.sort === "supports" ? "supports" : "recent");
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>(() =>
    ["all", "proposal", "comment", "activity", "system"].includes(initialPreferences.notificationFilter)
      ? initialPreferences.notificationFilter as NotificationFilter
      : "all",
  );
  const [unreadOnly, setUnreadOnly] = useState(initialPreferences.unreadOnly === "true");
  const [composerOpen, setComposerOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const todayKey = useSyncExternalStore(subscribeToLocalDate, getLocalDateSnapshot, getServerDateSnapshot);
  const [agendaMonthOverride, setAgendaMonthOverride] = useState<string | null>(null);
  const agendaMonthKey = agendaMonthOverride ?? (todayKey ? todayKey.slice(0, 7) : "");
  const [activityProposalId, setActivityProposalId] = useState("");
  const [pendingProposalScrollId, setPendingProposalScrollId] = useState<string | null>(null);
  const [pendingActivityScrollId, setPendingActivityScrollId] = useState<string | null>(null);
  const [pendingAgendaProposalScrollId, setPendingAgendaProposalScrollId] = useState<string | null>(null);
  const [agendaProposalId, setAgendaProposalId] = useState<string | null>(null);
  const [gefProposalId, setGefProposalId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState<"sidebar" | "topbar" | null>(null);
  const interactionRevisions = useRef(new Map<string, number>());
  const loadRevision = useRef(0);
  const loadController = useRef<AbortController | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState("");
  const [nextProposalCursor, setNextProposalCursor] = useState<string | null>(null);
  const [loadingOlderProposals, setLoadingOlderProposals] = useState(false);
  const [loadingCommentPages, setLoadingCommentPages] = useState<Record<string, boolean>>({});
  const [interactionError, setInteractionError] = useState("");
  const [legacyState, setLegacyState] = useState(getLegacyBrowserState);
  const [legacyImportStatus, setLegacyImportStatus] = useState<"idle" | "importing" | "success">("idle");
  const [evaluatingActivity, setEvaluatingActivity] = useState<Activity | null>(null);
  const [summaryActivity, setSummaryActivity] = useState<Activity | null>(null);

  const refreshPlatform = useCallback(async () => {
    const revision = ++loadRevision.current;
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    setLoadStatus("loading");
    setLoadError("");
    try {
      const { user, snapshot } = await loadPlatform(controller.signal);
      if (revision !== loadRevision.current) return;
      setState({
        user,
        proposals: snapshot.proposals,
        comments: snapshot.comments,
        activities: snapshot.activities,
        notifications: snapshot.notifications,
        commentCursorsByProposal: snapshot.commentCursorsByProposal,
        supportedByUser: snapshot.supportedByUser,
        savedByUser: snapshot.savedByUser,
        likedCommentsByUser: snapshot.likedCommentsByUser,
        supporters: snapshot.supportersByProposal,
        activityFeedbacks: snapshot.activityFeedbacks,
        chapaQuestions: snapshot.chapaQuestions,
      });
      setNextProposalCursor(snapshot.nextProposalCursor);
      setLoadStatus("ready");
    } catch (error) {
      if (controller.signal.aborted || revision !== loadRevision.current) return;
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a plataforma.");
      setLoadStatus("error");
    }
  }, []);

  async function loadOlderProposals() {
    const cursor = nextProposalCursor;
    if (!cursor || loadingOlderProposals) return;
    setLoadingOlderProposals(true);
    try {
      const { snapshot } = await loadPlatform(new AbortController().signal, fetch, cursor);
      setState((current) => {
        if (!current.user) return current;
        const currentPage = {
          proposals: current.proposals,
          comments: current.comments,
          activities: current.activities,
          notifications: current.notifications,
          commentCursorsByProposal: current.commentCursorsByProposal,
          supportedByUser: current.supportedByUser,
          savedByUser: current.savedByUser,
          likedCommentsByUser: current.likedCommentsByUser,
          supportersByProposal: current.supporters,
          chapas: [],
          activityFeedbacks: current.activityFeedbacks,
          chapaQuestions: current.chapaQuestions,
          nextProposalCursor: cursor,
        };
        const merged = mergePlatformPage(currentPage, snapshot, current.user.id);
        return {
          ...current,
          proposals: merged.proposals,
          comments: merged.comments,
          activities: merged.activities,
          notifications: merged.notifications,
          commentCursorsByProposal: merged.commentCursorsByProposal,
          supportedByUser: merged.supportedByUser,
          savedByUser: merged.savedByUser,
          likedCommentsByUser: merged.likedCommentsByUser,
          supporters: merged.supportersByProposal,
          activityFeedbacks: merged.activityFeedbacks,
          chapaQuestions: merged.chapaQuestions,
        };
      });
      setNextProposalCursor(snapshot.nextProposalCursor);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : "Não foi possível carregar propostas anteriores.");
    } finally {
      setLoadingOlderProposals(false);
    }
  }

  async function loadOlderComments(proposalId: string) {
    const cursor = state.commentCursorsByProposal[proposalId];
    if (!cursor || loadingCommentPages[proposalId]) return;
    setLoadingCommentPages((current) => ({ ...current, [proposalId]: true }));
    try {
      const response = await fetch(`/api/proposals/${proposalId}/comments?cursor=${encodeURIComponent(cursor)}`, { cache: "no-store" });
      const body = await response.json();
      const page = body?.data;
      if (!response.ok || !page || !Array.isArray(page.comments)) {
        throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível carregar comentários anteriores.");
      }
      const likedIds = Array.isArray(page.likedCommentIds) ? page.likedCommentIds.filter((id: unknown): id is string => typeof id === "string") : [];
      setState((current) => {
        const userId = current.user?.id;
        return {
          ...current,
          comments: mergeById(page.comments as ProposalComment[], current.comments),
          ...(userId ? {
            likedCommentsByUser: {
              ...current.likedCommentsByUser,
              [userId]: Array.from(new Set([...(current.likedCommentsByUser[userId] ?? []), ...likedIds])),
            },
          } : {}),
          commentCursorsByProposal: { ...current.commentCursorsByProposal, [proposalId]: page.nextCursor ?? null },
        };
      });
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : "Não foi possível carregar comentários anteriores.");
    } finally {
      setLoadingCommentPages((current) => ({ ...current, [proposalId]: false }));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshPlatform(), 0);
    return () => {
      window.clearTimeout(timer);
      loadController.current?.abort();
    };
  }, [refreshPlatform]);

  useEffect(() => {
    window.localStorage.setItem("comunica-farroupilha-ui", serializeUiPreferences({ view, query, themeFilter, statusFilter, sort, notificationFilter, unreadOnly: String(unreadOnly) }));
  }, [view, query, themeFilter, statusFilter, sort, notificationFilter, unreadOnly]);

  useEffect(() => {
    if (view !== "proposals" || !pendingProposalScrollId || !state.proposals.some((proposal) => proposal.id === pendingProposalScrollId)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`proposal-${pendingProposalScrollId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingProposalScrollId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingProposalScrollId, state.proposals, view]);

  useEffect(() => {
    if (view !== "proposals" || !composerOpen) return;
    const frame = window.requestAnimationFrame(() => document.getElementById("proposal-composer")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [composerOpen, view]);

  useEffect(() => {
    if (view !== "agenda" || !pendingActivityScrollId || !state.activities.some((activity) => activity.id === pendingActivityScrollId)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`activity-${pendingActivityScrollId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setPendingActivityScrollId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [agendaMonthKey, pendingActivityScrollId, state.activities, view]);

  useEffect(() => {
    if (view !== "gef" || !gefProposalId) return;
    const frame = window.requestAnimationFrame(() => document.getElementById("gef-proposal-preview")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [gefProposalId, view]);

  useEffect(() => {
    if (view !== "agenda" || !pendingAgendaProposalScrollId || agendaProposalId !== pendingAgendaProposalScrollId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("agenda-proposal-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingAgendaProposalScrollId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [agendaProposalId, pendingAgendaProposalScrollId, view]);

  useEffect(() => {
    if (!activityOpen) return;
    const frame = window.requestAnimationFrame(() => document.getElementById("activity-composer")?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [activityOpen]);

  const user = state.user;
  const isGef = user?.role === "gef";
  const unread = state.notifications.filter((notification) => !notification.read).length;
  const visibleNotifications = filterNotifications(state.notifications, notificationFilter, unreadOnly);

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

  const userLikedCommentIds = useMemo(() => {
    if (!user) return [];
    return state.likedCommentsByUser?.[user.id] ?? [];
  }, [user, state.likedCommentsByUser]);

  const selected = state.proposals.find((proposal) => proposal.id === selectedId) ?? filteredProposals[0] ?? state.proposals[0];
  const olderProposalsButton = nextProposalCursor ? (
    <div className="load-older-wrap">
      <button type="button" className="secondary-button" onClick={() => void loadOlderProposals()} disabled={loadingOlderProposals}>
        {loadingOlderProposals ? "Carregando…" : "Carregar propostas anteriores"}
        <Icon name="arrow" size={15} />
      </button>
    </div>
  ) : null;
  const savedProposals = useMemo(() => {
    if (!user) return [];
    return state.proposals.filter((proposal) => userSavedIds.includes(proposal.id));
  }, [user, state.proposals, userSavedIds]);
  const agendaActivities = useMemo(() => state.activities.filter((activity) => activity.date.slice(0, 7) === agendaMonthKey).sort((a, b) => a.date.localeCompare(b.date)), [state.activities, agendaMonthKey]);
  const agendaProposal = agendaProposalId ? state.proposals.find((proposal) => proposal.id === agendaProposalId) : undefined;
  const gefProposal = gefProposalId ? state.proposals.find((proposal) => proposal.id === gefProposalId) : undefined;
  const gefQueue = useMemo(() => state.proposals
    .filter((proposal) => ["received", "analysis", "development"].includes(proposal.status))
    .sort((a, b) => ["received", "analysis", "development"].indexOf(a.status) - ["received", "analysis", "development"].indexOf(b.status)), [state.proposals]);
  const gefThemeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const proposal of state.proposals) counts.set(proposal.theme, (counts.get(proposal.theme) ?? 0) + 1);
    return Array.from(counts, ([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count);
  }, [state.proposals]);
  const legacyPreview = useMemo(() => legacyState ? previewLegacyState(legacyState.data) : null, [legacyState]);

  async function login(name: string, password: string): Promise<string | null> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Nome de usuário ou senha incorretos.";
      await refreshPlatform();
      setView("proposals");
      return null;
    } catch {
      return "Erro ao conectar com o servidor.";
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    await refreshPlatform();
    setProfileOpen(null);
  }

  function changeView(next: View) {
    setView(next === "chapas" && !ELECTIONS_ENABLED ? "proposals" : next);
    setProfileOpen(null);
    setComposerOpen(false);
    setActivityOpen(false);
  }

  async function openProposal(id: string) {
    exploreProposals();
    if (state.proposals.some((proposal) => proposal.id === id)) {
      setSelectedId(id);
      setPendingProposalScrollId(id);
      return;
    }

    try {
      const [proposalResponse, commentsResponse] = await Promise.all([
        fetch(`/api/proposals/${id}`, { cache: "no-store" }),
        fetch(`/api/proposals/${id}/comments`, { cache: "no-store" }),
      ]);
      const [proposalBody, commentsBody] = await Promise.all([proposalResponse.json(), commentsResponse.json()]);
      const proposal = proposalBody?.data as (Proposal & { supporters?: Supporter[]; supported?: boolean; saved?: boolean }) | undefined;
      const commentsPage = commentsBody?.data;
      if (!proposalResponse.ok || !proposal?.id || !commentsResponse.ok || !Array.isArray(commentsPage?.comments)) {
        throw new Error("Não foi possível abrir esta proposta.");
      }
      const commentLikes = Array.isArray(commentsPage.likedCommentIds)
        ? commentsPage.likedCommentIds.filter((commentId: unknown): commentId is string => typeof commentId === "string")
        : [];
      setState((current) => {
        const userId = current.user?.id;
        const updateIds = (ids: string[], enabled: boolean) => {
          const withoutProposal = ids.filter((savedId) => savedId !== id);
          return enabled ? [...withoutProposal, id] : withoutProposal;
        };
        return {
          ...current,
          proposals: mergeById([proposal], current.proposals),
          comments: mergeById(commentsPage.comments as ProposalComment[], current.comments),
          supporters: { ...current.supporters, [id]: proposal.supporters ?? [] },
          ...(userId ? {
            supportedByUser: { ...current.supportedByUser, [userId]: updateIds(current.supportedByUser[userId] ?? [], proposal.supported === true) },
            savedByUser: { ...current.savedByUser, [userId]: updateIds(current.savedByUser[userId] ?? [], proposal.saved === true) },
            likedCommentsByUser: {
              ...current.likedCommentsByUser,
              [userId]: Array.from(new Set([...(current.likedCommentsByUser[userId] ?? []), ...commentLikes])),
            },
          } : {}),
          commentCursorsByProposal: { ...current.commentCursorsByProposal, [id]: commentsPage.nextCursor ?? null },
        };
      });
      setSelectedId(id);
      setPendingProposalScrollId(id);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : "Não foi possível abrir esta proposta.");
    }
  }

  function openComposer() {
    changeView("proposals");
    setComposerOpen(true);
  }

  function exploreProposals() {
    setQuery("");
    setThemeFilter("Todos");
    setStatusFilter("all");
    setSort("recent");
    changeView("proposals");
  }

  async function toggleSupport(id: string) {
    if (!user) return;
    const currentUser = user;
    const wasSupported = userSupportedIds.includes(id);
    const previousSupports = state.proposals.find((proposal) => proposal.id === id)?.supports ?? 0;
    const optimisticSupported = !wasSupported;
    const interactionKey = `support:${id}`;
    const interactionRevision = beginInteraction(interactionRevisions.current, interactionKey);

    setInteractionError("");
    setState((curr) => applySupportState(curr, currentUser, id, optimisticSupported, Math.max(0, previousSupports + (optimisticSupported ? 1 : -1))));

    try {
      const res = await fetch(`/api/proposals/${id}/support`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ supported: optimisticSupported, revision: interactionRevision }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível atualizar o apoio.");
      if (!isLatestInteraction(interactionRevisions.current, interactionKey, interactionRevision)) return;
      const supported = typeof data.data?.supported === "boolean" ? data.data.supported : optimisticSupported;
      const totalSupports = typeof data.data?.supports === "number" ? data.data.supports : previousSupports + (supported ? 1 : -1);
      setState((curr) => applySupportState(curr, currentUser, id, supported, Math.max(0, totalSupports)));
    } catch (err) {
      if (!isLatestInteraction(interactionRevisions.current, interactionKey, interactionRevision)) return;
      setState((curr) => applySupportState(curr, currentUser, id, wasSupported, previousSupports));
      setInteractionError(err instanceof Error ? err.message : "Não foi possível atualizar o apoio.");
    }
  }

  async function toggleSaved(id: string) {
    if (!user) return;
    const currentUser = user;
    const wasSaved = userSavedIds.includes(id);
    const optimisticSaved = !wasSaved;
    const interactionKey = `save:${id}`;
    const interactionRevision = beginInteraction(interactionRevisions.current, interactionKey);

    setInteractionError("");
    setState((curr) => applySavedState(curr, currentUser.id, id, optimisticSaved));

    try {
      const res = await fetch(`/api/proposals/${id}/save`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ saved: optimisticSaved, revision: interactionRevision }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível atualizar o acompanhamento.");
      if (!isLatestInteraction(interactionRevisions.current, interactionKey, interactionRevision)) return;
      const saved = typeof data.data?.saved === "boolean" ? data.data.saved : optimisticSaved;
      setState((curr) => applySavedState(curr, currentUser.id, id, saved));
    } catch (err) {
      if (!isLatestInteraction(interactionRevisions.current, interactionKey, interactionRevision)) return;
      setState((curr) => applySavedState(curr, currentUser.id, id, wasSaved));
      setInteractionError(err instanceof Error ? err.message : "Não foi possível atualizar o acompanhamento.");
    }
  }

  async function createProposal(input: { title: string; body: string; theme: string }) {
    if (!user) return;
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível publicar a proposta.");
      const newProposal: Proposal = data.data;
      setState((curr) => ({
        ...curr,
        proposals: [newProposal, ...curr.proposals],
        supporters: { ...curr.supporters, [newProposal.id]: [] },
      }));
      setComposerOpen(false);
      openProposal(newProposal.id);
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível publicar a proposta.");
    }
  }

  async function cancelUserProposal(id: string) {
    if (!window.confirm("Cancelar esta proposta? Ela continuará visível no histórico com o status Cancelada.")) return;
    try {
      const res = await fetch(`/api/proposals/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível cancelar a proposta.");
      const updated: Proposal = data.data;
      setState((curr) => ({ ...curr, proposals: curr.proposals.map((proposal) => proposal.id === id ? updated : proposal) }));
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível cancelar a proposta.");
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
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível atualizar a proposta.");
      const updated: Proposal = data.data;
      setState((curr) => ({
        ...curr,
        proposals: curr.proposals.map((proposal) => proposal.id === id ? updated : proposal),
      }));
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível atualizar a proposta.");
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
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível salvar a resposta do GEF.");
      const updated: Proposal = data.data;
      setState((curr) => ({
        ...curr,
        proposals: curr.proposals.map((proposal) => proposal.id === id ? updated : proposal),
      }));
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível salvar a resposta do GEF.");
    }
  }

  async function addComment(body: string, parentId?: string, proposalIdOverride?: string) {
    if (!user) return;
    const proposalId = proposalIdOverride ?? selected?.id;
    if (!proposalId) return;
    try {
      const res = await fetch(`/api/proposals/${proposalId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, ...(parentId ? { parentId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível publicar o comentário.");
      const newComment: ProposalComment = data.data;
      setState((curr) => ({
        ...curr,
        comments: [...curr.comments, newComment],
        proposals: curr.proposals.map((p) => p.id === proposalId ? { ...p, comments: p.comments + 1, updatedAt: "Agora" } : p),
      }));
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível publicar o comentário.");
    }
  }

  async function toggleCommentLike(commentId: string) {
    if (!user) return;
    const currentUser = user;
    const wasLiked = userLikedCommentIds.includes(commentId);
    const previousLikes = state.comments.find((comment) => comment.id === commentId)?.likes ?? 0;
    const optimisticLiked = !wasLiked;
    const interactionKey = `like:${commentId}`;
    const interactionRevision = beginInteraction(interactionRevisions.current, interactionKey);
    setInteractionError("");
    setState((curr) => applyCommentLikeState(curr, currentUser.id, commentId, optimisticLiked, Math.max(0, previousLikes + (optimisticLiked ? 1 : -1))));

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: optimisticLiked, revision: interactionRevision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível atualizar a curtida.");
      if (!isLatestInteraction(interactionRevisions.current, interactionKey, interactionRevision)) return;
      const liked = typeof data.data?.liked === "boolean" ? data.data.liked : optimisticLiked;
      const likes = typeof data.data?.likes === "number" ? data.data.likes : previousLikes + (liked ? 1 : -1);
      setState((curr) => applyCommentLikeState(curr, currentUser.id, commentId, liked, Math.max(0, likes)));
    } catch (err) {
      if (!isLatestInteraction(interactionRevisions.current, interactionKey, interactionRevision)) return;
      setState((curr) => applyCommentLikeState(curr, currentUser.id, commentId, wasLiked, previousLikes));
      setInteractionError(err instanceof Error ? err.message : "Não foi possível atualizar a curtida.");
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
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível criar a atividade.");
      const newActivity: Activity = data.data;
      setState((curr) => ({
        ...curr,
        activities: [newActivity, ...curr.activities],
        proposals: curr.proposals.map((p) => p.id === activityInput.proposalId ? { ...p, status: "scheduled", updatedAt: "Agora" } : p),
      }));
      setAgendaMonthOverride(newActivity.date.slice(0, 7));
      setAgendaProposalId(newActivity.proposalId);
      setActivityProposalId("");
      setActivityOpen(false);
      setView("agenda");
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível criar a atividade.");
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
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível atualizar a atividade.");
      const updated: Activity = data.data;
      setState((curr) => ({
        ...curr,
        activities: curr.activities.map((activity) => activity.id === activityId ? updated : activity),
        proposals: status === "done" ? curr.proposals.map((p) => {
          const act = curr.activities.find((a) => a.id === activityId);
          return act && act.proposalId === p.id ? { ...p, status: "completed", updatedAt: "Agora" } : p;
        }) : curr.proposals,
      }));
      if (summaryActivity && summaryActivity.id === activityId) {
        setSummaryActivity(updated);
      }
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível atualizar a atividade.");
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
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível enviar a avaliação.");
      const newFeedback: ActivityFeedback = data.data;
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
      setInteractionError(err instanceof Error ? err.message : "Não foi possível enviar a avaliação.");
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
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível enviar a dúvida.");
      const newQ: ChapaQuestion = data.data;
      setState((curr) => ({
        ...curr,
        chapaQuestions: [newQ, ...curr.chapaQuestions],
      }));
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível enviar a dúvida.");
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
      if (!res.ok || !data.data) throw new Error(data.error || "Não foi possível responder a dúvida.");
      const updated: ChapaQuestion = data.data;
      setState((curr) => ({
        ...curr, chapaQuestions: curr.chapaQuestions.map((question) => question.id === questionId ? updated : question),
      }));
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : "Não foi possível responder a dúvida.");
    }
  }

  async function markAllRead() {
    const previous = state.notifications;
    setState((curr) => ({ ...curr, notifications: curr.notifications.map((n) => ({ ...n, read: true })) }));
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) });
      if (!response.ok) throw new Error("Não foi possível atualizar as notificações.");
    } catch (error) {
      const readById = new Map(previous.map((item) => [item.id, item.read]));
      setState((curr) => ({ ...curr, notifications: curr.notifications.map((item) => ({ ...item, read: readById.get(item.id) ?? item.read })) }));
      setInteractionError(error instanceof Error ? error.message : "Não foi possível atualizar as notificações.");
    }
  }

  async function openNotification(notification: Notification) {
    const wasRead = notification.read;
    if (!wasRead) setState((curr) => ({ ...curr, notifications: curr.notifications.map((item) => item.id === notification.id ? { ...item, read: true } : item) }));
    if (!wasRead) {
      void fetch("/api/notifications", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: notification.id }),
        }).then((response) => {
          if (!response.ok) throw new Error("Não foi possível marcar a notificação como lida.");
        }).catch((error: unknown) => {
        setState((curr) => ({ ...curr, notifications: curr.notifications.map((item) => item.id === notification.id ? { ...item, read: wasRead } : item) }));
        setInteractionError(error instanceof Error ? error.message : "Não foi possível atualizar a notificação.");
      });
    }

    const destination = getNotificationDestination(notification);
    if (!destination) return;
    if (destination.view === "agenda") {
      let activity = state.activities.find((item) => item.id === destination.activityId);
      if (!activity && destination.activityId) {
        try {
          const response = await fetch(`/api/activities/${destination.activityId}`, { cache: "no-store" });
          const body = await response.json();
          if (!response.ok || !body?.data?.id) throw new Error("Não foi possível abrir esta atividade.");
          activity = body.data as Activity;
          setState((current) => ({ ...current, activities: mergeById([activity!], current.activities) }));
        } catch (error) {
          setInteractionError(error instanceof Error ? error.message : "Não foi possível abrir esta atividade.");
        }
      }
      if (activity) {
        setAgendaMonthOverride(activity.date.slice(0, 7));
        setPendingActivityScrollId(activity.id);
      }
      changeView("agenda");
      return;
    }
    if (destination.proposalId) await openProposal(destination.proposalId);
  }

  async function importLegacyData() {
    if (!legacyState || !user || user.role !== "gef") return;
    setLegacyImportStatus("importing");
    setInteractionError("");
    try {
      const response = await fetch("/api/admin/legacy-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sanitizeLegacyImport(legacyState.data)),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível importar os dados antigos.");
      window.localStorage.setItem("comunica-farroupilha-legacy-imported", body.data?.migrationKey ?? "done");
      setLegacyImportStatus("success");
      await refreshPlatform();
      setView("gef");
    } catch (error) {
      setLegacyImportStatus("idle");
      setInteractionError(error instanceof Error ? error.message : "Não foi possível importar os dados antigos.");
    }
  }

  function clearLegacyData() {
    window.localStorage.removeItem("comunica-farroupilha-demo");
    window.localStorage.removeItem("gremio-comunica-demo");
    setLegacyState(null);
  }

  function resetDemo() {
    window.localStorage.removeItem("comunica-farroupilha-ui");
    setView("proposals");
    setProfileOpen(null);
    void refreshPlatform();
  }

  if (loadStatus === "loading") {
    return (
      <div className="app-loading">
        <span className="loading-mark"><Icon name="message" size={24} /></span>
        <span>Carregando a conversa…</span>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <main className="app-load-error" role="alert">
        <span className="loading-mark"><Icon name="info" size={24} /></span>
        <h1>Não foi possível carregar a plataforma</h1>
        <p>{loadError}</p>
        <button type="button" className="primary-button tactile-control" onClick={() => void refreshPlatform()}>
          Tentar novamente
        </button>
      </main>
    );
  }

  if (!user) {
    return <AuthView onLogin={login} />;
  }

  return (
    <div className="app-shell">
      {interactionError && (
        <div className="interaction-error" role="status">
          <Icon name="info" size={17} />
          <span>{interactionError}</span>
          <button type="button" aria-label="Fechar aviso" onClick={() => setInteractionError("")}><Icon name="close" size={14} /></button>
        </div>
      )}
      <a className="app-skip" href="#app-content">Pular para o conteúdo</a>
      <aside className="app-sidebar">
        <div className="app-logo" aria-label="Comunica Farroupilha">
          <Image src="/brand/gremio-comunica.webp" alt="Megafone do GEF" width={107} height={72} priority />
        </div>
        <nav aria-label="Navegação da plataforma">
          <button className={view === "proposals" ? "active" : ""} onClick={() => changeView("proposals")}><Icon name="message" size={20} />Propostas</button>
          <button className={view === "saved" ? "active" : ""} onClick={() => changeView("saved")}><Icon name="bookmark" size={20} />Acompanhando</button>
          <button className={view === "agenda" ? "active" : ""} onClick={() => changeView("agenda")}><Icon name="calendar" size={20} />Agenda</button>
          {ELECTIONS_ENABLED && <button className={view === "chapas" ? "active" : ""} onClick={() => changeView("chapas")}><Icon name="users" size={20} />Chapas</button>}
          <button className={view === "notifications" ? "active" : ""} onClick={() => changeView("notifications")}>
            <Icon name="bell" size={20} />Notificações{unread > 0 && <span className="nav-count">{unread}</span>}
          </button>
          {isGef && <button className={view === "gef" ? "active" : ""} onClick={() => changeView("gef")}><Image className="gef-nav-mark" src="/brand/gef.png" alt="" width={21} height={21} />Visão do GEF</button>}
        </nav>
        <button className="sidebar-create tactile-control" onClick={openComposer}>
          <Icon name="plus" size={21} />{isGef ? "Criar consulta" : "Criar proposta"}
        </button>
        <div className="profile-wrap">
          <button className="profile-button" onClick={() => setProfileOpen((open) => open === "sidebar" ? null : "sidebar")}>
            <span><strong>{user.name}</strong><small>{isGef ? "Administrador GEF" : user.turma}</small></span>
            <Icon name="chevron" size={17} />
          </button>
          {profileOpen === "sidebar" && <ProfileMenu onLogout={logout} onReset={resetDemo} />}
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
            <div className="topbar-profile-wrap">
              <button className="top-profile-button" onClick={() => setProfileOpen((open) => open === "topbar" ? null : "topbar")} aria-label={`Abrir menu do perfil de ${user.name}`}>
                <Icon name="users" size={19} />
              </button>
              {profileOpen === "topbar" && <ProfileMenu onLogout={logout} onReset={resetDemo} />}
            </div>
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
              {composerOpen && <Composer user={user} onCancel={() => setComposerOpen(false)} onCreate={createProposal} />}

              <section className="content-heading">
                <div>
                  <h2>Propostas da comunidade</h2>
                  <p>Veja, apoie e comente ideias criadas por estudantes e consultas abertas pelo GEF.</p>
                </div>
                <button className="primary-button heading-action tactile-control" onClick={openComposer}>
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
                  <SelectMenu
                    value={themeFilter}
                    onChange={setThemeFilter}
                    options={["Todos", ...THEMES].map((item) => ({ value: item, label: item }))}
                    ariaLabel="Filtrar propostas por tema"
                    className="select-menu-inline"
                  />
                </label>
                <label className="select-filter">
                  <span className="status-filter-dot" />
                  <span className="filter-label">Situação:</span>
                  <SelectMenu
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as ProposalStatus | "all")}
                    options={[{ value: "all", label: "Todas" }, ...Object.entries(STATUS).map(([key, item]) => ({ value: key, label: item.label }))]}
                    ariaLabel="Filtrar propostas por situação"
                    className="select-menu-inline"
                  />
                </label>
                <label className="select-filter sort-filter">
                  <Icon name="filter" size={16} />
                  <span className="filter-label">Ordenar:</span>
                  <SelectMenu
                    value={sort}
                    onChange={(value) => setSort(value as "recent" | "supports")}
                    options={[{ value: "recent", label: "Mais recentes" }, { value: "supports", label: "Mais apoiadas" }]}
                    ariaLabel="Ordenar propostas"
                    className="select-menu-inline"
                  />
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
                      canCancel={canCancelProposal(proposal, user.id, user.role)}
                      onSelect={() => setSelectedId(proposal.id)}
                      onSupport={() => toggleSupport(proposal.id)}
                      onSave={() => toggleSaved(proposal.id)}
                      onStatus={(status) => changeStatus(proposal.id, status)}
                      onCancel={() => cancelUserProposal(proposal.id)}
                    />
                    {selected?.id === proposal.id && (
                      <ProposalDetail
                        proposal={proposal}
                        comments={state.comments}
                        isGef={isGef}
                        onComment={addComment}
                        onLike={toggleCommentLike}
                        likedCommentIds={userLikedCommentIds}
                        hasOlderComments={Boolean(state.commentCursorsByProposal[proposal.id])}
                        loadingOlderComments={Boolean(loadingCommentPages[proposal.id])}
                        onLoadOlderComments={() => void loadOlderComments(proposal.id)}
                        onSubmitGefResponse={submitGefResponse}
                      />
                    )}
                  </div>
                ))}
                {filteredProposals.length === 0 && (
                  <div className="empty-state">
                    <Icon name={state.proposals.length === 0 ? "spark" : "search"} size={26} />
                    <h3>{state.proposals.length === 0 ? "Nenhuma proposta publicada ainda" : "Nenhuma proposta encontrada"}</h3>
                    <p>{state.proposals.length === 0 ? "Seja o primeiro a compartilhar uma ideia com a comunidade escolar!" : "Tente outra busca ou limpe os filtros."}</p>
                  </div>
                )}
              </div>
              {olderProposalsButton}
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
                  <button type="button" className="primary-button" onClick={exploreProposals}>
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
                        canCancel={canCancelProposal(proposal, user.id, user.role)}
                        onSelect={() => setSelectedId(proposal.id)}
                        onSupport={() => toggleSupport(proposal.id)}
                        onSave={() => toggleSaved(proposal.id)}
                        onStatus={(status) => changeStatus(proposal.id, status)}
                        onCancel={() => cancelUserProposal(proposal.id)}
                      />
                      {selected?.id === proposal.id && (
                        <ProposalDetail
                          proposal={proposal}
                          comments={state.comments}
                          isGef={isGef}
                          onComment={addComment}
                          onLike={toggleCommentLike}
                          likedCommentIds={userLikedCommentIds}
                          hasOlderComments={Boolean(state.commentCursorsByProposal[proposal.id])}
                          loadingOlderComments={Boolean(loadingCommentPages[proposal.id])}
                          onLoadOlderComments={() => void loadOlderComments(proposal.id)}
                          onSubmitGefResponse={submitGefResponse}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {olderProposalsButton}
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
                  <button className="primary-button heading-action" onClick={() => { setActivityProposalId(""); setActivityOpen(true); }}>
                    <Icon name="plus" size={17} />Nova atividade
                  </button>
                )}
              </div>

              {activityOpen && isGef && (
                <ActivityComposer proposals={state.proposals} initialProposalId={activityProposalId || undefined} onCancel={() => setActivityOpen(false)} onCreate={createActivity} />
              )}

              {agendaMonthKey ? <>
                <div className="agenda-toolbar">
                  <strong>{monthLabel(agendaMonthKey)}</strong>
                  <span className="agenda-view-label">Calendário mensal</span>
                </div>

                <CalendarMonth
                  activities={agendaActivities}
                  monthKey={agendaMonthKey}
                  todayKey={todayKey}
                  onMonthChange={setAgendaMonthOverride}
                  onToday={() => setAgendaMonthOverride(null)}
                  onSelect={(activityId) => {
                    const activity = agendaActivities.find((item) => item.id === activityId);
                    if (activity) {
                      setAgendaProposalId(activity.proposalId);
                      setSelectedId(activity.proposalId);
                      setPendingActivityScrollId(activity.id);
                    }
                  }}
                />
              </> : <div className="agenda-calendar-loading" aria-busy="true" />}

              <div className="agenda-list">
                {agendaActivities.map((activity) => {
                  const feedbacks = state.activityFeedbacks[activity.id] ?? [];
                  const userFeedback = feedbacks.find((f) => f.userId === user.id);
                  const isDone = activity.status === "done";
                  const isCancelled = activity.status === "cancelled";
                  const datePassed = activity.status === "upcoming" && !!todayKey && activity.date < todayKey;

                  return (
                    <article id={`activity-${activity.id}`} className={`activity-card ${isDone ? "is-done" : ""} ${isCancelled ? "is-cancelled" : ""}`} key={activity.id}>
                      <div className="activity-date">
                        <strong>{new Date(`${activity.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</strong>
                        <span>{new Date(`${activity.date}T12:00:00`).getDate()}</span>
                      </div>
                      <div className="activity-info">
                        <div className="activity-badges">
                          <span className={`activity-status-badge ${datePassed ? "stale" : activity.status}`}>
                            {datePassed ? "Aguardando atualização" : activity.status === "upcoming" ? "Agendada / Em breve" : activity.status === "done" ? "Realizada" : "Cancelada"}
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
                        <button className="outline-button" onClick={() => { setAgendaProposalId(activity.proposalId); setSelectedId(activity.proposalId); setPendingAgendaProposalScrollId(activity.proposalId); }}>
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
                <div id="agenda-proposal-preview">
                  <ProposalPreview
                    proposal={agendaProposal}
                    comments={state.comments}
                    isGef={isGef}
                    supported={userSupportedIds.includes(agendaProposal.id)}
                    saved={userSavedIds.includes(agendaProposal.id)}
                    onSupport={() => toggleSupport(agendaProposal.id)}
                    onSave={() => toggleSaved(agendaProposal.id)}
                    onStatus={(status) => changeStatus(agendaProposal.id, status)}
                    onComment={(body, parentId) => addComment(body, parentId, agendaProposal.id)}
                    onLike={toggleCommentLike}
                    likedCommentIds={userLikedCommentIds}
                    hasOlderComments={Boolean(state.commentCursorsByProposal[agendaProposal.id])}
                    loadingOlderComments={Boolean(loadingCommentPages[agendaProposal.id])}
                    onLoadOlderComments={() => void loadOlderComments(agendaProposal.id)}
                    onSubmitGefResponse={submitGefResponse}
                    onClose={() => setAgendaProposalId(null)}
                  />
                </div>
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

          {ELECTIONS_ENABLED && view === "chapas" && (
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
                <button type="button" className="text-action" onClick={markAllRead}>Marcar todas como lidas</button>
              </div>
              <div className="notification-controls">
                <div className="notification-filters" role="group" aria-label="Filtrar notificações">
                  {([
                    ["all", "Todas"],
                    ["proposal", "Propostas"],
                    ["comment", "Conversas"],
                    ["activity", "Agenda"],
                    ["system", "Avisos"],
                  ] as const).map(([filter, label]) => (
                    <button key={filter} type="button" aria-pressed={notificationFilter === filter} onClick={() => setNotificationFilter(filter)}>{label}</button>
                  ))}
                </div>
                <button type="button" className={`notification-unread-filter ${unreadOnly ? "active" : ""}`} aria-pressed={unreadOnly} onClick={() => setUnreadOnly((value) => !value)}>
                  <Icon name="bell" size={15} />Não lidas
                </button>
              </div>
              <div className="notification-list">
                {visibleNotifications.map((notification) => {
                  const destination = getNotificationDestination(notification);
                  const icon: Record<NotificationType, string> = { proposal: "spark", comment: "message", activity: "calendar", system: "info" };
                  return <button
                    className={`notification-item type-${notification.type} ${notification.read ? "is-read" : ""}`}
                    key={notification.id}
                    onClick={() => void openNotification(notification)}
                    aria-label={`${notification.read ? "" : "Não lida. "}${notification.title}. ${destination ? "Abrir destino" : "Marcar como lida"}`}
                  >
                    <span className={`notification-icon ${notification.type}`}><Icon name={icon[notification.type]} size={19} /></span>
                    <span className="notification-copy">
                      <strong>{notification.title}{(notification.occurrences ?? 1) > 1 ? ` · ${notification.occurrences} eventos` : ""}</strong>
                      <small>{notification.body}</small>
                      <em>{notification.createdAt}</em>
                    </span>
                    {!notification.read && <span className="unread-dot" />}
                    {destination && <span className="notification-open"><Icon name="arrow" size={16} /></span>}
                  </button>;
                })}
                {visibleNotifications.length === 0 && <div className="notification-empty">
                  <Icon name="bell" size={22} />
                  <strong>{state.notifications.length ? "Nenhuma notificação com esses filtros" : "Você está em dia"}</strong>
                  <p>{state.notifications.length ? "Altere a categoria ou mostre todas as notificações." : "Respostas e atividades aparecerão aqui."}</p>
                </div>}
              </div>
            </section>
          )}

          {view === "gef" && isGef && (
            <section className="page-section gef-page">
              <div className="content-heading">
                <div>
                  <span className="eyebrow">ÁREA EXCLUSIVA</span>
                  <h2 className="gef-page-title"><Image src="/brand/gef.png" alt="" width={40} height={40} />Visão do GEF</h2>
                  <p>Encontre assuntos recorrentes, consulte a comunidade e acompanhe os próximos passos.</p>
                </div>
                <button className="primary-button heading-action" onClick={() => { setActivityProposalId(""); setActivityOpen(true); }}>
                  <Icon name="plus" size={17} />Nova atividade
                </button>
              </div>

              {legacyPreview && Object.values(legacyPreview).some((count) => count > 0) && (
                <aside className="legacy-import-panel" aria-live="polite">
                  <span className="legacy-import-icon"><Icon name={legacyImportStatus === "success" ? "check" : "refresh"} size={20} /></span>
                  <div>
                    <h3>{legacyImportStatus === "success" ? "Dados antigos importados" : "Dados antigos encontrados neste navegador"}</h3>
                    <p>
                      {legacyPreview.proposals} propostas, {legacyPreview.comments} comentários, {legacyPreview.activities} atividades e {legacyPreview.chapaQuestions} dúvidas podem ser preservados no banco.
                    </p>
                  </div>
                  {legacyImportStatus === "success" ? (
                    <button type="button" className="outline-button tactile-control" onClick={clearLegacyData}>Apagar cópia antiga</button>
                  ) : (
                    <button type="button" className="primary-button tactile-control" disabled={legacyImportStatus === "importing"} onClick={importLegacyData}>
                      {legacyImportStatus === "importing" ? "Importando…" : "Importar dados antigos"}
                    </button>
                  )}
                </aside>
              )}

              {activityOpen && <ActivityComposer proposals={state.proposals} initialProposalId={activityProposalId || undefined} onCancel={() => setActivityOpen(false)} onCreate={createActivity} />}

              <div className="gef-overview">
                <div><strong>{state.proposals.filter((proposal) => proposal.status === "received").length}</strong><span>aguardando triagem</span></div>
                <div><strong>{state.proposals.filter((proposal) => proposal.status === "analysis").length}</strong><span>em análise</span></div>
                <div><strong>{state.proposals.filter((proposal) => proposal.status === "development" || proposal.status === "scheduled").length}</strong><span>em andamento</span></div>
                <div><strong>{state.activities.filter((activity) => activity.status === "upcoming" && activity.date >= todayKey).length}</strong><span>atividades futuras</span></div>
              </div>

              <div className="gef-workbench">
                <section className="gef-worklist" aria-labelledby="gef-worklist-title">
                  <div className="gef-section-heading">
                    <div>
                      <h3 id="gef-worklist-title">Próximas ações</h3>
                      <p>Propostas ativas organizadas pela etapa de trabalho.</p>
                    </div>
                    <strong>{gefQueue.length}</strong>
                  </div>
                  {gefQueue.length === 0 ? <p className="gef-queue-empty">Nenhuma proposta aguarda ação.</p> : <div className="gef-task-list">
                    {gefQueue.map((proposal) => {
                      const nextAction = proposal.status === "received" ? "Iniciar análise" : proposal.status === "analysis" ? "Iniciar desenvolvimento" : "Agendar atividade";
                      return <article className="gef-task-row" key={proposal.id}>
                        <div className="gef-task-copy">
                          <strong>{proposal.title}</strong>
                          <small>{proposal.theme} · {displayCount(proposal.comments)} comentários · {displayCount(proposal.supports)} apoios</small>
                        </div>
                        <StatusBadge status={proposal.status} />
                        <div className="gef-task-actions">
                          <button type="button" className="gef-open-proposal" onClick={() => { setGefProposalId(proposal.id); setSelectedId(proposal.id); }}>Abrir</button>
                          <button type="button" className="gef-next-action" onClick={() => {
                            if (proposal.status === "received") void changeStatus(proposal.id, "analysis");
                            else if (proposal.status === "analysis") void changeStatus(proposal.id, "development");
                            else { setActivityProposalId(proposal.id); setActivityOpen(true); }
                          }}>{nextAction}<Icon name="arrow" size={14} /></button>
                        </div>
                      </article>;
                    })}
                  </div>}
                </section>

                <aside className="gef-theme-panel" aria-labelledby="gef-theme-title">
                  <div className="gef-section-heading">
                    <div>
                      <h3 id="gef-theme-title">Temas das propostas</h3>
                      <p>Distribuição por tema.</p>
                    </div>
                  </div>
                  {gefThemeCounts.length === 0 ? <p className="gef-queue-empty">Os temas aparecerão quando houver propostas.</p> : <div className="gef-theme-bars">
                    {gefThemeCounts.map(({ theme, count }) => <div className="gef-theme-row" key={theme}>
                      <span>{theme}</span>
                      <span className="gef-theme-track" role="meter" aria-label={`${theme}: ${count} propostas`} aria-valuemin={0} aria-valuemax={Math.max(...gefThemeCounts.map((item) => item.count))} aria-valuenow={count}>
                        <i style={{ width: `${count / Math.max(...gefThemeCounts.map((item) => item.count)) * 100}%` }} />
                      </span>
                      <strong>{count}</strong>
                    </div>)}
                  </div>}
                </aside>
              </div>
              {olderProposalsButton}

              <details className="gef-map-details">
                <summary>Explorar mapa temático</summary>
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
                  {state.proposals.map((proposal) => (
                    <button type="button" key={proposal.id} onClick={() => { setGefProposalId(proposal.id); setSelectedId(proposal.id); }}>
                      <span className="map-list-status" style={{ background: STATUS[proposal.status]?.color ?? "#6c7d8c" }} />
                      <span>{proposal.title}</span>
                      <small>{proposal.theme}</small>
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
                </div>
              </details>

              {gefProposal && (
                <div id="gef-proposal-preview">
                  <ProposalPreview
                    proposal={gefProposal}
                    comments={state.comments}
                    isGef
                    supported={userSupportedIds.includes(gefProposal.id)}
                    saved={userSavedIds.includes(gefProposal.id)}
                    onSupport={() => toggleSupport(gefProposal.id)}
                    onSave={() => toggleSaved(gefProposal.id)}
                    onStatus={(status) => changeStatus(gefProposal.id, status)}
                    onComment={(body, parentId) => addComment(body, parentId, gefProposal.id)}
                    onLike={toggleCommentLike}
                    likedCommentIds={userLikedCommentIds}
                    hasOlderComments={Boolean(state.commentCursorsByProposal[gefProposal.id])}
                    loadingOlderComments={Boolean(loadingCommentPages[gefProposal.id])}
                    onLoadOlderComments={() => void loadOlderComments(gefProposal.id)}
                    onSubmitGefResponse={submitGefResponse}
                    onClose={() => setGefProposalId(null)}
                  />
                </div>
              )}
            </section>
          )}
        </main>

        <nav className="mobile-nav" aria-label="Navegação móvel">
          <button className={view === "proposals" ? "active" : ""} onClick={() => changeView("proposals")}><Icon name="message" size={20} /><span>Propostas</span></button>
          <button className={view === "saved" ? "active" : ""} onClick={() => changeView("saved")}><Icon name="bookmark" size={20} /><span>Acompanhando</span></button>
          <button className={view === "agenda" ? "active" : ""} onClick={() => changeView("agenda")}><Icon name="calendar" size={20} /><span>Agenda</span></button>
          {ELECTIONS_ENABLED && <button className={view === "chapas" ? "active" : ""} onClick={() => changeView("chapas")}><Icon name="users" size={20} /><span>Chapas</span></button>}
          <button className={view === "notifications" ? "active" : ""} onClick={() => changeView("notifications")}><Icon name="bell" size={20} /><span>Notificações</span>{unread > 0 && <b>{unread}</b>}</button>
          {isGef && <button className={view === "gef" ? "active" : ""} onClick={() => changeView("gef")}><Image className="gef-nav-mark" src="/brand/gef.png" alt="" width={22} height={22} /><span>GEF</span></button>}
        </nav>
      </div>
    </div>
  );
}
