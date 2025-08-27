// carousel-manager.js
import { createSpellCardElement } from './card-renderer.js';

export async function initializeGrimoireCarousel(modalElement, characterId, dependencies) {
    // Desestruturamos as dependências para usar as funções facilmente
    const { getData, bufferToBlob, CARD_STORE_NAME, SPELL_STORE_NAME } = dependencies;

    const viewport = modalElement.querySelector('.grimoire-carousel-viewport');
    const carousel = modalElement.querySelector('.grimoire-carousel');
    const nav = modalElement.querySelector('.grimoire-carousel-nav');
    const prevBtn = modalElement.querySelector('#grimoirePrevBtn');
    const nextBtn = modalElement.querySelector('#grimoireNextBtn');

    carousel.innerHTML = '<div class="no-spells-message">Carregando grimório...</div>';
    nav.style.display = 'none';

    // 1. Buscar os dados das magias/habilidades
    const character = await getData(CARD_STORE_NAME, characterId);
    const spellIds = character.spells || [];

    if (spellIds.length === 0) {
        carousel.innerHTML = '<div class="no-spells-message">Este personagem não conhece magias ou habilidades.</div>';
        return { destroy: () => {} }; // Retorna uma função de destruição vazia
    }
    
    const spellPromises = spellIds.map(id => getData(SPELL_STORE_NAME, id));
    const originalSpellsData = (await Promise.all(spellPromises)).filter(Boolean).filter(spell => spell.type === 'magia');

    if (originalSpellsData.length === 0) {
        carousel.innerHTML = '<div class="no-spells-message">Magias não encontradas na biblioteca.</div>';
        return { destroy: () => {} };
    }

    // 2. Criar os elementos do carrossel (os cards)
    carousel.innerHTML = '';
    nav.style.display = 'flex';
    
    const spellCardPromises = originalSpellsData.map(async (spellData) => {
        let imageURL = 'https://placehold.co/160x160/14b8a6/1f2937?text=Magia';
        if (spellData.image) {
            imageURL = URL.createObjectURL(bufferToBlob(spellData.image, spellData.imageMimeType));
        }
        const cardElement = await createSpellCardElement({ ...spellData, imageURL });
         cardElement.style.transition = 'none'; // Impede a animação de acontecer
    cardElement.style.opacity = 1;  
        const container3d = cardElement.querySelector('.card-3d-container');
        if (container3d) {
            container3d.style.height = '100%';
        }

        const item = document.createElement('div');
        item.className = 'grimoire-carousel-item';
        // Reduz a altura do card para caber melhor no modal
        cardElement.querySelector('.rpg-card').style.height = '500px'; 
        item.appendChild(cardElement);
        return item;
    });
    
    const originalItems = await Promise.all(spellCardPromises);

    // 3. Lógica do Carrossel (adaptada de dd.html)
    const numeroDeItens = originalItems.length;
    const cloneCount = Math.min(3, numeroDeItens);

    const clonesStart = numeroDeItens > 1 ? originalItems.slice(-cloneCount).map(item => item.cloneNode(true)) : [];
    const clonesEnd = numeroDeItens > 1 ? originalItems.slice(0, cloneCount).map(item => item.cloneNode(true)) : [];
    
    const allItems = [...clonesStart, ...originalItems, ...clonesEnd];
    allItems.forEach(item => carousel.appendChild(item));

    const items = modalElement.querySelectorAll('.grimoire-carousel-item');
    let currentIndex = cloneCount;
    let autoRotateInterval;
    let isDragging = false;
    let startX, startTranslate;

    function getItemWidth() {
        return items[0] ? items[0].offsetWidth : 0;
    }

    function updateCarousel(withTransition = true) {
        if (items.length === 0) return;
        const itemWidth = getItemWidth();
        const viewportWidth = viewport.offsetWidth;
        const offset = (currentIndex * itemWidth) - (viewportWidth / 2) + (itemWidth / 2);
        
        carousel.style.transition = withTransition ? 'transform 0.5s cubic-bezier(0.77, 0, 0.175, 1)' : 'none';
        carousel.style.transform = `translateX(-${offset}px)`;

        items.forEach((item, index) => {
            if (index === currentIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    function handleTransitionEnd() {
        if (currentIndex >= numeroDeItens + cloneCount) {
            currentIndex = cloneCount;
            updateCarousel(false);
        } else if (currentIndex < cloneCount) {
            currentIndex = numeroDeItens + cloneCount - 1;
            updateCarousel(false);
        }
    }

    carousel.addEventListener('transitionend', handleTransitionEnd);

    function startAutoRotate() {
        stopAutoRotate();
        autoRotateInterval = setInterval(() => {
            currentIndex++;
            updateCarousel();
        }, 4000);
    }

    function stopAutoRotate() {
        clearInterval(autoRotateInterval);
    }
    
    function handleNext() {
        if (isDragging) return;
        currentIndex++;
        updateCarousel();
        //startAutoRotate();
    }
    
    function handlePrev() {
        if (isDragging) return;
        currentIndex--;
        updateCarousel();
        //startAutoRotate();
    }

    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrev);
    
    function handleDragStart(e) {
        e.stopPropagation();

        isDragging = true;
        startX = e.clientX || e.touches[0].clientX;
        const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(carousel).transform).m41;
        startTranslate = currentTransform;
        stopAutoRotate();
        carousel.style.transition = 'none';
        viewport.classList.add('dragging');
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const currentX = e.clientX || e.touches[0].clientX;
        const deltaX = currentX - startX;
        const newTranslate = startTranslate + deltaX;
        carousel.style.transform = `translateX(${newTranslate}px)`;
    }

    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        viewport.classList.remove('dragging');

        const itemWidth = getItemWidth();
        //if (itemWidth === 0) { startAutoRotate(); return; }

        const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(carousel).transform).m41;
        const centerOffset = (viewport.offsetWidth / 2) - (itemWidth / 2);
        const totalMoved = startTranslate - currentTransform;
        const itemsMoved = Math.round(totalMoved / itemWidth);

        currentIndex += itemsMoved;
        
        updateCarousel();
        //startAutoRotate();
    }

    viewport.addEventListener('mousedown', handleDragStart);
    viewport.addEventListener('touchstart', handleDragStart);

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove, { passive: false });

    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
    
    function handleResize() { updateCarousel(false); }
    window.addEventListener('resize', handleResize);

    updateCarousel(false);
    //startAutoRotate();

    // 4. Retornar uma função de "destruição" para limpar tudo
    return {
        destroy: () => {
            stopAutoRotate();
            carousel.removeEventListener('transitionend', handleTransitionEnd);
            nextBtn.removeEventListener('click', handleNext);
            prevBtn.removeEventListener('click', handlePrev);
            viewport.removeEventListener('mousedown', handleDragStart);
            viewport.removeEventListener('touchstart', handleDragStart);
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchend', handleDragEnd);
            window.removeEventListener('resize', handleResize);
        }
    };
}