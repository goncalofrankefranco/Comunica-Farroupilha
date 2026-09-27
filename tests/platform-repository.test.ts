import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { after, test } from "node:test";
import { Pool } from "@neondatabase/serverless";
import { getTestDatabaseUrl } from "./test-database.ts";

const testDatabaseUrl = getTestDatabaseUrl();
const pool = new Pool({ connectionString: testDatabaseUrl ?? "postgres://localhost/test" });

const userId = randomUUID();
const otherUserId = randomUUID();
const proposalIds: string[] = [];
const questionIds: string[] = [];
const lifecycleUserIds: string[] = [];

after(async () => {
  if (!testDatabaseUrl) return;
  for (const proposalId of proposalIds) {
    await pool.query("DELETE FROM proposals WHERE id = $1", [proposalId]);
  }
  for (const questionId of questionIds) {
    await pool.query("DELETE FROM chapa_questions WHERE id = $1", [questionId]);
  }
  await pool.query("DELETE FROM notifications WHERE body LIKE '%[teste-repositorio]%' OR title LIKE '%[teste-repositorio]%'");
  await pool.query("DELETE FROM notifications WHERE body LIKE $1", [`%${userId}%`]);
  for (const lifecycleUserId of lifecycleUserIds) {
    await pool.query("DELETE FROM notifications WHERE body LIKE $1", [`%${lifecycleUserId}%`]);
  }
  await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[userId, otherUserId]]);
  await pool.end();
});

test("repository persists the complete proposal and activity lifecycle", { skip: !testDatabaseUrl }, async () => {
  const repository = await import("../src/lib/platform-repository.ts");
  const studentId = randomUUID();
  const gefId = randomUUID();
  lifecycleUserIds.push(studentId, gefId);
  await pool.query(
    `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
     VALUES ($1, $2, $3, '1º EM A', 'student', 'test-hash'),
            ($4, $5, $6, 'GEF', 'gef', 'test-hash')`,
    [studentId, `Estudante ${studentId}`, `estudante-${studentId}`, gefId, `GEF ${gefId}`, `gef-${gefId}`],
  );

  try {
    const proposal = await repository.createProposal({
      title: "[teste-repositorio] Ciclo completo",
      body: "Uma proposta persistente para validar status, resposta, atividade e avaliação no banco.",
      author: `Estudante ${studentId}`,
      authorId: studentId,
      anonymous: false,
      theme: "Esportes",
      origin: "student",
    });
    proposalIds.push(proposal.id);

    const withStatus = await repository.updateProposalStatus(proposal.id, "analysis", "[teste-repositorio] Em avaliação.");
    assert.equal(withStatus?.status, "analysis");
    assert.equal(withStatus?.gefResponse, "[teste-repositorio] Em avaliação.");

    const withResponse = await repository.updateProposalGefResponse(proposal.id, "[teste-repositorio] Aprovada para piloto.");
    assert.equal(withResponse?.gefResponse, "[teste-repositorio] Aprovada para piloto.");

    const activity = await repository.createActivity({
      proposalId: proposal.id,
      title: "[teste-repositorio] Recreio piloto",
      date: "2026-10-01",
      time: "10:15–10:35",
      place: "Pátio central",
      audience: "Todas as turmas",
    });
    assert.ok(activity);
    assert.equal(activity.status, "upcoming");
    assert.equal((await repository.getProposal(proposal.id))?.status, "scheduled");

    assert.equal((await repository.updateActivityStatus(activity.id, "done"))?.status, "done");
    assert.equal((await repository.getProposal(proposal.id))?.status, "completed");

    const feedback = await repository.submitActivityFeedback(activity.id, {
      userId: studentId,
      participated: true,
      rating: "great",
      comment: "[teste-repositorio] Funcionou muito bem.",
    });
    assert.ok(feedback);
    assert.equal((await repository.getActivityFeedbacks(activity.id)).length, 1);

    const question = await repository.createChapaQuestion({
      chapaId: "chapa-1",
      author: `Estudante ${studentId}`,
      authorId: studentId,
      turma: "1º EM A",
      proposalArea: "Esportes e movimento",
      proposalTitle: "Circuito de jogos rápidos",
      question: "[teste-repositorio] Quando começa o circuito?",
    });
    questionIds.push(question.id);
    assert.equal(question.answered, false);
    assert.equal((await repository.answerChapaQuestion(question.id, "[teste-repositorio] Em outubro.", `GEF ${gefId}`))?.answered, true);
    assert.ok((await repository.getChapaQuestions("chapa-1")).some((item) => item.id === question.id));

    await repository.markAllNotificationsRead(studentId);
    const snapshot = await repository.getPlatformSnapshot(studentId);
    assert.ok(snapshot.notifications.length > 0);
    assert.ok(snapshot.notifications.every((notification) => notification.read));
  } finally {
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[studentId, gefId]]);
  }
});

