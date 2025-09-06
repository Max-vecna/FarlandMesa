function getPredominantColorAndPalette(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0, img.width, img.height);

            try {
                const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
                let r = 0, g = 0, b = 0, count = 0;
                const step = 4 * 10;

                for (let i = 0; i < imageData.length; i += step) {
                    r += imageData[i]; g += imageData[i + 1]; b += imageData[i + 2];
                    count++;
                }
                const avgR = Math.floor(r / count), avgG = Math.floor(g / count), avgB = Math.floor(b / count);
                let [h, s, l] = rgbToHsl(avgR, avgG, avgB);
                const isLight = l > 0.5;
                resolve({
                    cardBg: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.5)',
                    highlightColor: hslToRgb(h, Math.min(s * 1.5, 1), isLight ? Math.max(l * 0.7, 0.3) : Math.min(l * 1.5, 0.7)),
                    textColor: isLight ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)',
                    borderColor: hslToRgb(h, s, isLight ? Math.max(l * 0.7, 0.3) : Math.min(l * 1.5, 0.7))
                });
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = (e) => reject(e);
        img.src = imageUrl;
    });
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) { h = s = 0; }
    else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function initializeNebulaEffect(container) {
    if (!container) return; // Segurança extra

    const starsFar = container.querySelector('#stars-far');
    const starsMedium = container.querySelector('#stars-medium');
    const starsNear = container.querySelector('#stars-near');
    const glow = container.querySelector('#glow-overlay');
    const txtItem = container.querySelector('#txtItem');


    // Garante que os elementos filhos foram encontrados antes de continuar
    if (!starsFar || !starsMedium || !starsNear || !glow) {
        console.error("Elementos do efeito de nebulosa não encontrados dentro do container.");
        return;
    }

    const maxRotate = 20;
    const factorFar = 0.02;
    const factorMedium = 0.04;
    const factorNear = 0.06;
    let isInteracting = false;

    const updateLayers = (x, y) => {
        const rotateY = (x / (container.offsetWidth / 2)) * maxRotate;
        const rotateX = -(y / (container.offsetHeight / 2)) * maxRotate;
        container.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        starsFar.style.transform = `translateZ(-40px) translate(${x * factorFar}px, ${y * factorFar}px)`;
        starsMedium.style.transform = `translateZ(-20px) translate(${x * factorMedium}px, ${y * factorMedium}px)`;
        if (txtItem) txtItem.style.transform = `translateZ(-20px) translate(${x * factorMedium}px, ${y * factorMedium}px)`;
        starsNear.style.transform = `translateZ(0px) translate(${x * factorNear}px, ${y * factorNear}px)`;

    };

    const startInteraction = (e) => {
    if (container.classList.contains('parallax-disabled')) return; // Adicione esta linha
    isInteracting = true;
    container.style.transition = 'transform 0.1s linear';
};

const moveInteraction = (e) => {
    if (container.classList.contains('parallax-disabled')) return; // Adicione esta linha
    if (!isInteracting) return;
    e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left - rect.width / 2;
        const y = clientY - rect.top - rect.height / 2;
        //glow.style.background = `radial-gradient(circle at ${clientX - rect.left}px ${clientY - rect.top}px, rgba(255,255,255,0.15), transparent 40%)`;
        updateLayers(x, y);
    };

    const endInteraction = () => {
        isInteracting = false;
        container.style.transition = 'transform 0.4s ease-out';
        container.style.transform = `rotateX(0deg) rotateY(0deg)`;
        starsFar.style.transform = `translateZ(-40px) translate(0px, 0px)`;
        starsMedium.style.transform = `translateZ(-20px) translate(0px, 0px)`;
        starsNear.style.transform = `translateZ(0px) translate(0px, 0px)`;
        if (txtItem) txtItem.style.transform = `translateZ(-20px) translate(0px, 0px)`;
    };

    // Adiciona os eventos
    container.addEventListener('mousedown', startInteraction);
    container.addEventListener('mousemove', moveInteraction);
    container.addEventListener('mouseup', endInteraction);
    container.addEventListener('mouseleave', endInteraction);
    container.addEventListener('touchstart', startInteraction);
    container.addEventListener('touchmove', moveInteraction);
    container.addEventListener('touchend', endInteraction);
    container.addEventListener('touchcancel', endInteraction);
}

