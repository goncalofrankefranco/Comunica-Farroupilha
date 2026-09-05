import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlatformStore,
  createAccount,
  findAccount,
  createProposal,
  getProposal,
  toggleSupport,
  addComment,
  updateProposalStatus,
  updateProposalGefResponse,
  createActivity,
  updateActivityStatus,
  submitActivityFeedback,
  getActivityFeedbacks,
  createChapaQuestion,
  answerChapaQuestion,
  getChapaQuestions,
} from "../src/lib/platform-store.ts";

test("Platform Store: initialization and seed data", () => {
  const store = getPlatformStore();
  assert.ok(store.proposals.length > 0, "Proposals should have seed items");
  assert.ok(store.chapas.length >= 2, "Should have at least Chapa 1 and Chapa 2");
  assert.ok(store.activities.length > 0, "Activities should have seed items");
  assert.ok(typeof store.activityFeedbacks === "object", "Feedbacks should be an object/record");
  assert.ok(Array.isArray(store.chapaQuestions), "Chapa questions should be an array");
});

test("Platform Store: account creation and authentication", () => {
  const testName = `Estudante_${Date.now()}`;
  const account = createAccount(testName, "3º EM A", "senhaSegura123");

  assert.ok(account.id);
  assert.equal(account.name, testName);
  assert.equal(account.turma, "3º EM A");
  assert.equal(account.role, "student");

  const found = findAccount(testName, "senhaSegura123");
  assert.ok(found);
  assert.equal(found?.id, account.id);

  const invalid = findAccount(testName, "senhaErrada");
  assert.equal(invalid, undefined);
});

test("Platform Store: proposal creation, support, comment, and GEF official response", () => {
  // Student proposal
  const studentProp = createProposal({
    title: "Torneio de Xadrez Relâmpago no Intervalo",
    body: "Organizar um tabuleiro gigante e mesas no pátio central.",
    author: "Lucca Estudante",
    authorId: "user_test_1",
    anonymous: false,
    theme: "Cultura e Lazer",
    origin: "student",
  });

  assert.ok(studentProp.id);
  assert.equal(studentProp.origin, "student");
  assert.equal(studentProp.status, "received");
  assert.equal(studentProp.supports, 0);

  // Toggle support
  const supportResult1 = toggleSupport(studentProp.id, "user_test_2");
  assert.equal(supportResult1?.supported, true);
  assert.equal(supportResult1?.supports, 1);

  const supportResult2 = toggleSupport(studentProp.id, "user_test_2");
  assert.equal(supportResult2?.supported, false);
  assert.equal(supportResult2?.supports, 0);

  // Comment
  const comment = addComment(studentProp.id, {
    author: "Mariana Costa",
    authorId: "user_test_3",
    role: "student",
    anonymous: false,
    body: "Adorei a ideia, posso ajudar na arbitragem!",
  });
  assert.ok(comment);
  assert.equal(comment?.body, "Adorei a ideia, posso ajudar na arbitragem!");

  const updatedProp = getProposal(studentProp.id);
  assert.equal(updatedProp?.comments, 1);

  // Status progression with GEF response
  const statusUpdated = updateProposalStatus(
    studentProp.id,
    "analysis",
    "Em análise pela comissão esportiva do GEF."
  );
  assert.equal(statusUpdated?.status, "analysis");
  assert.equal(statusUpdated?.gefResponse, "Em análise pela comissão esportiva do GEF.");
  assert.ok(statusUpdated?.gefResponseAt);

  // Update GEF response directly
  const responseUpdated = updateProposalGefResponse(
    studentProp.id,
    "Proposta aprovada! Agendando data com a coordenação."
  );
  assert.equal(responseUpdated?.gefResponse, "Proposta aprovada! Agendando data com a coordenação.");
});

test("Platform Store: activities and student post-recess feedback", () => {
  const store = getPlatformStore();
  const proposal = store.proposals[0];

  const activity = createActivity({
    proposalId: proposal.id,
    title: "Festival de Talentos do Recreio",
    date: "2026-09-20",
    time: "10:15 - 10:45",
    place: "Pátio das Palmeiras",
    audience: "Ensino Fundamental e Médio",
  });

  assert.ok(activity);
  assert.equal(activity?.status, "upcoming");

  // Complete activity
  const completedActivity = updateActivityStatus(activity.id, "done");
  assert.equal(completedActivity?.status, "done");

  // Student 1 participated and gave rating "great"
  const feedback1 = submitActivityFeedback(activity.id, {
    userId: "aluno_1",
    userName: "Pedro Alves",
    turma: "2º EM",
    participated: true,
    rating: "great",
    comment: "Muito divertido, o som estava ótimo!",
  });
  assert.ok(feedback1);
  assert.equal(feedback1?.participated, true);
  assert.equal(feedback1?.rating, "great");

  // Student 2 did not participate and gave reason
  const feedback2 = submitActivityFeedback(activity.id, {
    userId: "aluno_2",
    userName: "Clara Mendes",
    turma: "1º EM",
    participated: false,
    reasonNotParticipated: "Tinha reunião de projeto no mesmo horário",
  });
  assert.ok(feedback2);
  assert.equal(feedback2?.participated, false);
  assert.equal(feedback2?.reasonNotParticipated, "Tinha reunião de projeto no mesmo horário");

  // Retrieve feedbacks
  const feedbacks = getActivityFeedbacks(activity.id);
  assert.equal(feedbacks.length, 2);
  assert.ok(feedbacks.some((f) => f.participated === true));
  assert.ok(feedbacks.some((f) => f.participated === false));
});

test("Platform Store: chapa questions flow (asking & answering doubts)", () => {
  const question = createChapaQuestion({
    chapaId: "chapa-1",
    author: "Felipe Ramos",
    authorId: "aluno_felipe",
    turma: "3º EM B",
    proposalArea: "Esportes e Lazer",
    question: "Vocês pretendem manter os treinos de vôlei no contra-turno?",
  });

  assert.ok(question.id);
  assert.equal(question.answered, false);
  assert.equal(question.chapaId, "chapa-1");

  // Filter questions
  const chapa1Questions = getChapaQuestions("chapa-1");
  assert.ok(chapa1Questions.some((q) => q.id === question.id));

  // Answer question
  const answered = answerChapaQuestion(
    question.id,
    "Sim! Nosso plano prevê a ampliação dos treinos para duas vezes por semana.",
    "Chapa Voz Ativa"
  );

  assert.ok(answered);
  assert.equal(answered?.answered, true);
  assert.equal(
    answered?.answer,
    "Sim! Nosso plano prevê a ampliação dos treinos para duas vezes por semana."
  );
  assert.equal(answered?.answeredBy, "Chapa Voz Ativa");
  assert.ok(answered?.answeredAt);
});