test("repository persists explicit interaction intent across concurrent requests", { skip: !testDatabaseUrl }, async () => {
  assert.equal(existsSync("src/lib/platform-repository.ts"), true, "relational repository must exist");
  const repository = await import("../src/lib/platform-repository.ts");

  await pool.query(
    `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
     VALUES ($1, $2, $3, '3º EM A', 'student', 'test-hash'),
            ($4, $5, $6, '2º EM B', 'student', 'test-hash')`,
    [userId, `Aluno ${userId}`, `aluno-${userId}`, otherUserId, `Aluno ${otherUserId}`, `aluno-${otherUserId}`],
  );

  const proposal = await repository.createProposal({
    title: "Persistência concorrente no recreio",
    body: "Esta proposta existe para validar a persistência real entre requisições concorrentes.",
    author: `Aluno ${userId}`,
    authorId: userId,
    anonymous: false,
    theme: "Convivência",
    origin: "student",
  });
  proposalIds.push(proposal.id);

  await Promise.all(Array.from({ length: 8 }, () => repository.setSupport(proposal.id, userId, true)));
  assert.deepEqual(await repository.setSupport(proposal.id, userId, true), { supported: true, supports: 1 });

  await Promise.all(Array.from({ length: 8 }, () => repository.setSaved(proposal.id, userId, true)));
  assert.deepEqual(await repository.setSaved(proposal.id, userId, true), { saved: true });

  const comment = await repository.addComment(proposal.id, {
    author: `Aluno ${userId}`,
    authorId: userId,
    role: "student",
    anonymous: false,
    body: "Comentário persistente para testar curtidas.",
  });
  assert.ok(comment);
  await Promise.all(Array.from({ length: 8 }, () => repository.setCommentLike(comment.id, userId, true)));
  assert.deepEqual(await repository.setCommentLike(comment.id, userId, true), { liked: true, likes: 1 });

  const snapshot = await repository.getPlatformSnapshot(userId);
  assert.ok(snapshot.proposals.some((item) => item.id === proposal.id));
  assert.deepEqual(snapshot.supportedByUser[userId], [proposal.id]);
  assert.deepEqual(snapshot.savedByUser[userId], [proposal.id]);
  assert.deepEqual(snapshot.likedCommentsByUser[userId], [comment.id]);

  const otherSnapshot = await repository.getPlatformSnapshot(otherUserId);
  assert.deepEqual(otherSnapshot.supportedByUser[otherUserId], []);
  assert.deepEqual(otherSnapshot.savedByUser[otherUserId], []);
  assert.deepEqual(otherSnapshot.likedCommentsByUser[otherUserId], []);
});