// No arquivo: card-renderer.js

export async function createCardElement(cardData) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'card-wrapper flex flex-col items-center gap-4';
    const cardDiv = document.createElement('div');
    // Adicionado 'relative' para garantir que o modal absoluto se posicione corretamente
    cardDiv.className = 'w-full h-auto rounded-3xl shadow-2xl rpg-card relative'; 
    cardDiv.dataset.cardId = cardData.id;
    cardDiv.style.boxShadow = "inset 0 0 10px 1px black";
    cardDiv.style.backgroundImage = `url(${cardData.backgroundURL})`;
    let palette = {
        cardBg: 'rgba(31,41,55,0.9)',
        highlightColor: '#6366f1',
        textColor: '#e5e7eb',
        borderColor: '#4b5563'
    };
    if (cardData.backgroundURL && !cardData.backgroundURL.includes('placehold.co')) {
        try {
            palette = await getPredominantColorAndPalette(cardData.backgroundURL);
        } catch (e) {
            console.error('Falha ao gerar paleta.', e);
        }
    }
    let periciasHtml = '<p class="text-xs text-gray-400 italic">Nenhuma perícia selecionada.</p>';
    if (Array.isArray(cardData.attributes.pericias) && cardData.attributes.pericias.length > 0) {
        const groupedPericias = cardData.attributes.pericias.reduce((acc, pericia) => {
            const className = pericia.class || 'Outras';
            if (!acc[className]) acc[className] = [];
            acc[className].push(pericia);
            return acc;
        }, {});
        const sortedClasses = Object.keys(groupedPericias)
            .sort();
        periciasHtml = sortedClasses.map(className => {
            const periciasList = groupedPericias[className].map(p => `<span class="text-xs text-gray-400 italic">${p.name} +${p.value}; </span>`)
                .join('');
            return `<div class="text-left mt-1"><p class="text-xs text-gray-400 italic" style="font-size: 11px;">${className}</p><div class="flex flex-wrap gap-1 mb-1">${periciasList}</div></div>`;
        })
            .join('');
    }
    var imgIs = cardData.backgroundURL.includes('placehold.co');
    var imgIsPerson = cardData.imageURL != "" || cardData.imageURL != null
    const mainAttributes = ['agilidade', 'carisma', 'forca', 'inteligencia', 'sabedoria', 'vigor'];
    const attributeValues = mainAttributes.map(attr => parseInt(cardData.attributes[attr]) || 0);
    const maxAttributeValue = Math.max(...attributeValues, 1);
    const cdValue = 10 + (parseInt(cardData.level) || 0) + (parseInt(cardData.attributes.sabedoria) || 0);
    
    // --- INÍCIO DA ALTERAÇÃO ---
    // A estrutura do innerHTML foi reorganizada. O modal agora está no final.
    cardDiv.innerHTML = `
    <div class="card-3d-container">
        <div class="nebula-sky">
            <div class="parallax-container" style="opacity: ${!imgIs ? '0' : '1'}">
                <div id="nebula-bg" class="stars-layer"></div>
                <div id="stars-far" class="stars-layer"></div>
                <div id="stars-medium" class="stars-layer"></div>
                <div id="stars-near" class="stars-layer"></div>
            </div>
            <div id="glow-overlay"></div>
            <div class="card-3d">
                <div class="card-front" style="border-color: ${palette.borderColor}; background-image:${imgIsPerson ? `url(${cardData.imageURL})` : 'transparent'} !important; background-position: center; background-size: cover;">
                    <div class="rounded-3xl relative w-full h-full p-4 ex-max" style="height: 700px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; ">
                        
                    <div id="spell-sidebar" class="sidebar sidebar-left">
                            <div class="sidebar-content">
                                <div class="items-center justify-center gap-2 mb-4" style="margin-right: -40px; display: flex; flex-direction: column;">
                                    <h4 class="sidebar-title" style="margin: 0">Grimório</h4>
                                    <button class="manage-btn-sidebar" data-action="manage-spells" title="Gerenciar Grimório">
                                        <i class="fas fa-book-open" style="font-size: 20px;"></i>
                                    </button>
                                </div>
                                <div id="spell-sidebar-content" class="sidebar-list" style="margin-right: -40px; direction: rtl;"></div>
                            </div>
                            <button class="sidebar-toggle" style="background: rgb(20 184 166 / var(--tw-border-opacity, 1))">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <div id="item-sidebar" class="sidebar sidebar-right">
                            <button class="sidebar-toggle" style="background: rgb(245 158 11 / var(--tw-border-opacity, 1));">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <div class="sidebar-content">
                                <div class="items-center justify-center gap-2 mb-4" style="margin-left: -40px; display: flex; flex-direction: column;">
                                    <h4 class="sidebar-title" style="margin: 0">Inventário</h4>
                                    <button class="manage-btn-sidebar" data-action="manage-inventory" title="Gerenciar Inventário">
                                        <i class="fas fa-box" style="font-size: 20px;"></i>
                                    </button>
                                </div>
                                <div id="item-sidebar-content" class="sidebar-list" style="margin-left: -40px;"></div>
                            </div>
                        </div>
                        <div class="absolute top-4 left-2 rounded-full w-14 h-14 flex items-center justify-center font-bold"
                            data-action="open-status-modal" data-local="mana" title="Alterar Mana">
                            <div class="icon-container potion-container">
                                <svg class="potion-svg" viewBox="0 0 50 50">
                                    <defs>
                                        <clipPath id="potion-mask-${cardData.id}">
                                            <path d="M18,15 V5 h14 v10 a17,17 0 1,1 -14,0 z" />
                                        </clipPath>
                                    </defs>
                                    <g clip-path="url(#potion-mask-${cardData.id})">
                                        <rect class="potion-liquid" x="8" y="5" width="34" height="45" />
                                        <circle class="bubble" cx="20" cy="45" r="2.5" data-base-radius="2.5" />
                                        <circle class="bubble" cx="28" cy="42" r="2" data-base-radius="2" />
                                        <circle class="bubble" cx="33" cy="46" r="1.5" data-base-radius="1.5" />
                                    </g>
                                    <path class="potion-glass" d="M18,15 V5 h14 v10 a17,17 0 1,1 -14,0 z" />
                                    <rect class="potion-cork" x="18" y="0" width="14" height="5" rx="2" />
                                </svg>
                                <div class="status-text-container status-fraction text-lg" style="transform: scale(.5);">
                                    <span data-status="mana">${cardData.attributes.manaAtual || '?'}</span>
                                    <span class="fraction-line" style="width: 50%;"></span><span>${cardData.attributes.mana || '?'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="absolute top-2 right-2 rounded-full w-14 h-14 flex items-center justify-center font-bold" data-action="open-status-modal" data-local="life" title="Alterar Vida">
                            <div class="icon-container heart-container">
                                <svg class="heart-svg" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                <div class="status-text-container status-fraction text-lg" style="transform: scale(.5);">
                                    <span data-status="life">${cardData.attributes.vidaAtual || '?'}</span>
                                    <span class="fraction-line" style="width: 50%;"></span><span>${cardData.attributes.vida || '?'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="absolute top-20 left-4 rounded-full p-3 bg-black/50 flex items-center justify-center text-lg text-yellow-200 cursor-pointer" data-action="toggle-lore" title="Ver História">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="absolute top-20 right-4 rounded-full p-3 bg-black/50 flex items-center justify-center text-lg text-teal-200 cursor-pointer" data-action="open-grimoire-modal" title="Abrir Grimório" style="display: none">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <div class="absolute money-container top-36 left-4 rounded-full p-2 bg-black/50 flex items-center justify-center text-sm text-amber-300 font-bold" data-action="open-status-modal" data-local="money" title="Alterar Dinheiro" style=" writing-mode: vertical-rl; text-orientation: upright;">
                            💰$<span data-status="money">${cardData.dinheiro || 0}</span>
                        </div>
                        <div class="text-center" style="width: 60%;">
                            <h3 class="text-2xl font-bold">${cardData.title}</h3>
                            <div class="rpg-card-title-divider" style="background: linear-gradient(to right, transparent, #d1d5db, transparent); width: 100%"> </div>
                            <p class="text-sm italic">${cardData.subTitle}</p>
                            <p class="text-sm italic">${cardData.level}</p>
                        </div> 
                        
                        <div class="">
                            <div class="pb-4 scrollable-content text-sm text-left" style="display: flex; flex-direction: row; overflow-y: scroll;gap: 12px; scroll-snap-type: x mandatory;">
                                <div class="rounded-3xl w-full" style="scroll-snap-align: start;flex-shrink: 0;min-width: 100%; border-color: ${palette.borderColor}; position: relative; z-index: 1; overflow-y: visible; display: flex; flex-direction: column; justify-content: flex-end;">
                                    <div class="grid grid-cols-5 gap-x-4 gap-y-1 text-xs my-2 mb-4">
                                        <div class="text-center">CA<br>${cardData.attributes.armadura || 0}</div>
                                        <div class="text-center">ES<br>${cardData.attributes.esquiva || 0}</div>
                                        <div class="text-center">BL<br>${cardData.attributes.bloqueio || 0}</div>
                                        <div class="text-center">DL<br>${cardData.attributes.deslocamento || 0}m</div>
                                        <div class="text-center font-bold text-indigo-300">CD<br>${cdValue}</div>
                                    </div>
                                    ${mainAttributes.map(key => {
                                    const value = parseInt(cardData.attributes[key]) || 0; const percentage = maxAttributeValue > 0 ? (value * 100) / maxAttributeValue : 0;
                                    return `
                                    <div class="mt-2 flex items-center space-x-2 text-xs">
                                        <span class="font-bold w-8">${key.slice(0, 3).toUpperCase()}</span>
                                        <div class="stat-bar flex-grow" style="margin-top: 0">
                                            <div class="stat-fill" style="width: ${percentage}%; background: ${palette.borderColor}"></div>
                                        </div>
                                        <span class="text-xs font-bold ml-auto">${value} / ${maxAttributeValue}</span>
                                    </div>
                                    `;
                                    }).join('')}
                                </div>                                                
                                <div class="pb-4 rounded-3xl w-full" style="scroll-snap-align: start;flex-shrink: 0;min-width: 100%; border-color: ${palette.borderColor}; position: relative; z-index: 1; overflow-y: visible; display: flex; flex-direction: column; justify-content: flex-end;">
                                    <div class="pericias-scroll-area flex flex-col gap-2" style="overflow-y: auto; max-height: 170px;">
                                        ${periciasHtml}
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div class="lore-card" data-action="toggle-lore">
                            <h4 style="color: ${palette.highlightColor}; border-color: ${palette.borderColor};">História</h4>
                            <p style="text-align:justify;white-space:pre-line;overflow-wrap:break-word;">
                                ${cardData.lore?.historia || 'Nenhuma história definida.'}</p>
                            <h4 class="mt-4" style="color: ${palette.highlightColor}; border-color: ${palette.borderColor};">Personalidade</h4>
                            <p style="text-align:justify;white-space:pre-line;overflow-wrap:break-word;"> ${cardData.lore?.personalidade || 'Nenhuma personalidade definida.'}</p>
                            <h4 class="mt-4" style="color: ${palette.highlightColor}; border-color: ${palette.borderColor};">Motivação</h4>
                            <p style="text-align:justify;white-space:pre-line;overflow-wrap:break-word;">${cardData.lore?.motivacao || 'Nenhuma motivação definida.'}</p>
                        </div>
                    </div>
                </div>
                <div class="card-back divPartculas" style="background-image:${!imgIs ? `url(${cardData.backgroundURL})` : 'transparent'} !important; background-size: cover !important; background-color: rgb(0 0 0 / 50%);background-blend-mode: multiply; background-position: center;">
                    <div class="back-content p-4 text-left" style="display: flex; border: 5px solid rgb(120, 129, 93); align-items: center; justify-content: center;">
                        <i class="fas fa-shield-alt" style="font-size: 200px; opacity: .2;"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="grimoire-modal">
        <div class="grimoire-modal-content">
            <button class="grimoire-modal-close-btn" data-action="close-grimoire-modal">&times;</button>
            <h3 class="text-2xl font-bold text-teal-300 text-center" style="position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%); z-index: 10;">Grimório</h3>
            <div class="grimoire-carousel-wrapper">
                <div class="grimoire-carousel-viewport">
                    <div class="grimoire-carousel"></div>
                </div>
                <div class="grimoire-thumbnail-nav"></div>
               <div class="grimoire-carousel-nav" style="display: none !important;">
                    <button class="grimoire-nav-button" id="grimoirePrevBtn">Anterior</button>
                    <button class="grimoire-nav-button" id="grimoireNextBtn">Próximo</button>
                </div>
            </div>
        </div>
    </div>
    `;
    // --- FIM DA ALTERAÇÃO ---

    cardWrapper.appendChild(cardDiv);    

    const spellSidebar = cardDiv.querySelector('#spell-sidebar');
    const itemSidebar = cardDiv.querySelector('#item-sidebar');
    if (spellSidebar) {
        spellSidebar.querySelector('.sidebar-toggle')
            .addEventListener('click', (e) => {
                e.stopPropagation();
                spellSidebar.classList.toggle('expanded');
            });
    }

    if (itemSidebar) {
        itemSidebar.querySelector('.sidebar-toggle')
            .addEventListener('click', (e) => {
                e.stopPropagation();
                itemSidebar.classList.toggle('expanded');
            });
    }   

    const scrollableAreas = [
        '#spell-sidebar-content',
        '#item-sidebar-content',
        '.pericias-scroll-area',
        '.lore-card'
    ];

    scrollableAreas.forEach(selector => {
        const element = cardDiv.querySelector(selector);
        if (element) {
            ['mousedown', 'touchstart'].forEach(eventType => {
                element.addEventListener(eventType, (e) => {
                    e.stopPropagation();
                });
            });
        }
    });

    return cardWrapper;
}


