<?php
$titulo_pagina = 'Tabela periódica';
$css_extra = 'tabela-periodica.css';
$script_extra = 'tabela-periodica.js';
require_once '../includes/header.php';
?>

<section class="periodic-page">
    <div class="periodic-page-heading">
        <div>
            <span class="periodic-kicker">ELEMENTOS, PROPRIEDADES E CONEXÕES</span>
            <h1>Explore a tabela periódica</h1>
            <p>Pesquise um elemento ou selecione uma família. Toque em qualquer cartão para conhecer seus detalhes.</p>
        </div>
        <div class="element-count"><strong>118</strong><span>elementos<br>químicos</span></div>
    </div>

    <div class="periodic-controls">
        <label class="element-search"><span aria-hidden="true">⌕</span><input id="element-search" type="search" placeholder="Buscar por nome ou símbolo…" autocomplete="off" aria-label="Buscar elemento por nome ou símbolo"></label>
        <label class="family-filter"><span>Família</span><select id="category-filter" aria-label="Filtrar por família"><option value="all">Todas as famílias</option><option value="alkali">Metais alcalinos</option><option value="alkaline">Metais alcalino-terrosos</option><option value="transition">Metais de transição</option><option value="post-transition">Outros metais</option><option value="metalloid">Semimetais</option><option value="nonmetal">Não metais</option><option value="halogen">Halogênios</option><option value="noble">Gases nobres</option><option value="lanthanoid">Lantanídeos</option><option value="actinoid">Actinídeos</option><option value="unknown">Propriedades desconhecidas</option></select></label>
        <span id="element-result-count" class="result-count">118 elementos</span>
    </div>

    <div class="periodic-legend" aria-label="Legenda das famílias">
        <span><i class="legend-dot alkali"></i>Alcalinos</span><span><i class="legend-dot alkaline"></i>Alcalino-terrosos</span><span><i class="legend-dot transition"></i>Transição</span><span><i class="legend-dot post-transition"></i>Outros metais</span><span><i class="legend-dot metalloid"></i>Semimetais</span><span><i class="legend-dot nonmetal"></i>Não metais</span><span><i class="legend-dot halogen"></i>Halogênios</span><span><i class="legend-dot noble"></i>Gases nobres</span><span><i class="legend-dot lanthanoid"></i>Lantanídeos</span><span><i class="legend-dot actinoid"></i>Actinídeos</span>
    </div>

    <div class="periodic-scroll-hint">Em telas pequenas, deslize a tabela para os lados <span>↔</span></div>
    <div class="periodic-table-shell">
        <div class="periodic-table" id="tabela-periodica" aria-label="Tabela com os 118 elementos químicos"></div>
    </div>

    <div class="series-heading"><span>57—71</span><strong>Série dos lantanídeos</strong><small>Metais de terras raras</small></div>
    <div class="series-table" id="lanthanides"></div>
    <div class="series-heading"><span>89—103</span><strong>Série dos actinídeos</strong><small>Muitos são radioativos</small></div>
    <div class="series-table" id="actinides"></div>
</section>

<div class="element-modal" id="element-modal" aria-hidden="true">
    <div class="element-modal-backdrop" data-close-modal></div>
    <section class="element-modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-nome">
        <button class="element-modal-x" type="button" data-close-modal aria-label="Fechar detalhes">×</button>
        <div class="element-modal-top"><span id="modal-numero">1</span><span id="modal-categoria">Não metal</span></div>
        <div class="modal-simbolo" id="modal-simbolo">H</div>
        <h2 id="modal-nome">Hidrogênio</h2>
        <p class="element-modal-subtitle" id="modal-familia">Não metal</p>
        <div class="element-details"><div><span>Massa atômica</span><strong id="modal-massa">1.008</strong></div><div><span>Grupo</span><strong id="modal-grupo">1</strong></div><div><span>Período</span><strong id="modal-periodo">1</strong></div></div>
        <p class="element-modal-note" id="modal-curiosidade"></p>
        <button class="btn btn-primary element-modal-close" type="button" data-close-modal>Voltar à tabela</button>
    </section>
</div>

<?php require_once '../includes/footer.php'; ?>