test("repository masks anonymous authors and rejects stale interaction revisions", { skip: !testDatabaseUrl }, async () => {
  const repository = await import("../src/lib/platform-repository.ts");
  const authorId = randomUUID();
  const studentViewerId = randomUUID();
  const gefViewerId = randomUUID();
  const marker = randomUUID();
  const ids = [authorId, studentViewerId, gefViewerId];
  let proposalId = "";
  let namedProposalId = "";
  try {
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
       VALUES ($1, $2, $3, '2º EM', 'student', 'test-hash'),
              ($4, $5, $6, '1º EM', 'student', 'test-hash'),
              ($7, $8, $9, 'GEF', 'gef', 'test-hash')`,
      [authorId, `Autor ${marker}`, `autor-${marker}`, studentViewerId, `Leitor ${marker}`, `leitor-${marker}`, gefViewerId, `GEF ${marker}`, `gef-${marker}`],
    );
    const proposal = await repository.createProposal({
      title: `[privacy-${marker}] Proposta anônima`,
      body: "Conteúdo suficiente para verificar a privacidade de autoria na resposta pública.",
      author: `Autor ${marker}`,
      authorId,
      anonymous: true,
      theme: "Convivência",
      origin: "student",
    });
    proposalId = proposal.id;
    const comment = await repository.addComment(proposal.id, {
      author: `Autor ${marker}`,
      authorId,
      role: "student",
      anonymous: true,
      body: "Comentário anônimo para teste de privacidade.",
    });
    assert.ok(comment);
    await repository.setSupport(proposal.id, authorId, true, 200);
    const namedProposal = await repository.createProposal({
      title: `[privacy-${marker}] Proposta identificada`,
      body: "A lista de estudantes que apoiaram uma proposta não deve ser pública.",
      author: `Autor ${marker}`,
      authorId,
      anonymous: false,
      theme: "Convivência",
      origin: "student",
    });
    namedProposalId = namedProposal.id;
    await repository.setSupport(namedProposal.id, authorId, true, 200);

    const studentSnapshot = await repository.getPlatformSnapshot(studentViewerId);
    const publicProposal = studentSnapshot.proposals.find((item) => item.id === proposal.id)!;
    const publicComment = studentSnapshot.comments.find((item) => item.id === comment.id)!;
    assert.equal(publicProposal.author, "");
    assert.equal(publicProposal.authorId, "");
    assert.equal(publicComment.author, "");
    assert.equal(publicComment.authorId, "");
    assert.deepEqual(studentSnapshot.supportersByProposal[proposal.id] ?? [], []);
    assert.deepEqual(studentSnapshot.supportersByProposal[namedProposal.id] ?? [], []);
    assert.deepEqual((await repository.getPlatformSnapshot()).supportersByProposal[namedProposal.id] ?? [], []);
    assert.equal((await repository.getProposalSupporters(namedProposal.id, false, authorId))[0]?.id, authorId);
    assert.deepEqual(await repository.getProposalSupporters(namedProposal.id), []);

    const gefSnapshot = await repository.getPlatformSnapshot(gefViewerId);
    assert.equal(gefSnapshot.proposals.find((item) => item.id === proposal.id)?.author, `Autor ${marker}`);
    assert.equal(gefSnapshot.supportersByProposal[proposal.id]?.[0]?.id, authorId);
    assert.equal(gefSnapshot.supportersByProposal[namedProposal.id]?.[0]?.id, authorId);

    await repository.setSupport(proposal.id, studentViewerId, true, 200);
    await repository.setSupport(proposal.id, studentViewerId, false, 199);
    await repository.setSaved(proposal.id, studentViewerId, true, 200);
    await repository.setSaved(proposal.id, studentViewerId, false, 199);
    await repository.setCommentLike(comment.id, studentViewerId, true, 200);
    await repository.setCommentLike(comment.id, studentViewerId, false, 199);

    const finalSnapshot = await repository.getPlatformSnapshot(studentViewerId);
    assert.deepEqual(finalSnapshot.supportedByUser[studentViewerId], [proposal.id]);
    assert.deepEqual(finalSnapshot.savedByUser[studentViewerId], [proposal.id]);
    assert.deepEqual(finalSnapshot.likedCommentsByUser[studentViewerId], [comment.id]);
  } finally {
    if (proposalId) await pool.query("DELETE FROM proposals WHERE id = $1", [proposalId]);
    if (namedProposalId) await pool.query("DELETE FROM proposals WHERE id = $1", [namedProposalId]);
    await pool.query("DELETE FROM notifications WHERE body LIKE $1", [`%${marker}%`]);
    await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [ids]);
  }
});

test("GEF seeding cannot promote a student or preserve their session as an administrator", { skip: !testDatabaseUrl }, async () => {
  const auth = await import("../src/lib/auth-repository.ts");
  const id = randomUUID();
  const username = `seed-collision-${id}`;
  const normalized = username.toLowerCase();
  const tokenHash = `seed-session-${id}`;

  await pool.query(
    `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
     VALUES ($1, $2, $3, '3º EM A', 'student', 'test-hash')`,
    [id, username, normalized],
  );
  try {
    await auth.createSession(id, tokenHash, new Date(Date.now() + 60_000));
    await assert.rejects(
      auth.upsertGefAccount({ name: username, turma: "GEF", passwordHash: "new-hash" }),
      /GEF_USERNAME_CONFLICT/,
    );
    assert.equal((await auth.getSessionUser(tokenHash))?.role, "student");
  } finally {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
  }
});

test("comment parents stay in the same proposal and cancelled proposals reject writes", { skip: !testDatabaseUrl }, async () => {
  const repository = await import("../src/lib/platform-repository.ts");
  const userId = randomUUID();
  const marker = randomUUID();
  let targetProposalId = "";
  let parentProposalId = "";
  try {
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
       VALUES ($1, $2, $3, '2º EM', 'student', 'test-hash')`,
      [userId, `Comentador ${marker}`, `comentador-${marker}`],
    );
    const target = await repository.createProposal({
      title: `Validação ${marker}`,
      body: "Proposta usada somente para testar as fronteiras dos comentários.",
      author: `Comentador ${marker}`,
      authorId: userId,
      anonymous: false,
      theme: "Convivência",
      origin: "student",
    });
    targetProposalId = target.id;
    const parentProposal = await repository.createProposal({
      title: `Outra ${marker}`,
      body: "Uma proposta diferente para validar a associação do comentário pai.",
      author: `Comentador ${marker}`,
      authorId: userId,
      anonymous: false,
      theme: "Convivência",
      origin: "student",
    });
    parentProposalId = parentProposal.id;
    const parent = await repository.addComment(parentProposal.id, {
      author: `Comentador ${marker}`, authorId: userId, role: "student", anonymous: false, body: "Comentário pai válido.",
    });
    assert.ok(parent);
    await assert.rejects(repository.addComment(target.id, {
      author: `Comentador ${marker}`, authorId: userId, role: "student", anonymous: false, body: "Resposta cruzada inválida.", parentId: parent.id,
    }), /COMMENT_PARENT_MISMATCH/);
    assert.ok(await repository.cancelProposal(target.id, userId));
    await assert.rejects(repository.addComment(target.id, {
      author: `Comentador ${marker}`, authorId: userId, role: "student", anonymous: false, body: "Comentário após cancelamento.",
    }), /PROPOSAL_CANCELLED/);
  } finally {
    if (targetProposalId) await pool.query("DELETE FROM proposals WHERE id = $1", [targetProposalId]);
    if (parentProposalId) await pool.query("DELETE FROM proposals WHERE id = $1", [parentProposalId]);
    await pool.query("DELETE FROM notifications WHERE body LIKE $1", [`%${marker}%`]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }
});

