/* =========================================================
   D.PEDRO SOLUÇÕES — ASSISTENTE IA
   Responde sobre a empresa; se não souber → WhatsApp
   ========================================================= */
'use strict';

(function () {
  const WA_NUMBER = '244946299834';

  // Base de conhecimento (offline, sem API externa)
  const KB = [
    { q: ['quem', 'empresa', 'sobre', 'd.pedro'], a: 'A **D.PEDRO SOLUÇÕES** é uma empresa angolana fundada em 2021, com sede em Viana, Vila Flor (Luanda). Atuamos em tecnologia, segurança eletrónica, energia solar, gráfica e serviços empresariais.' },
    { q: ['morada', 'endereço', 'onde', 'sede', 'localização'], a: '📍 Estamos em **Viana, Vila Flor, Luanda** — Rua Direita da Engevia.' },
    { q: ['telefone', 'contacto', 'whatsapp', 'número'], a: '📞 **+244 946 299 834** | **+244 959 777 301**\n📧 dpedroservice@gmail.com\n💬 WhatsApp: [clique aqui](https://wa.me/244946299834)' },
    { q: ['horário', 'hora', 'aberto', 'funciona'], a: '🕒 **Seg-Sex:** 08h00–17h00\n🕒 **Sábado:** 08h00–13h00' },
    { q: ['cftv', 'câmara', 'vigilância', 'segurança'], a: '🎥 Instalamos sistemas **CFTV** (IP e analógico), com visão noturna, 4K, IA e acesso remoto via APP. Preços desde 25.000 Kz por câmara instalada.' },
    { q: ['solar', 'energia', 'painel', 'off grid'], a: '☀️ Dimensionamos e instalamos **sistemas solares** (painéis, inversores, baterias) para residências e empresas. Projetos desde 450.000 Kz (kit 1kW).' },
    { q: ['erp', 'kanawasoft', 'software', 'gestão'], a: '💻 O **KanawaSoft ERP** é o nosso sistema de gestão completo: PDV, estoque, financeiro, fiscal AGT, RH. Licenças a partir de **14.500 Kz**. [Ver detalhes](erp.html)' },
    { q: ['loja', 'comprar', 'produto', 'catálogo', 'preço'], a: '🛒 Temos **100 produtos** em 7 categorias: Informática, Gráfica, Energia, Papelaria, Telecom, Rastreio e Serviços. [Ver loja](loja.html)' },
    { q: ['gráfica', 'design', 'logotipo', 'impressão', 'cartão'], a: '🎨 Fazemos logotipos, cartões de visita, flyers, banners, outdoors, camisetas e edição de vídeo. Orçamentos personalizados.' },
    { q: ['rastreio', 'gps', 'frota', 'veículo'], a: '🛰️ Instalamos **rastreadores GPS veiculares** com corte de motor e plataforma de gestão de frota. Desde 85.000 Kz por veículo.' },
    { q: ['garantia', 'avaria', 'defeito'], a: '🛡️ Todos os equipamentos têm **garantia de fábrica** (1 a 3 anos). A instalação tem 1 ano de garantia.' },
    { q: ['manutenção', 'assistência', 'reparação'], a: '🔧 Oferecemos manutenção **preventiva e corretiva**, com contratos mensais. Visita técnica desde 20.000 Kz.' },
    { q: ['pagamento', 'pagar', 'multicaixa', 'transferência'], a: '💳 Aceitamos **dinheiro, transferência bancária, Multicaixa e pagamento faseado** em projetos de maior dimensão.' },
    { q: ['prazo', 'entrega', 'instalação'], a: '🚚 **Entrega em Luanda:** 24–48h.\n🔧 **Instalação:** 1–2 dias (simples) ou 1–3 semanas (projetos complexos).' },
    { q: ['recrutamento', 'emprego', 'vaga', 'trabalhar'], a: '👥 Estamos sempre à procura de talentos! Consulte [vagas](recrutamento.html) ou envie CV para dpedroservice@gmail.com.' },
    { q: ['obrigado', 'obrigada', 'agradeço'], a: '🙏 De nada! Estamos ao dispor. Se precisar de mais alguma coisa, é só perguntar.' },
    { q: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite'], a: '👋 Olá! Sou o assistente virtual da **D.PEDRO SOLUÇÕES**. Posso ajudar com informações sobre produtos, serviços, contactos e muito mais. O que procura?' }
  ];

  const FALLBACK = `Não encontrei uma resposta específica para essa pergunta. 🤔\n\nPara um atendimento **personalizado**, fale diretamente com a nossa equipa no WhatsApp:`;

  function normalize(txt) { return (txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  function findAnswer(q) {
    const nq = normalize(q);
    let best = null, bestScore = 0;
    KB.forEach(item => {
      let score = 0;
      item.q.forEach(k => { if (nq.includes(normalize(k))) score++; });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    return bestScore > 0 ? best.a : null;
  }

  function formatAnswer(txt) {
    return txt
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:var(--primary);">$1</a>')
      .replace(/\n/g, '<br>');
  }

  // ============ UI ============
  function createAssistant() {
    const container = document.getElementById('aiAssistant');
    if (!container) return;

    container.innerHTML = `
      <button id="aiToggle" style="position:fixed;bottom:100px;right:30px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border:none;font-size:1.6rem;cursor:pointer;box-shadow:0 8px 24px rgba(124,58,237,.4);z-index:150;transition:.3s;">
        <i class="fas fa-robot"></i>
      </button>
      <div id="aiPanel" style="position:fixed;bottom:170px;right:30px;width:min(380px,calc(100vw - 40px));height:min(550px,70vh);background:var(--card);border-radius:1.2rem;box-shadow:0 25px 60px rgba(0,0,0,.25);z-index:151;display:none;flex-direction:column;overflow:hidden;border:1px solid var(--border);">
        <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:1rem 1.2rem;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:.6rem;">
            <i class="fas fa-robot"></i>
            <div>
              <div style="font-weight:700;font-size:.95rem;">Assistente D.PEDRO</div>
              <div style="font-size:.7rem;opacity:.9;">Online · Responde em segundos</div>
            </div>
          </div>
          <button onclick="AI.close()" style="background:rgba(255,255,255,.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;">✕</button>
        </div>
        <div id="aiMessages" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.6rem;background:var(--bg);">
          <div class="ai-msg ai-bot">${formatAnswer('👋 Olá! Sou o assistente virtual da **D.PEDRO SOLUÇÕES**.\\n\\nPergunte-me sobre:\\n• Produtos e preços\\n• Serviços (CFTV, solar, gráfica)\\n• Contactos e morada\\n• Garantia e prazos\\n\\nO que procura?')}</div>
        </div>
        <div style="padding:.6rem;border-top:1px solid var(--border);display:flex;gap:.5rem;">
          <input id="aiInput" type="text" placeholder="Escreva a sua pergunta..." style="flex:1;padding:.7rem 1rem;border:2px solid var(--border);border-radius:30px;background:var(--bg);color:var(--text);font-family:inherit;font-size:.9rem;">
          <button onclick="AI.send()" style="background:var(--primary);color:#fff;border:none;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1rem;">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
      <style>
        .ai-msg { padding:.7rem 1rem; border-radius:1rem; max-width:85%; font-size:.88rem; line-height:1.5; animation:fadeIn .3s; }
        .ai-bot { background:var(--card); color:var(--text); align-self:flex-start; border-bottom-left-radius:.3rem; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .ai-user { background:var(--primary); color:#fff; align-self:flex-end; border-bottom-right-radius:.3rem; }
        .ai-wa { display:inline-flex; align-items:center; gap:.4rem; background:#25D366; color:#fff; padding:.5rem 1rem; border-radius:30px; text-decoration:none; font-weight:600; margin-top:.5rem; font-size:.85rem; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      </style>
    `;

    document.getElementById('aiToggle').onclick = () => AI.toggle();
    document.getElementById('aiInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') AI.send();
    });
  }

  function toggle() {
    const p = document.getElementById('aiPanel');
    if (!p) return;
    p.style.display = p.style.display === 'none' || !p.style.display ? 'flex' : 'none';
  }
  function close() {
    const p = document.getElementById('aiPanel');
    if (p) p.style.display = 'none';
  }

  function addMsg(html, who) {
    const box = document.getElementById('aiMessages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'ai-msg ai-' + who;
    div.innerHTML = html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function send() {
    const inp = document.getElementById('aiInput');
    const txt = inp.value.trim();
    if (!txt) return;
    addMsg(txt, 'user');
    inp.value = '';

    // Simula "escrever..."
    addMsg('<i class="fas fa-circle-notch fa-spin"></i>', 'bot');
    const box = document.getElementById('aiMessages');
    const typing = box.lastChild;

    setTimeout(() => {
      box.removeChild(typing);
      const ans = findAnswer(txt);
      if (ans) {
        addMsg(formatAnswer(ans), 'bot');
      } else {
        addMsg(
          formatAnswer(FALLBACK) +
          `<br><a href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Olá! Tenho uma dúvida: ' + txt)}" target="_blank" class="ai-wa"><i class="fab fa-whatsapp"></i> Falar com humano</a>`,
          'bot'
        );
      }
    }, 600);
  }

  document.addEventListener('DOMContentLoaded', createAssistant);

  window.AI = { toggle, close, send };
})();