export async function createSpellCardElement(spellData) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'card-wrapper flex flex-col items-center gap-4';
    const cardDiv = document.createElement('div');
    cardDiv.className = 'w-full h-[700px] rounded-3xl shadow-2xl rpg-card relative';
    cardDiv.dataset.spellId = spellData.id;

    // Condição para verificar se é uma magia
    const isMagia = spellData.type === 'magia';

    let palette = {
        cardBg: isMagia ? 'rgba(17, 24, 39, 0.9)' : 'rgba(29, 17, 39, 0.9)',
        highlightColor: isMagia ? '#2dd4bf' : '#c084fc',
        textColor: '#e5e7eb',
        borderColor: isMagia ? '#0d9488' : '#a855f7'
    };

    var imgam = "";

    if (spellData.imageURL && !spellData.imageURL.includes('placehold.co')) {
        try {
            const newPalette = await getPredominantColorAndPalette(spellData.imageURL);
            palette.borderColor = newPalette.borderColor;
            palette.highlightColor = newPalette.highlightColor;
        } catch (e) {
            console.error('Falha ao gerar paleta para magia/habilidade.', e);
        }
    }
    var imgIs = spellData.imageURL.includes('placehold.co');

    cardDiv.style.backgroundImage = !imgIs ? `url(${spellData.imageURL})` : 'url(backMagia.png)';
    cardDiv.style.backgroundColor = "rgb(0 0 0 / 50%)";
    cardDiv.style.backgroundBlendMode = "multiply";
    cardDiv.style.backgroundPosition = "center";

    cardDiv.style.border = `2px solid ${palette.borderColor}`;
    cardDiv.innerHTML = `
                    <div class="card-3d-container">
                        <div class="nebula-sky">                          
                            <div class="card-3d">
                                <div class="card-front" style="background-image:${!imgIs ? `url(${spellData.imageURL})` : 'url(backMagia.png)'}; background-size: cover; background-position: center;">
                                    <div class="parallax-container"  style="opacity: ${!imgIs ? '0' : '1'}">
                                        <div id="nebula-bg" class="stars-layer"   style="background: url(backMagia.png); background-size: contain; background-position: center;"></div>
                                        <div id="stars-far" class="stars-layer"></div>
                                        <div id="stars-medium" class="stars-layer"></div>
                                        <div id="stars-near" class="stars-layer"></div>
                                    </div>
                                    <div id="glow-overlay"></div>
                                    <div class="rounded-3xl relative w-full h-full p-4" style="background: linear-gradient(-180deg, #000000ba, #00000085,transparent, #00000085, #000000ba); display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
                                        <div class="w-full">
                                            <div class="text-center w-full">
                                                <h3 class="text-2xl font-bold" style="color: ${palette.highlightColor};">${spellData.name}</h3>
                                                <div class="rpg-card-title-divider" style="background: linear-gradient(to right, transparent, ${palette.borderColor}, transparent); width: 100%"></div>
                                            </div>                                            
                                            ${isMagia ? `
                                            <div class="text-xs text-gray-300 mb-3">
                                                <p class="text-left"><strong>Execução:</strong> ${spellData.execution || '-'}</p>
                                                <p class="text-left"><strong>Alcance:</strong> ${spellData.range || '-'}</p>
                                                <p class="text-left"><strong>Alvo:</strong> ${spellData.target || '-'}</p>
                                                <p class="text-left"><strong>Duração:</strong> ${spellData.duration || '-'}</p>
                                                <p class="text-left"><strong>Resistência:</strong> ${spellData.resistencia || '-'}</p>
                                            </div>` : ''}
                                        </div>
                                        
                                        <div class="w-full">
                                            <div class="scrollable-content text-sm text-left" style="display: flex; flex-direction: row; overflow-y: scroll;gap: 12px; scroll-snap-type: x mandatory;">
                                                <div class="mb-4 rounded-3xl w-full" style="scroll-snap-align: start;flex-shrink: 0;min-width: 100%; border-color: ${palette.borderColor}; position: relative; z-index: 1; overflow-y: visible; display: flex; flex-direction: column; justify-content: flex-end;">
                                                    <h4 class="font-semibold text-gray-300">Descrição</h4>
                                                    <p class="text-gray-300 text-xs" style="text-align:justify;white-space:pre-line;overflow-wrap:break-word;">${spellData.description || 'Nenhuma descrição.'}</p>
                                                </div>                                                
                                                ${isMagia ? `
                                                <div class="mb-4 rounded-3xl w-full" style="scroll-snap-align: start;flex-shrink: 0;min-width: 100%; border-color: ${palette.borderColor}; position: relative; z-index: 1; overflow-y: visible; display: flex; flex-direction: column; justify-content: flex-end;">
                                                    <h4 class="font-semibold text-gray-300">Aprimorar</h4>
                                                    <p class="text-gray-300 text-xs" style="text-align:justify;white-space:pre-line;overflow-wrap:break-word;">${spellData.enhance || 'Nenhuma descrição.'}</p>
                                                </div>
                                                <div class="mb-4 rounded-3xl w-full" style="scroll-snap-align: start;flex-shrink: 0;flex-shrink: 0;min-width: 100%; border-color: ${palette.borderColor}; position: relative; z-index: 1; overflow-y: visible; display: flex; flex-direction: column; justify-content: flex-end;">
                                                    <h4 class="font-semibold text-gray-300">Verdadeiro</h4>
                                                    <p class="text-gray-300 text-xs" style="text-align:justify;white-space:pre-line;overflow-wrap:break-word;">${spellData.true || 'Nenhuma descrição.'}</p>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-back" style="background-image:${!imgIs ? `url(${spellData.imageURL})` : 'url(backMagia.png)'}; background-size: cover; background-color: rgb(0 0 0 / 50%);background-blend-mode: multiply; background-position: center;">
                                    <div class="back-content p-4 text-left" style="display: flex; border: 5px solid rgb(120, 129, 93); align-items: center; justify-content: center;">
                                    ${isMagia ? `<i class="fas fa-hat-wizard" style="font-size: 200px; opacity: .2;"></i>` : `<i class="fas fa-fist-raised" style="font-size: 200px; opacity: .2;"></i>`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
    const card3d = cardDiv.querySelector('.card-3d');

    if (card3d) {
        card3d.addEventListener('click', (e) => {
            card3d.style.transform =
                card3d.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
        });
    }
    cardWrapper.appendChild(cardDiv);

    // --- INÍCIO DA SOLUÇÃO ---
    // Adicione este trecho para impedir que o parallax seja ativado na área de rolagem.
    const scrollableContent = cardDiv.querySelector('.scrollable-content');
    if (scrollableContent) {
        // Para eventos de mouse (clicar e arrastar)
        scrollableContent.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        // Para eventos de toque em dispositivos móveis
        scrollableContent.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });
    }
    // --- FIM DA SOLUÇÃO ---
    // --- ADICIONE ESTAS LINHAS NO FINAL DA FUNÇÃO ---
    const nebulaContainer = cardDiv.querySelector('.nebula-sky');
    if (nebulaContainer) {
        initializeNebulaEffect(nebulaContainer);
    }
    return cardWrapper;
}

