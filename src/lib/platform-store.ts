import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type UserRole = "student" | "gef";
export type ProposalStatus = "received" | "analysis" | "development" | "scheduled" | "completed" | "archived";

export type PlatformUser = {
  id: string;
  name: string;
  turma: string;
  role: UserRole;
};

export type AccountRecord = PlatformUser & { password: string };

export type ProposalRecord = {
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

export type CommentRecord = {
  id: string;
  proposalId: string;
  author: string;
  authorId: string;
  role: UserRole;
  anonymous: boolean;
  body: string;
  createdAt: string;
  parentId?: string;
  likes?: number;
};

export type SupporterRecord = {
  id: string;
  name: string;
  turma: string;
};

export type ActivityRecord = {
  id: string;
  proposalId: string;
  title: string;
  date: string;
  time: string;
  place: string;
  audience: string;
  status: "upcoming" | "done" | "cancelled";
};

export type ActivityFeedbackRating = "great" | "good" | "ok" | "poor";

export type ActivityFeedbackRecord = {
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

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  activityId?: string;
};

export type ChapaProposalRecord = {
  area: string;
  title: string;
  detail: string;
};

export type ChapaRecord = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  proposals: ChapaProposalRecord[];
};

export type ChapaQuestionRecord = {
  id: string;
  chapaId: string;
  proposalArea: string;
  proposalTitle?: string;
  question: string;
  author: string;
  authorId: string;
  turma: string;
  answered?: boolean;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
};

export type PlatformStore = {
  accounts: AccountRecord[];
  proposals: ProposalRecord[];
  comments: CommentRecord[];
  activities: ActivityRecord[];
  notifications: NotificationRecord[];
  supportedByUser: Record<string, string[]>;
  savedByUser: Record<string, string[]>;
  likedCommentsByUser: Record<string, string[]>;
  supportersByProposal: Record<string, SupporterRecord[]>;
  chapas: ChapaRecord[];
  activityFeedbacks: Record<string, ActivityFeedbackRecord[]>;
  chapaQuestions: ChapaQuestionRecord[];
};

export const CHAPA_AREAS = ["Esportes e movimento", "Cultura e música", "Convivência e descanso", "Participação"] as const;