test("comment pages preserve timestamp precision and do not repeat rows", { skip: !testDatabaseUrl }, async () => {
  const repository = await import("../src/lib/platform-repository.ts");
  const { parseTimestampCursor } = await import("../src/lib/http.ts");
  const userId = randomUUID();
  const marker = randomUUID();
  const commentIds = Array.from({ length: 102 }, () => randomUUID());
  let proposalId = "";
  try {
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
       VALUES ($1, $2, $3, '2º EM', 'student', 'test-hash')`,
      [userId, `Paginador ${marker}`, `paginador-${marker}`],
    );
    const proposal = await repository.createProposal({
      title: `Comentários ${marker}`,
      body: "Uma proposta para testar páginas estáveis de comentários armazenados.",
      author: `Paginador ${marker}`,
      authorId: userId,
      anonymous: false,
      theme: "Convivência",
      origin: "student",
    });
    proposalId = proposal.id;
    await pool.query(
      `INSERT INTO comments (id, proposal_id, author_id, author_name, author_role, anonymous, body, parent_id, created_at)
       SELECT comment_id, $2, $3, $4, 'student', false, 'Comentário de teste de paginação.', NULL,
         now() - (ordinality * interval '1 microsecond')
       FROM unnest($1::uuid[]) WITH ORDINALITY AS items(comment_id, ordinality)`,
      [commentIds, proposalId, userId, `Paginador ${marker}`],
    );

    const firstPage = await repository.getComments(proposalId);
    assert.equal(firstPage.comments.length, 100);
    assert.ok(firstPage.nextCursor);
    const cursor = parseTimestampCursor(firstPage.nextCursor);
    assert.ok(cursor);
    assert.match(cursor.createdAt, /\.\d{6}Z$/);
    const lastPage = await repository.getComments(proposalId, false, cursor);
    assert.equal(lastPage.comments.length, 2);
    assert.equal(lastPage.nextCursor, null);
    assert.equal(new Set([...firstPage.comments, ...lastPage.comments].map(({ id }) => id)).size, 102);
  } finally {
    if (proposalId) await pool.query("DELETE FROM proposals WHERE id = $1", [proposalId]);
    await pool.query("DELETE FROM notifications WHERE body LIKE $1", [`%${marker}%`]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }
});

test("comment insertion waits for cancellation and rejects the closed proposal", { skip: !testDatabaseUrl }, async () => {
  const repository = await import("../src/lib/platform-repository.ts");
  const userId = randomUUID();
  const marker = randomUUID();
  let proposalId = "";
  const lock = await pool.connect();
  let transactionOpen = false;
  try {
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
       VALUES ($1, $2, $3, '2º EM', 'student', 'test-hash')`,
      [userId, `Corrida ${marker}`, `corrida-${marker}`],
    );
    const proposal = await repository.createProposal({
      title: `Corrida comentário ${marker}`,
      body: "Proposta usada para serializar a criação do comentário com o cancelamento.",
      author: `Corrida ${marker}`,
      authorId: userId,
      anonymous: false,
      theme: "Convivência",
      origin: "student",
    });
    proposalId = proposal.id;
    await lock.query("BEGIN");
    transactionOpen = true;
    await lock.query("SELECT id FROM proposals WHERE id = $1 FOR UPDATE", [proposalId]);
    const commentAttempt = repository.addComment(proposalId, {
      author: `Corrida ${marker}`, authorId: userId, role: "student", anonymous: false, body: "Este comentário não deve atravessar o cancelamento.",
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await lock.query("UPDATE proposals SET status = 'cancelled' WHERE id = $1", [proposalId]);
    await lock.query("COMMIT");
    transactionOpen = false;

    await assert.rejects(commentAttempt, /PROPOSAL_CANCELLED/);
    const comments = await pool.query("SELECT id FROM comments WHERE proposal_id = $1", [proposalId]);
    assert.equal(comments.rows.length, 0);
  } finally {
    if (transactionOpen) await lock.query("ROLLBACK");
    lock.release();
    if (proposalId) await pool.query("DELETE FROM proposals WHERE id = $1", [proposalId]);
    await pool.query("DELETE FROM notifications WHERE body LIKE $1", [`%${marker}%`]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }
});

test("activity creation cannot replace a cancellation while waiting on the proposal lock", { skip: !testDatabaseUrl }, async () => {
  const repository = await import("../src/lib/platform-repository.ts");
  const userId = randomUUID();
  const marker = randomUUID();
  let proposalId = "";
  const lock = await pool.connect();
  let transactionOpen = false;
  try {
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, class_name, role, password_hash)
       VALUES ($1, $2, $3, 'GEF', 'gef', 'test-hash')`,
      [userId, `GEF corrida ${marker}`, `gef-corrida-${marker}`],
    );
    const proposal = await repository.createProposal({
      title: `Corrida agenda ${marker}`,
      body: "Proposta usada para serializar o agendamento com o cancelamento.",
      author: `GEF ${marker}`,
      authorId: userId,
      anonymous: false,
      theme: "Convivência",
      origin: "gef",
    });
    proposalId = proposal.id;
    await repository.updateProposalStatus(proposalId, "analysis");
    await lock.query("BEGIN");
    transactionOpen = true;
    await lock.query("SELECT id FROM proposals WHERE id = $1 FOR UPDATE", [proposalId]);
    const activityAttempt = repository.createActivity({
      proposalId,
      title: `Atividade ${marker}`,
      date: "2026-10-01",
      time: "10:15",
      place: "Pátio",
      audience: "Todas as turmas",
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await lock.query("UPDATE proposals SET status = 'cancelled' WHERE id = $1", [proposalId]);
    await lock.query("COMMIT");
    transactionOpen = false;

    assert.equal(await activityAttempt, null);
    assert.equal((await repository.getProposal(proposalId))?.status, "cancelled");
    const activities = await pool.query("SELECT id FROM activities WHERE proposal_id = $1", [proposalId]);
    assert.equal(activities.rows.length, 0);
  } finally {
    if (transactionOpen) await lock.query("ROLLBACK");
    lock.release();
    if (proposalId) await pool.query("DELETE FROM proposals WHERE id = $1", [proposalId]);
    await pool.query("DELETE FROM notifications WHERE body LIKE $1", [`%${marker}%`]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }
});