export async function createItemCardElement(itemData) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'card-wrapper flex flex-col items-center gap-4';
    const cardDiv = document.createElement('div');
    cardDiv.className = 'w-full h-[700px] rounded-3xl shadow-2xl rpg-card relative';
    cardDiv.dataset.itemId = itemData.id;
    let palette = {
        cardBg: 'rgba(17, 24, 39, 0.9)',
        highlightColor: '#f59e0b',
        textColor: '#e5e7eb',
        borderColor: '#d97706'
    };
    if (itemData.imageURL && !itemData.imageURL.includes('placehold.co')) {
        try {
            palette = await getPredominantColorAndPalette(itemData.imageURL);
        } catch (e) {
            console.error('Falha ao gerar paleta para item.', e);
        }
    }

    var imgIs = itemData.imageURL.includes('placehold.co');
    cardDiv.style.backgroundImage = !imgIs ? `url(${itemData.imageURL})` : 'url(backItens.png)';
    cardDiv.style.backgroundColor = "rgb(0 0 0 / 50%)";
    cardDiv.style.backgroundBlendMode = "multiply";
    cardDiv.style.backgroundPosition = "center";

    cardDiv.style.border = `2px solid ${palette.borderColor}`;
    cardDiv.innerHTML = `
                <div class="card-3d-container">
                    <div class="nebula-sky">                       
                        <div class="card-3d">
                            <div class="card-front" style="background-image:${!imgIs ? `url(${itemData.imageURL})` : 'url(backItens.png)'}; background-size: cover; background-position: center;">
                                 <div class="parallax-container" style="opacity: ${!imgIs ? '0' : '1'}">
                            <div id="nebula-bg" class="stars-layer" style="background: url(backItens.png); background-size: contain; background-position: center;"></div>
                            <div id="stars-far" class="stars-layer"></div>
                            <div id="stars-medium" class="stars-layer"></div>
                            <div id="stars-near" class="stars-layer"></div>
                            <div id="milky-way"></div>
                        </div>
                        <div id="glow-overlay"></div>
                                <div  id="txtItem" class="rounded-3xl 
                                relative w-full h-full p-4" style="background: linear-gradient(-180deg, #000000ba, #00000085, transparent, #00000085, #000000ba); display: flex; flex-direction: column; align-items: center; justify-content: space-between;">
                                <div class="text-center w-full">
                                    <h3 class="text-2xl font-bold" style="color: ${palette.highlightColor};">${itemData.name}</h3>
                                    <div class="rpg-card-title-divider" style="background: linear-gradient(to right, transparent, ${palette.borderColor}, transparent); width: 100%"></div>
                                </div>
                                <div class="text-xs text-gray-300 mb-3 w-full px-2"  style="position: absolute; margin-top: 55px; text-align:justify;
                                    left: 15px;">
                                    <p><strong>Tipo:</strong> ${itemData.type || '-'}</p>
                                    <p><strong>Dano:</strong> ${itemData.damage || '-'}</p>
                                    <p><strong>Carga:</strong> ${itemData.charge}</p>
                                    <p><strong>Pré-requisito:</strong> ${itemData.prerequisite || '-'}</p>
                                    <p><strong>Restaurar Vida:</strong> ${itemData.restoreLife || 0} PV</p>
                                    <p><strong>Restaurar Mana:</strong> ${itemData.restoreMana || 0} PM</p>
                                    <p><strong>Usável:</strong> ${itemData.usable ? 'Sim' : 'Não'}</p>
                                </div>
                                <div class="w-full p-2" style="text-align:justify;">
                                    <p class="text-xs text-gray-300 italic">Efeito</p>
                                    <p class="text-xs text-gray-300 italic" style="text-align:justify;white-space:pre-line;overflow-wrap:break-word;">${itemData.effect || 'Nenhum efeito.'}</p>
                                </div>
                                </div>
                            </div>
                            <div class="card-back" style="background-image:${!imgIs ? `url(${itemData.imageURL})` : 'url(backItens.png)'}; background-size: cover; background-color: rgb(0 0 0 / 50%);background-blend-mode: multiply;background-position: center;">
                                <div class="back-content p-4 text-left" style="display: flex; border: 5px solid rgb(120, 129, 93); align-items: center; justify-content: center;">
                                <i class="fas fa-box" style="font-size: 200px; opacity: .2;"></i>  
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
    const card3d = cardDiv.querySelector('.card-3d');
    if (card3d) {
        card3d.addEventListener('click', (e) => {
            card3d.style.transform = card3d.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
        });
    }
    cardWrapper.appendChild(cardDiv);

    // --- INÍCIO DA SOLUÇÃO ---
    // Adicione este trecho para impedir que o parallax seja ativado na área de rolagem.
    const scrollableContent = cardDiv.querySelector('.scrollable-content');
    if (scrollableContent) {
        // Para eventos de mouse (clicar e arrastar)
        scrollableContent.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        // Para eventos de toque em dispositivos móveis
        scrollableContent.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        });
    }
    // --- FIM DA SOLUÇÃO ---
    // --- ADICIONE ESTAS LINHAS NO FINAL DA FUNÇÃO ---
    const nebulaContainer = cardDiv.querySelector('.nebula-sky');
    if (nebulaContainer) {
        initializeNebulaEffect(nebulaContainer);
    }

    return cardWrapper;
}