const seedProposals: ProposalRecord[] = [
  { id: "p1", title: "Mais pontos de recarga USB nas áreas comuns", body: "Instalar pontos de recarga USB nas salas de estudo e na biblioteca para que todos possam carregar seus dispositivos durante o dia.", author: "Demonstração Estudante", authorId: "demo", anonymous: false, theme: "Outros", status: "analysis", supports: 14, comments: 2, createdAt: "Há 2 dias", updatedAt: "Há 1 dia", origin: "student", gefResponse: "Estamos levantando custos e locais viáveis junto à coordenação.", gefResponseAt: "Há 1 dia" },
  { id: "p2", title: "Torneio relâmpago de vôlei no recreio", body: "Organizar partidas curtas com inscrição simples e rodízio de times, para mais gente conseguir jogar durante o intervalo.", author: "Marina Costa", authorId: "marina", anonymous: false, theme: "Esportes", status: "development", supports: 22, comments: 4, createdAt: "Há 3 dias", updatedAt: "Há 4 horas", origin: "student", gefResponse: "Vamos testar a quadra menor no próximo recreio e ouvir quem participar.", gefResponseAt: "Há 1 dia" },
  { id: "p3", title: "Playlist colaborativa para os intervalos", body: "Criar uma playlist com sugestões dos estudantes e um horário de música escolhido pelo GEF.", author: "Estudante anônimo", authorId: "anonymous-3", anonymous: true, theme: "Música e cultura", status: "received", supports: 10, comments: 3, createdAt: "Há 5 dias", updatedAt: "Há 2 dias", origin: "student" },
  { id: "p4", title: "Espaço tranquilo para descansar", body: "Reservar uma área com bancos e sombra para quem prefere conversar ou descansar sem participar de uma atividade.", author: "João Pedro", authorId: "joao", anonymous: false, theme: "Descanso", status: "scheduled", supports: 18, comments: 5, createdAt: "Há 1 semana", updatedAt: "Há 1 dia", origin: "student", gefResponse: "Atividade agendada para terça no Pátio das Árvores.", gefResponseAt: "Há 1 dia" },
  { id: "p5", title: "Jogos de tabuleiro na biblioteca", body: "Disponibilizar jogos rápidos e um sistema de empréstimo durante os intervalos para criar novas opções de convivência.", author: "Estudante anônimo", authorId: "anonymous-5", anonymous: true, theme: "Jogos de mesa", status: "completed", supports: 26, comments: 6, createdAt: "Há 2 semanas", updatedAt: "Ontem", origin: "student", gefResponse: "Jogos implementados com sucesso e disponíveis no balcão da biblioteca.", gefResponseAt: "Ontem" },
  { id: "p6", title: "Oficina de desenho e colagem no pátio", body: "Montar uma mesa com materiais simples para quem quiser desenhar, criar colagens e compartilhar produções durante o recreio.", author: "Beatriz Lima", authorId: "bia", anonymous: false, theme: "Música e cultura", status: "analysis", supports: 12, comments: 2, createdAt: "Há 4 dias", updatedAt: "Há 6 horas", origin: "student" },
  { id: "p7", title: "Caixa de trocas de livros e revistas", body: "Criar um ponto de troca voluntária para renovar as leituras e descobrir histórias diferentes sem precisar levar um livro novo.", author: "Estudante anônimo", authorId: "anonymous-7", anonymous: true, theme: "Convivência", status: "received", supports: 9, comments: 1, createdAt: "Há 6 dias", updatedAt: "Há 3 dias", origin: "student" },
  { id: "p8", title: "Desafio de xadrez relâmpago", body: "Organizar partidas de até dez minutos com um quadro de inscrições aberto a iniciantes e a quem já joga.", author: "Rafael Mendes", authorId: "rafael", anonymous: false, theme: "Jogos de mesa", status: "received", supports: 16, comments: 2, createdAt: "Há 8 dias", updatedAt: "Há 2 dias", origin: "student" },
];

const seedComments: CommentRecord[] = [
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

const seedChapas: ChapaRecord[] = [
  {
    id: "chapa-1",
    name: "Chapa 1",
    tagline: "Mais opções para cada jeito de viver o intervalo.",
    color: "#0758b1",
    proposals: [
      { area: CHAPA_AREAS[0], title: "Circuito de jogos rápidos", detail: "Rodízio de modalidades curtas em dias combinados com as turmas." },
      { area: CHAPA_AREAS[1], title: "Palco aberto", detail: "Espaço para apresentações voluntárias de música, poesia e dança." },
      { area: CHAPA_AREAS[2], title: "Pátio de convivência", detail: "Mais bancos, sombra e jogos tranquilos em uma área sinalizada." },
      { area: CHAPA_AREAS[3], title: "Calendário construído com as turmas", detail: "Encontros mensais para acompanhar propostas e devolver decisões." },
    ],
  },
  {
    id: "chapa-2",
    name: "Chapa 2",
    tagline: "Um recreio ativo, criativo e aberto a novas ideias.",
    color: "#f45a1a",
    proposals: [
      { area: CHAPA_AREAS[0], title: "Desafio recreativo semanal", detail: "Atividades inclusivas com inscrição simples e participação por rodízio." },
      { area: CHAPA_AREAS[1], title: "Rádio do intervalo", detail: "Seleção musical sugerida pelos estudantes em horários definidos." },
      { area: CHAPA_AREAS[2], title: "Estações de descanso", detail: "Cantinhos com leitura, conversa e jogos de mesa para diferentes ritmos." },
      { area: CHAPA_AREAS[3], title: "Mural de acompanhamento", detail: "Atualizações públicas sobre cada proposta e seus próximos passos." },
    ],
  },
];

const seedChapaQuestions: ChapaQuestionRecord[] = [
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
];

const seedActivityFeedbacks: Record<string, ActivityFeedbackRecord[]> = {
  a1: [
    {
      id: "af-1",
      activityId: "a1",
      userId: "marina",
      userName: "Marina Costa",
      turma: "8º ano",
      participated: true,
      rating: "great",
      comment: "Foi muito bom ter um lugar silencioso com sombra!",
      createdAt: "Há 1 hora",
    },
    {
      id: "af-2",
      activityId: "a1",
      userId: "rafael",
      userName: "Rafael Mendes",
      turma: "2º EM",
      participated: false,
      reasonNotParticipated: "Estava estudando para prova no intervalo",
      comment: "Gostei da iniciativa, pretendo ir no próximo.",
      createdAt: "Há 30 min",
    },
  ],
};

function getStoreFilePath(): string | null {
  try {
    if (process.env.VERCEL) {
      return path.join("/tmp", "comunica-platform-store.json");
    }
    const dir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, "platform-store.json");
  } catch {
    return null;
  }
}

