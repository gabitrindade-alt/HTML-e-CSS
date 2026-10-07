// Símbolos, nomes e pesos atômicos abreviados conforme a tabela da IUPAC.
const rawElements = `
H|Hidrogênio|1.008
He|Hélio|4.0026
Li|Lítio|6.94
Be|Berílio|9.0122
B|Boro|10.81
C|Carbono|12.011
N|Nitrogênio|14.007
O|Oxigênio|15.999
F|Flúor|18.998
Ne|Neônio|20.180
Na|Sódio|22.990
Mg|Magnésio|24.305
Al|Alumínio|26.982
Si|Silício|28.085
P|Fósforo|30.974
S|Enxofre|32.06
Cl|Cloro|35.45
Ar|Argônio|39.948
K|Potássio|39.098
Ca|Cálcio|40.078
Sc|Escândio|44.956
Ti|Titânio|47.867
V|Vanádio|50.942
Cr|Crômio|51.996
Mn|Manganês|54.938
Fe|Ferro|55.845
Co|Cobalto|58.933
Ni|Níquel|58.693
Cu|Cobre|63.546
Zn|Zinco|65.38
Ga|Gálio|69.723
Ge|Germânio|72.630
As|Arsênio|74.922
Se|Selênio|78.971
Br|Bromo|79.904
Kr|Criptônio|83.798
Rb|Rubídio|85.468
Sr|Estrôncio|87.62
Y|Ítrio|88.906
Zr|Zircônio|91.224
Nb|Nióbio|92.906
Mo|Molibdênio|95.95
Tc|Tecnécio|[98]
Ru|Rutênio|101.07
Rh|Ródio|102.91
Pd|Paládio|106.42
Ag|Prata|107.87
Cd|Cádmio|112.41
In|Índio|114.82
Sn|Estanho|118.71
Sb|Antimônio|121.76
Te|Telúrio|127.60
I|Iodo|126.90
Xe|Xenônio|131.29
Cs|Césio|132.91
Ba|Bário|137.33
La|Lantânio|138.91
Ce|Cério|140.12
Pr|Praseodímio|140.91
Nd|Neodímio|144.24
Pm|Promécio|[145]
Sm|Samário|150.36
Eu|Európio|151.96
Gd|Gadolínio|157.25
Tb|Térbio|158.93
Dy|Disprósio|162.50
Ho|Hólmio|164.93
Er|Érbio|167.26
Tm|Túlio|168.93
Yb|Itérbio|173.05
Lu|Lutécio|174.97
Hf|Háfnio|178.49
Ta|Tântalo|180.95
W|Tungstênio|183.84
Re|Rênio|186.21
Os|Ósmio|190.23
Ir|Irídio|192.22
Pt|Platina|195.08
Au|Ouro|196.97
Hg|Mercúrio|200.59
Tl|Tálio|204.38
Pb|Chumbo|207.2
Bi|Bismuto|208.98
Po|Polônio|[209]
At|Astato|[210]
Rn|Radônio|[222]
Fr|Frâncio|[223]
Ra|Rádio|[226]
Ac|Actínio|[227]
Th|Tório|232.04
Pa|Protactínio|231.04
U|Urânio|238.03
Np|Netúnio|[237]
Pu|Plutônio|[244]
Am|Amerício|[243]
Cm|Cúrio|[247]
Bk|Berquélio|[247]
Cf|Califórnio|[251]
Es|Einstênio|[252]
Fm|Férmio|[257]
Md|Mendelévio|[258]
No|Nobélio|[259]
Lr|Laurêncio|[266]
Rf|Rutherfórdio|[267]
Db|Dúbnio|[268]
Sg|Seabórgio|[269]
Bh|Bóhrio|[270]
Hs|Hássio|[269]
Mt|Meitnério|[278]
Ds|Darmstádtio|[281]
Rg|Roentgênio|[282]
Cn|Copernício|[285]
Nh|Nihônio|[286]
Fl|Fleróvio|[289]
Mc|Moscóvio|[290]
Lv|Livermório|[293]
Ts|Tenessino|[294]
Og|Oganessônio|[294]`;

const elementos = rawElements.trim().split('\n').map((line, index) => {
    const [simbolo, nome, massa] = line.trim().split('|');
    return { numero: index + 1, simbolo, nome, massa };
});

const groupRows = {
    1: [[1, 1], [18, 2]],
    2: [[1, 3], [2, 4], [13, 5], [14, 6], [15, 7], [16, 8], [17, 9], [18, 10]],
    3: [[1, 11], [2, 12], [13, 13], [14, 14], [15, 15], [16, 16], [17, 17], [18, 18]],
    4: Array.from({ length: 18 }, (_, i) => [i + 1, i + 19]),
    5: Array.from({ length: 18 }, (_, i) => [i + 1, i + 37]),
    6: [[1, 55], [2, 56], [3, 57], ...Array.from({ length: 15 }, (_, i) => [i + 4, i + 72])],
    7: [[1, 87], [2, 88], [3, 89], ...Array.from({ length: 15 }, (_, i) => [i + 4, i + 104])]
};
const positionByNumber = new Map();
Object.entries(groupRows).forEach(([periodo, cells]) => cells.forEach(([grupo, numero]) => positionByNumber.set(numero, { grupo, periodo: Number(periodo) })));

