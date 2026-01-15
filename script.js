let ativos = JSON.parse(localStorage.getItem('invest_v4_cat')) || [];
let chartInstance = null;
const catColors = { fii: '#0984e3', acao: '#6c5ce7', cripto: '#f1c40f', outros: '#95a5a6' };

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('n-' + id).classList.add('active');
    if(id === 'home') renderChart();
}

function addAtivo() {
    const tk = document.getElementById('tk').value.toUpperCase().trim();
    const ct = document.getElementById('cat').value;
    const mt = parseInt(document.getElementById('mt').value) || 0;
    const mv = parseFloat(document.getElementById('mv').value) || 0;
    const pr = parseFloat(document.getElementById('pr').value) || 0;
    const rd = parseFloat(document.getElementById('rd').value) || 0;

    if(!tk) return alert("Digite o Ticker!");
    
    ativos.push({ id: Date.now(), ticker: tk, categoria: ct, qtd: 0, meta: mt, metaVal: mv, preco: pr, rend: rd });
    save(); 
    showPage('carteira');
    limparFormulario();
}

function limparFormulario() {
    document.getElementById('tk').value = '';
    document.getElementById('mt').value = '';
    document.getElementById('mv').value = '';
    document.getElementById('pr').value = '';
    document.getElementById('rd').value = '';
}

function changeQty(id, delta) {
    const i = ativos.findIndex(a => a.id === id);
    ativos[i].qtd = Math.max(0, ativos[i].qtd + delta);
    save();
}

async function syncB3() {
    if(ativos.length === 0) return;
    const proxy = "https://corsproxy.io/?"; 
    const url = `https://brapi.dev/api/quote/${ativos.map(a => a.ticker).join(',')}`;

    try {
        const r = await fetch(proxy + encodeURIComponent(url));
        const d = await r.json();
        if(d.results) {
            d.results.forEach(res => {
                let i = ativos.findIndex(a => a.ticker === res.symbol);
                if(i !== -1) ativos[i].preco = res.regularMarketPrice;
            });
            save(); 
            alert("Preços atualizados!");
        }
    } catch(e) { alert("Erro ao sincronizar preços."); }
}

function save() {
    localStorage.setItem('invest_v4_cat', JSON.stringify(ativos));
    render();
}

function renderChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if(chartInstance) chartInstance.destroy();
    const resumo = { fii: 0, acao: 0, cripto: 0, outros: 0 };
    ativos.forEach(a => resumo[a.categoria] += (a.qtd * a.preco));

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['FIIs', 'Ações', 'Cripto', 'Outros'],
            datasets: [{
                data: Object.values(resumo),
                backgroundColor: Object.values(catColors),
                borderWidth: 0
            }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom' } } }
    });
}

function render() {
    const lista = document.getElementById('lista-ativos');
    lista.innerHTML = '';
    let tVal = 0, tRen = 0;

    ativos.forEach(a => {
        const total = a.qtd * a.preco;
        const renda = a.qtd * a.rend;
        tVal += total; tRen += renda;
        const perc = a.meta > 0 ? Math.min((a.qtd/a.meta)*100, 100) : 0;

        lista.innerHTML += `
            <div class="asset-card" style="border-top: 4px solid ${catColors[a.categoria]}">
                <span class="category-tag" style="background:${catColors[a.categoria]}">${a.categoria}</span>
                <div style="display:flex; justify-content:space-between">
                    <strong>${a.ticker}</strong>
                    <b style="color:var(--green)">+ R$ ${renda.toFixed(2)}</b>
                </div>
                <div class="controls">
                    <button class="btn-qty" style="background:var(--red)" onclick="changeQty(${a.id},-1)">-</button>
                    <span class="qty-num">${a.qtd}</span>
                    <button class="btn-qty" style="background:var(--green)" onclick="changeQty(${a.id},1)">+</button>
                </div>
                <div style="height:6px; background:#eee; border-radius:3px; overflow:hidden">
                    <div style="width:${perc}%; height:100%; background:var(--primary); transition:0.5s"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:12px; color:gray">
                    <span>Valor: R$ ${total.toFixed(2)}</span>
                    <span onclick="remover(${a.id})" style="color:var(--red); cursor:pointer">Remover</span>
                </div>
            </div>`;
    });
    document.getElementById('home-total').innerText = `R$ ${tVal.toFixed(2)}`;
    document.getElementById('home-renda').innerText = `R$ ${tRen.toFixed(2)}`;
}

function remover(id) { if(confirm("Excluir?")) { ativos = ativos.filter(a => a.id !== id); save(); } }

render();