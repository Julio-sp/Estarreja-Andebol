/* Desafio EAC — lógica principal. Sem bibliotecas externas. */
(function () {
  'use strict';

  const TOTAL_PER_GAME = 15;
  const CHALLENGE_SECONDS = 20;
  const STORAGE_KEY = 'desafio-eac-estatisticas-v1';

  const state = {
    mode: 'treino',
    questions: [],
    currentIndex: 0,
    score: 0,
    correct: 0,
    wrong: 0,
    helpsLeft: 3,
    answered: false,
    timerId: null,
    timeLeft: CHALLENGE_SECONDS,
    questionStartedAt: 0,
    helpUsedThisQuestion: false
  };

  const $ = (id) => document.getElementById(id);
  const screens = ['homeScreen', 'quizScreen', 'resultScreen', 'statsScreen', 'signalsScreen'];

  function showScreen(id) {
    screens.forEach((screen) => $(screen).classList.toggle('active', screen === id));
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('app').focus({ preventScroll: true });
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getStats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        games: 0, questions: 0, correct: 0, bestScore: 0, helps: 0
      };
    } catch (_) {
      return { games: 0, questions: 0, correct: 0, bestScore: 0, helps: 0 };
    }
  }

  function saveStats() {
    const stats = getStats();
    stats.games += 1;
    stats.questions += state.questions.length;
    stats.correct += state.correct;
    stats.helps += 3 - state.helpsLeft;
    stats.bestScore = Math.max(stats.bestScore, state.score);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }

  function renderStats() {
    const stats = getStats();
    const accuracy = stats.questions ? Math.round((stats.correct / stats.questions) * 100) : 0;
    $('statGames').textContent = stats.games;
    $('statQuestions').textContent = stats.questions;
    $('statCorrect').textContent = stats.correct;
    $('statAccuracy').textContent = `${accuracy}%`;
    $('statBest').textContent = stats.bestScore;
    $('statHelps').textContent = stats.helps;
    $('statsNote').textContent = stats.games
      ? `Já jogaste ${stats.games} ${stats.games === 1 ? 'partida' : 'partidas'}. Continua a treinar e tenta melhorar o teu aproveitamento.`
      : 'Joga uma partida para começares a construir o teu histórico.';
  }

  function beep(kind) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = kind === 'correct' ? 660 : 220;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch (_) { /* áudio é opcional */ }
  }

  function startGame(mode) {
    stopTimer();
    state.mode = mode;
    state.questions = shuffle(QUESTIONS).slice(0, Math.min(TOTAL_PER_GAME, QUESTIONS.length));
    state.currentIndex = 0;
    state.score = 0;
    state.correct = 0;
    state.wrong = 0;
    state.helpsLeft = 3;
    state.answered = false;
    $('modeLabel').textContent = mode === 'desafio' ? 'MODO DESAFIO' : 'MODO TREINO';
    $('timerBox').hidden = mode !== 'desafio';
    $('scoreLabel').textContent = '0 pontos';
    $('helpCount').textContent = '3';
    $('coachHelp').disabled = false;
    showScreen('quizScreen');
    renderQuestion();
  }

  function renderQuestion() {
    stopTimer();
    const q = state.questions[state.currentIndex];
    state.answered = false;
    state.helpUsedThisQuestion = false;

    $('questionNumber').textContent = state.currentIndex + 1;
    $('questionTotal').textContent = state.questions.length;
    $('categoryPill').textContent = q.categoria;
    $('questionText').textContent = q.pergunta;
    $('pointsLabel').textContent = state.mode === 'desafio' ? '+100 + bónus de rapidez' : '+100 pontos';
    $('progressBar').style.width = `${((state.currentIndex) / state.questions.length) * 100}%`;
    $('feedback').hidden = true;
    $('feedback').className = 'feedback';

    const answers = $('answers');
    answers.innerHTML = '';
    shuffle(q.opcoes).forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'answer-button';
      button.type = 'button';
      button.dataset.answer = option;
      button.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option)}</span>`;
      button.addEventListener('click', () => answerQuestion(option));
      answers.appendChild(button);
    });

    $('coachHelp').disabled = state.helpsLeft <= 0;
    if (state.mode === 'desafio') startTimer();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function startTimer() {
    state.timeLeft = CHALLENGE_SECONDS;
    state.questionStartedAt = Date.now();
    updateTimer();
    state.timerId = window.setInterval(() => {
      state.timeLeft -= 1;
      updateTimer();
      if (state.timeLeft <= 0) {
        stopTimer();
        answerQuestion(null, true);
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) window.clearInterval(state.timerId);
    state.timerId = null;
  }

  function updateTimer() {
    $('timer').textContent = Math.max(0, state.timeLeft);
    $('timerBox').classList.toggle('warning', state.timeLeft <= 5);
  }

  function answerQuestion(selected, timedOut = false) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();

    const q = state.questions[state.currentIndex];
    const isCorrect = selected === q.correta;
    const buttons = [...$('answers').querySelectorAll('.answer-button')];
    buttons.forEach((button) => {
      button.disabled = true;
      if (button.dataset.answer === q.correta) button.classList.add('correct');
      if (selected && button.dataset.answer === selected && !isCorrect) button.classList.add('wrong');
    });

    let points = 0;
    if (isCorrect) {
      points = 100;
      if (state.mode === 'desafio') {
        const elapsed = Math.max(0, (Date.now() - state.questionStartedAt) / 1000);
        points += Math.round(Math.max(0, CHALLENGE_SECONDS - elapsed) * 3);
      }
      state.correct += 1;
      state.score += points;
      beep('correct');
      $('feedback').classList.add('correct');
      $('feedbackTitle').textContent = `✓ Resposta certa${points > 100 ? ` — +${points} pontos` : ' — +100 pontos'}`;
    } else {
      state.wrong += 1;
      beep('wrong');
      $('feedback').classList.add('wrong');
      $('feedbackTitle').textContent = timedOut ? '⏱ Tempo esgotado' : '✕ Ainda não é essa';
    }

    $('feedbackText').textContent = q.explicacao;
    $('feedbackRule').textContent = `Base: ${q.regra}`;
    $('feedback').hidden = false;
    $('scoreLabel').textContent = `${state.score} pontos`;
    $('progressBar').style.width = `${((state.currentIndex + 1) / state.questions.length) * 100}%`;
    $('nextButton').textContent = state.currentIndex === state.questions.length - 1 ? 'Ver resultado →' : 'Próxima pergunta →';
  }

  function useCoachHelp() {
    if (state.answered || state.helpsLeft <= 0 || state.helpUsedThisQuestion) return;
    const q = state.questions[state.currentIndex];
    const wrongButtons = shuffle([...$('answers').querySelectorAll('.answer-button')]
      .filter((button) => button.dataset.answer !== q.correta));
    wrongButtons.slice(0, 2).forEach((button) => button.classList.add('eliminated'));
    state.helpsLeft -= 1;
    state.helpUsedThisQuestion = true;
    $('helpCount').textContent = state.helpsLeft;
    $('coachHelp').disabled = state.helpsLeft <= 0;
  }

  function nextQuestion() {
    if (!state.answered) return;
    if (state.currentIndex >= state.questions.length - 1) {
      finishGame();
      return;
    }
    state.currentIndex += 1;
    renderQuestion();
  }

  function finishGame() {
    stopTimer();
    saveStats();
    const total = state.questions.length;
    const percent = Math.round((state.correct / total) * 100);
    let medal = '🌱';
    let title = 'Continua a evoluir!';
    let message = 'O importante é aprender. Na próxima partida podes melhorar ainda mais.';
    if (percent >= 90) { medal = '🏆'; title = 'Mestre das regras!'; message = 'Excelente domínio das regras. Agora é levar esse conhecimento para o jogo!'; }
    else if (percent >= 75) { medal = '🥇'; title = 'Grande jogo!'; message = 'Muito bom! Já tens uma base forte para jogar e compreender as decisões.'; }
    else if (percent >= 60) { medal = '🥈'; title = 'Bom trabalho!'; message = 'Estás no caminho certo. Mais algumas partidas e vais consolidar estas regras.'; }
    else if (percent >= 40) { medal = '🥉'; title = 'Boa tentativa!'; message = 'Há algumas regras para rever, mas já começaste a aprender enquanto jogas.'; }

    $('resultMedal').textContent = medal;
    $('resultTitle').textContent = title;
    $('resultMessage').textContent = message;
    $('finalScore').textContent = state.score;
    $('finalCorrect').textContent = state.correct;
    $('finalWrong').textContent = state.wrong;
    $('finalPercent').textContent = `${percent}%`;
    showScreen('resultScreen');
  }

  const SIGNALS = [
    ['01', '🖐️', 'Advertência de jogo passivo', 'A equipa em posse deve alterar o modo de atacar.'],
    ['02', '2️⃣', 'Exclusão', 'Indica a exclusão temporária de 2 minutos.'],
    ['03', '🟨', 'Advertência', 'Cartão amarelo: advertência disciplinar.'],
    ['04', '🟥', 'Desqualificação', 'Cartão vermelho: o jogador ou oficial é desqualificado.'],
    ['05', '🟦', 'Relatório escrito', 'O azul, depois do vermelho, informa que é necessário relatório escrito nos casos previstos.'],
    ['06', '⏱️', 'Time-out', 'Indica uma interrupção do tempo de jogo.'],
    ['07', '➡️', 'Direção do lançamento lateral', 'Indica a equipa que tem direito ao lançamento de reposição em jogo.'],
    ['08', '🎯', 'Golo', 'Indica que o golo foi validado.'],
    ['09', '✋ 3', '3 segundos / passos', 'Representação educativa do sinal usado para indicar passos ou segurar a bola mais de 3 segundos.']
  ];

  function renderSignals() {
    $('signalsGrid').innerHTML = SIGNALS.map(([num, icon, title, text]) => `
      <article class="signal-card">
        <span class="signal-number">SINAL ${num}</span>
        <div class="signal-icon" aria-hidden="true">${icon}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
      </article>
    `).join('');
  }

  function confirmResetStats() {
    if (!confirm('Queres mesmo apagar todas as estatísticas guardadas neste dispositivo?')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderStats();
  }

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => startGame(button.dataset.mode));
  });
  $('brandButton').addEventListener('click', () => showScreen('homeScreen'));
  $('statsButton').addEventListener('click', () => { renderStats(); showScreen('statsScreen'); });
  $('signalsButton').addEventListener('click', () => showScreen('signalsScreen'));
  $('homeStats').addEventListener('click', () => { renderStats(); showScreen('statsScreen'); });
  $('homeSignals').addEventListener('click', () => showScreen('signalsScreen'));
  $('coachHelp').addEventListener('click', useCoachHelp);
  $('nextButton').addEventListener('click', nextQuestion);
  $('quitButton').addEventListener('click', () => { stopTimer(); showScreen('homeScreen'); });
  $('playAgain').addEventListener('click', () => startGame(state.mode));
  $('resultStats').addEventListener('click', () => { renderStats(); showScreen('statsScreen'); });
  $('resultHome').addEventListener('click', () => showScreen('homeScreen'));
  $('statsHome').addEventListener('click', () => showScreen('homeScreen'));
  $('signalsHome').addEventListener('click', () => showScreen('homeScreen'));
  $('resetStats').addEventListener('click', confirmResetStats);

  renderSignals();
  renderStats();
})();
