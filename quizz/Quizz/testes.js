const QUESTIONS = require('./questions.js');
const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (let round = 1; round <= 5; round++) {
  assert(QUESTIONS.length === 50, `Teste ${round}: banco não tem 50 perguntas`);
  const ids = new Set(QUESTIONS.map(q => q.id));
  assert(ids.size === 50, `Teste ${round}: IDs repetidos`);
  for (const q of QUESTIONS) {
    assert(q.opcoes.length === 4, `Teste ${round}: pergunta ${q.id} não tem 4 opções`);
    assert(new Set(q.opcoes).size === 4, `Teste ${round}: pergunta ${q.id} tem opções repetidas`);
    assert(q.opcoes.filter(o => o === q.correta).length === 1, `Teste ${round}: pergunta ${q.id} não tem exatamente 1 correta`);
    assert(q.pergunta && q.explicacao && q.regra && q.categoria, `Teste ${round}: pergunta ${q.id} incompleta`);
  }
  const html = fs.readFileSync('./index.html', 'utf8');
  const css = fs.readFileSync('./styles.css', 'utf8');
  const app = fs.readFileSync('./app.js', 'utf8');
  assert(html.includes('questions.js') && html.includes('app.js'), `Teste ${round}: scripts não ligados`);
  assert(html.includes('assets/emblema-eac.png'), `Teste ${round}: emblema não ligado`);
  assert(css.includes('@media'), `Teste ${round}: responsividade ausente`);
  assert(app.includes('localStorage'), `Teste ${round}: estatísticas locais ausentes`);
  assert(app.includes('shuffle(QUESTIONS)'), `Teste ${round}: perguntas não embaralhadas`);
  assert(app.includes('state.helpsLeft'), `Teste ${round}: ajuda do treinador ausente`);
  assert(app.includes('CHALLENGE_SECONDS'), `Teste ${round}: modo desafio sem cronómetro`);
  console.log(`TESTE ${round}/5: OK`);
}
console.log('SUCESSO: todos os 5 ciclos de validação passaram.');