const families = [
    { id: 'alkali', label: 'Metal alcalino', numbers: [3, 11, 19, 37, 55, 87] },
    { id: 'alkaline', label: 'Metal alcalino-terroso', numbers: [4, 12, 20, 38, 56, 88] },
    { id: 'lanthanoid', label: 'Lantanídeo', numbers: Array.from({ length: 15 }, (_, i) => i + 57) },
    { id: 'actinoid', label: 'Actinídeo', numbers: Array.from({ length: 15 }, (_, i) => i + 89) },
    { id: 'transition', label: 'Metal de transição', numbers: [
        ...Array.from({ length: 10 }, (_, i) => i + 21),
        ...Array.from({ length: 10 }, (_, i) => i + 39),
        ...Array.from({ length: 9 }, (_, i) => i + 72),
        ...Array.from({ length: 9 }, (_, i) => i + 104)
    ] },
    { id: 'post-transition', label: 'Outro metal', numbers: [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116] },
    { id: 'metalloid', label: 'Semimetal', numbers: [5, 14, 32, 33, 51, 52] },
    { id: 'nonmetal', label: 'Não metal', numbers: [1, 6, 7, 8, 15, 16, 34] },
    { id: 'halogen', label: 'Halogênio', numbers: [9, 17, 35, 53, 85, 117] },
    { id: 'noble', label: 'Gás nobre', numbers: [2, 10, 18, 36, 54, 86, 118] },
    { id: 'unknown', label: 'Propriedades ainda pouco conhecidas', numbers: [113, 114, 115, 116] }
];
const familyByNumber = new Map();
families.forEach(family => family.numbers.forEach(number => {
    if (!familyByNumber.has(number) || family.id === 'unknown') familyByNumber.set(number, family);
}));

const table = document.getElementById('tabela-periodica');
const lanthanides = document.getElementById('lanthanides');
const actinides = document.getElementById('actinides');
const search = document.getElementById('element-search');
const categoryFilter = document.getElementById('category-filter');
const resultCount = document.getElementById('element-result-count');
const modal = document.getElementById('element-modal');
let lastFocusedElement = null;

function familyFor(element) {
    return familyByNumber.get(element.numero) || { id: 'unknown', label: 'Propriedades desconhecidas' };
}

function createElementCard(element, detached = false) {
    const family = familyFor(element);
    const position = positionByNumber.get(element.numero) || {};
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `element-cell family-${family.id}`;
    card.dataset.number = element.numero;
    card.dataset.symbol = element.simbolo.toLowerCase();
    card.dataset.name = element.nome.toLocaleLowerCase('pt-BR');
    card.dataset.family = family.id;
    card.setAttribute('aria-label', `${element.nome}, ${element.simbolo}, elemento ${element.numero}`);
    if (!detached && position.grupo) {
        card.style.gridColumn = position.grupo;
        card.style.gridRow = position.periodo;
    }
    card.innerHTML = `<span class="element-number">${element.numero}</span><strong>${element.simbolo}</strong><span class="element-name">${element.nome}</span>`;
    card.addEventListener('click', () => openElement(element, family, position));
    return card;
}

elementos.forEach(element => {
    if (element.numero >= 58 && element.numero <= 71) lanthanides.appendChild(createElementCard(element, true));
    else if (element.numero >= 90 && element.numero <= 103) actinides.appendChild(createElementCard(element, true));
    else table.appendChild(createElementCard(element));
});

function openElement(element, family, position) {
    lastFocusedElement = document.activeElement;
    document.getElementById('modal-numero').textContent = element.numero;
    document.getElementById('modal-simbolo').textContent = element.simbolo;
    document.getElementById('modal-nome').textContent = element.nome;
    document.getElementById('modal-massa').textContent = element.massa;
    document.getElementById('modal-grupo').textContent = position.grupo ? position.grupo : 'Série interna';
    document.getElementById('modal-periodo').textContent = position.periodo || '—';
    document.getElementById('modal-categoria').textContent = family.label;
    document.getElementById('modal-familia').textContent = family.label;
    document.getElementById('modal-curiosidade').textContent = `${element.simbolo} é o símbolo químico de ${element.nome}. ${family.label} no grupo ${position.grupo || 'interno'} da tabela periódica.`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('button[data-close-modal]').focus();
}

function closeElement() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement) lastFocusedElement.focus();
}

modal.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeElement));
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeElement();
});

function filterElements() {
    const query = search.value.trim().toLocaleLowerCase('pt-BR');
    const family = categoryFilter.value;
    let visible = 0;
    document.querySelectorAll('.element-cell').forEach(card => {
        const matchesText = !query || card.dataset.name.includes(query) || card.dataset.symbol.includes(query) || card.dataset.number === query;
        const matchesFamily = family === 'all' || card.dataset.family === family;
        const match = matchesText && matchesFamily;
        card.classList.toggle('is-muted', !match);
        if (match) visible++;
    });
    resultCount.textContent = `${visible} ${visible === 1 ? 'elemento' : 'elementos'}`;
}
search.addEventListener('input', filterElements);
categoryFilter.addEventListener('change', filterElements);
resultCount.textContent = `${elementos.length} elementos`;