function saveStoreToDisk(store: PlatformStore) {
  const filePath = getStoreFilePath();
  if (!filePath) return;
  try {
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // Non-blocking fallback to memory
  }
}

function loadStoreFromDisk(): PlatformStore | null {
  const filePath = getStoreFilePath();
  if (!filePath) return null;
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as PlatformStore;
    }
  } catch {
    // Non-blocking fallback
  }
  return null;
}

function createInitialStore(): PlatformStore {
  return {
    accounts: [
      { id: "demo", name: "Demonstração", turma: "Turma A — demonstração", role: "student", password: "demo1234" },
      { id: "admin", name: "administrador", turma: "GEF", role: "gef", password: "admteste123" },
    ],
    proposals: structuredClone(seedProposals),
    comments: structuredClone(seedComments),
    activities: [{ id: "a1", proposalId: "p4", title: "Teste do espaço tranquilo", date: "2026-09-08", time: "10:15–10:35", place: "Pátio das árvores", audience: "Todas as turmas", status: "upcoming" }],
    notifications: [
      { id: "n1", title: "Nova atividade no recreio", body: "O teste do espaço tranquilo acontece na terça, no Pátio das árvores.", createdAt: "Há 2 horas", read: false, activityId: "a1" },
      { id: "n2", title: "Uma proposta recebeu resposta", body: "O GEF comentou a proposta de pontos de recarga USB.", createdAt: "Ontem", read: false },
      { id: "n3", title: "A proposta está em análise", body: "A proposta de pontos de recarga avançou de etapa.", createdAt: "Há 2 dias", read: false },
    ],
    supportedByUser: {},
    savedByUser: {},
    likedCommentsByUser: {},
    supportersByProposal: {
      p1: [{ id: "marina", name: "Marina Costa", turma: "8º ano" }, { id: "joao", name: "João Pedro", turma: "1º EM" }, { id: "livia", name: "Lívia", turma: "9º ano" }],
      p2: [{ id: "bia", name: "Beatriz Lima", turma: "8º ano" }, { id: "rafael", name: "Rafael Mendes", turma: "2º EM" }, { id: "nina", name: "Nina", turma: "7º ano" }],
      p3: [{ id: "caio", name: "Caio", turma: "9º ano" }, { id: "leo", name: "Léo", turma: "1º EM" }],
      p4: [{ id: "marina", name: "Marina Costa", turma: "8º ano" }, { id: "nina", name: "Nina", turma: "7º ano" }],
      p5: [{ id: "joao", name: "João Pedro", turma: "1º EM" }, { id: "bia", name: "Beatriz Lima", turma: "8º ano" }, { id: "caio", name: "Caio", turma: "9º ano" }],
      p6: [{ id: "livia", name: "Lívia", turma: "9º ano" }, { id: "leo", name: "Léo", turma: "1º EM" }],
      p7: [{ id: "nina", name: "Nina", turma: "7º ano" }],
      p8: [{ id: "marina", name: "Marina Costa", turma: "8º ano" }, { id: "caio", name: "Caio", turma: "9º ano" }],
    },
    chapas: structuredClone(seedChapas),
    activityFeedbacks: structuredClone(seedActivityFeedbacks),
    chapaQuestions: structuredClone(seedChapaQuestions),
  };
}

