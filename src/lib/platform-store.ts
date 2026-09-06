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

const seedProposals: ProposalRecord[] = [];

const seedComments: CommentRecord[] = [];

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

const seedChapaQuestions: ChapaQuestionRecord[] = [];

const seedActivityFeedbacks: Record<string, ActivityFeedbackRecord[]> = {};

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
      { id: "admin", name: "administrador", turma: "GEF", role: "gef", password: "admteste123" },
    ],
    proposals: [],
    comments: [],
    activities: [],
    notifications: [],
    supportedByUser: {},
    savedByUser: {},
    likedCommentsByUser: {},
    supportersByProposal: {},
    chapas: structuredClone(seedChapas),
    activityFeedbacks: {},
    chapaQuestions: [],
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

export function setSupport(proposalId: string, userId: string, supported: boolean) {
  const proposal = getProposal(proposalId);
  if (!proposal) return null;
  const store = getPlatformStore();
  if (!store.supportedByUser[userId]) store.supportedByUser[userId] = [];
  if (!store.supportersByProposal[proposalId]) store.supportersByProposal[proposalId] = [];

  const supports = store.supportedByUser[userId];
  const supporters = store.supportersByProposal[proposalId];
  const index = supports.indexOf(proposalId);
  const supporterIndex = supporters.findIndex((supporter) => supporter.id === userId);

  if (supported) {
    if (index < 0) {
      supports.push(proposalId);
    }
    if (supporterIndex < 0) {
      const account = store.accounts.find((item) => item.id === userId);
      supporters.push({
        id: userId,
        name: account?.name ?? "Estudante",
        turma: account?.turma ?? "",
      });
    }
  } else {
    if (index >= 0) {
      supports.splice(index, 1);
    }
    if (supporterIndex >= 0) {
      supporters.splice(supporterIndex, 1);
    }
  }

  proposal.supports = supporters.length;
  saveStoreToDisk(store);
  return { supported, supports: proposal.supports };
}

export function toggleSupport(proposalId: string, userId: string) {
  const store = getPlatformStore();
  const currentlySupported = (store.supportedByUser[userId] ?? []).includes(proposalId) ||
    (store.supportersByProposal[proposalId] ?? []).some((supporter) => supporter.id === userId);
  return setSupport(proposalId, userId, !currentlySupported);
}

export function setSaved(proposalId: string, userId: string, saved: boolean) {
  const proposal = getProposal(proposalId);
  if (!proposal) return null;
  const store = getPlatformStore();
  if (!store.savedByUser[userId]) store.savedByUser[userId] = [];
  const savedProposals = store.savedByUser[userId];
  const index = savedProposals.indexOf(proposalId);
  if (saved && index < 0) {
    savedProposals.push(proposalId);
  } else if (!saved && index >= 0) {
    savedProposals.splice(index, 1);
  }
  saveStoreToDisk(store);
  return { saved };
}

export function toggleSaved(proposalId: string, userId: string) {
  const store = getPlatformStore();
  const currentlySaved = (store.savedByUser[userId] ?? []).includes(proposalId);
  return setSaved(proposalId, userId, !currentlySaved);
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