const globalForStore = globalThis as typeof globalThis & { __comunicaPlatformStore?: PlatformStore };

export function getPlatformStore(): PlatformStore {
  if (!globalForStore.__comunicaPlatformStore) {
    const diskStore = loadStoreFromDisk();
    globalForStore.__comunicaPlatformStore = diskStore ?? createInitialStore();
  }

  const store = globalForStore.__comunicaPlatformStore as PlatformStore;

  // Backfill any missing keys for backward compatibility
  if (!store.supportersByProposal) store.supportersByProposal = {};
  if (!store.savedByUser) store.savedByUser = {};
  if (!store.supportedByUser) store.supportedByUser = {};
  if (!store.likedCommentsByUser) store.likedCommentsByUser = {};
  if (!store.activityFeedbacks) store.activityFeedbacks = structuredClone(seedActivityFeedbacks);
  if (!store.chapaQuestions) store.chapaQuestions = structuredClone(seedChapaQuestions);
  store.comments.forEach((comment) => {
    if (typeof comment.likes !== "number") comment.likes = 0;
  });

  const existingProposalIds = new Set(store.proposals.map((proposal) => proposal.id));
  seedProposals.filter((proposal) => !existingProposalIds.has(proposal.id)).forEach((proposal) => store.proposals.push(structuredClone(proposal)));

  const existingCommentIds = new Set(store.comments.map((comment) => comment.id));
  seedComments.filter((comment) => !existingCommentIds.has(comment.id)).forEach((comment) => store.comments.push(structuredClone(comment)));

  if (!store.chapas || store.chapas.length === 0) store.chapas = structuredClone(seedChapas);

  return store;
}

export function resetPlatformStore() {
  globalForStore.__comunicaPlatformStore = createInitialStore();
  saveStoreToDisk(globalForStore.__comunicaPlatformStore);
  return globalForStore.__comunicaPlatformStore;
}

export function publicUser(user: PlatformUser) {
  return { id: user.id, name: user.name, turma: user.turma, role: user.role };
}

export function findAccount(name: string, password: string) {
  return getPlatformStore().accounts.find((account) => account.name.toLowerCase() === name.trim().toLowerCase() && account.password === password);
}

export function createAccount(name: string, turma: string, password: string) {
  const store = getPlatformStore();
  const normalized = name.trim();
  if (normalized.length < 3) throw new Error("O nome de usuário precisa ter pelo menos 3 caracteres.");
  if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  if (store.accounts.some((account) => account.name.toLowerCase() === normalized.toLowerCase())) throw new Error("Esse nome de usuário já está em uso.");
  const account: AccountRecord = { id: randomUUID(), name: normalized, turma: turma.trim() || "Turma não informada", role: "student", password };
  store.accounts.push(account);
  saveStoreToDisk(store);
  return account;
}

export function createProposal(input: Omit<ProposalRecord, "id" | "supports" | "comments" | "createdAt" | "updatedAt" | "status">) {
  const store = getPlatformStore();
  const proposal: ProposalRecord = { ...input, id: randomUUID(), status: "received", supports: 0, comments: 0, createdAt: "Agora", updatedAt: "Agora" };
  store.proposals.unshift(proposal);
  store.supportersByProposal[proposal.id] = [];
  store.notifications.unshift({ id: randomUUID(), title: "Nova proposta recebida", body: `${input.anonymous ? "Uma pessoa estudante" : input.author} publicou uma ideia para o recreio.`, createdAt: "Agora", read: false });
  saveStoreToDisk(store);
  return proposal;
}

export function getProposal(id: string) {
  return getPlatformStore().proposals.find((proposal) => proposal.id === id);
}

export function getProposalSupporters(proposalId: string) {
  return getPlatformStore().supportersByProposal[proposalId] ?? [];
}

export function addComment(proposalId: string, input: Omit<CommentRecord, "id" | "createdAt" | "proposalId">) {
  const proposal = getProposal(proposalId);
  if (!proposal) return null;
  const comment: CommentRecord = { ...input, id: randomUUID(), proposalId, createdAt: "Agora" };
  const store = getPlatformStore();
  store.comments.push(comment);
  proposal.comments += 1;
  proposal.updatedAt = "Agora";
  store.notifications.unshift({ id: randomUUID(), title: "Nova interação na comunidade", body: `${comment.anonymous ? "Uma pessoa estudante" : comment.author} comentou uma proposta.`, createdAt: "Agora", read: false });
  saveStoreToDisk(store);
  return comment;
}

export function toggleCommentLike(commentId: string, userId: string) {
  const store = getPlatformStore();
  const comment = store.comments.find((item) => item.id === commentId);
  if (!comment) return null;

  const likedComments = store.likedCommentsByUser[userId] ?? [];
  const index = likedComments.indexOf(commentId);
  const currentLikes = typeof comment.likes === "number" ? comment.likes : 0;

  if (index >= 0) {
    likedComments.splice(index, 1);
    comment.likes = Math.max(0, currentLikes - 1);
  } else {
    likedComments.push(commentId);
    comment.likes = currentLikes + 1;
  }

  store.likedCommentsByUser[userId] = likedComments;
  saveStoreToDisk(store);
  return { liked: index < 0, likes: comment.likes };
}

export function toggleSupport(proposalId: string, userId: string) {
  const proposal = getProposal(proposalId);
  if (!proposal) return null;
  const store = getPlatformStore();
  const supports = store.supportedByUser[userId] ?? [];
  const supporters = store.supportersByProposal[proposalId] ?? [];
  const index = supports.indexOf(proposalId);
  if (index >= 0) {
    supports.splice(index, 1);
    const supporterIndex = supporters.findIndex((supporter) => supporter.id === userId);
    if (supporterIndex >= 0) supporters.splice(supporterIndex, 1);
    proposal.supports = Math.max(0, proposal.supports - 1);
  } else {
    supports.push(proposalId);
    const account = store.accounts.find((item) => item.id === userId);
    if (account && !supporters.some((supporter) => supporter.id === userId)) supporters.push({ id: account.id, name: account.name, turma: account.turma });
    proposal.supports += 1;
  }
  store.supportedByUser[userId] = supports;
  store.supportersByProposal[proposalId] = supporters;
  saveStoreToDisk(store);
  return { supported: index < 0, supports: proposal.supports };
}

export function toggleSaved(proposalId: string, userId: string) {
  const proposal = getProposal(proposalId);
  if (!proposal) return null;
  const store = getPlatformStore();
  const saved = store.savedByUser[userId] ?? [];
  const index = saved.indexOf(proposalId);
  if (index >= 0) saved.splice(index, 1);
  else saved.push(proposalId);
  store.savedByUser[userId] = saved;
  saveStoreToDisk(store);
  return { saved: index < 0 };
}

export function updateProposalStatus(proposalId: string, status: ProposalStatus, gefResponse?: string) {
  const proposal = getProposal(proposalId);
  if (!proposal) return null;
  proposal.status = status;
  proposal.updatedAt = "Agora";
  if (gefResponse !== undefined && gefResponse.trim()) {
    proposal.gefResponse = gefResponse.trim();
    proposal.gefResponseAt = "Agora";
  }
  const store = getPlatformStore();
  store.notifications.unshift({
    id: randomUUID(),
    title: "Atualização de proposta",
    body: `A proposta "${proposal.title.slice(0, 30)}..." agora está: ${status}.`,
    createdAt: "Agora",
    read: false,
  });
  saveStoreToDisk(store);
  return proposal;
}

export function updateProposalGefResponse(proposalId: string, gefResponse: string) {
  const proposal = getProposal(proposalId);
  if (!proposal) return null;
  proposal.gefResponse = gefResponse.trim();
  proposal.gefResponseAt = "Agora";
  proposal.updatedAt = "Agora";
  const store = getPlatformStore();
  store.notifications.unshift({
    id: randomUUID(),
    title: "Resposta oficial do GEF",
    body: `O GEF respondeu a proposta "${proposal.title.slice(0, 30)}...".`,
    createdAt: "Agora",
    read: false,
  });
  saveStoreToDisk(store);
  return proposal;
}

export function createActivity(input: Omit<ActivityRecord, "id" | "status">) {
  const proposal = getProposal(input.proposalId);
  if (!proposal) return null;
  const store = getPlatformStore();
  const activity: ActivityRecord = { ...input, id: randomUUID(), status: "upcoming" };
  store.activities.unshift(activity);
  proposal.status = "scheduled";
  proposal.updatedAt = "Agora";
  store.notifications.unshift({ id: randomUUID(), title: "Nova atividade no recreio", body: `${activity.title} · ${activity.date} · ${activity.place}`, createdAt: "Agora", read: false, activityId: activity.id });
  saveStoreToDisk(store);
  return activity;
}

export function updateActivityStatus(activityId: string, status: "upcoming" | "done" | "cancelled") {
  const store = getPlatformStore();
  const activity = store.activities.find((item) => item.id === activityId);
  if (!activity) return null;
  activity.status = status;
  if (status === "done") {
    const proposal = store.proposals.find((p) => p.id === activity.proposalId);
    if (proposal) proposal.status = "completed";
  }
  saveStoreToDisk(store);
  return activity;
}

export function submitActivityFeedback(activityId: string, feedback: Omit<ActivityFeedbackRecord, "id" | "createdAt" | "activityId">) {
  const store = getPlatformStore();
  const activity = store.activities.find((item) => item.id === activityId);
  if (!activity) return null;

  if (!store.activityFeedbacks) store.activityFeedbacks = {};
  if (!store.activityFeedbacks[activityId]) store.activityFeedbacks[activityId] = [];

  const existingIndex = store.activityFeedbacks[activityId].findIndex((item) => item.userId === feedback.userId);
  const record: ActivityFeedbackRecord = {
    ...feedback,
    id: randomUUID(),
    activityId,
    createdAt: "Agora",
  };

  if (existingIndex >= 0) {
    store.activityFeedbacks[activityId][existingIndex] = record;
  } else {
    store.activityFeedbacks[activityId].push(record);
  }

  saveStoreToDisk(store);
  return record;
}

export function getActivityFeedbacks(activityId: string): ActivityFeedbackRecord[] {
  const store = getPlatformStore();
  return store.activityFeedbacks?.[activityId] ?? [];
}

export function createChapaQuestion(input: Omit<ChapaQuestionRecord, "id" | "createdAt" | "answer" | "answeredBy" | "answeredAt" | "answered">) {
  const store = getPlatformStore();
  if (!store.chapaQuestions) store.chapaQuestions = [];
  const question: ChapaQuestionRecord = {
    ...input,
    id: randomUUID(),
    createdAt: "Agora",
    answered: false,
  };
  store.chapaQuestions.unshift(question);
  saveStoreToDisk(store);
  return question;
}

export function answerChapaQuestion(questionId: string, answer: string, answeredBy: string) {
  const store = getPlatformStore();
  if (!store.chapaQuestions) return null;
  const question = store.chapaQuestions.find((item) => item.id === questionId);
  if (!question) return null;
  question.answered = true;
  question.answer = answer.trim();
  question.answeredBy = answeredBy.trim();
  question.answeredAt = "Agora";
  saveStoreToDisk(store);
  return question;
}

export function getChapaQuestions(chapaId?: string, area?: string): ChapaQuestionRecord[] {
  const store = getPlatformStore();
  let questions = store.chapaQuestions ?? [];
  if (chapaId) questions = questions.filter((item) => item.chapaId === chapaId);
  if (area && area !== "Todas") questions = questions.filter((item) => item.proposalArea === area);
  return questions;
}
