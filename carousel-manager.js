// Em carousel-manager.js

import { createSpellCardElement } from './card-renderer.js';

export async function initializeGrimoireCarousel(modalElement, characterId, dependencies) {
    const { getData, bufferToBlob, CARD_STORE_NAME, SPELL_STORE_NAME } = dependencies;

    const viewport = modalElement.querySelector('.grimoire-carousel-viewport');
    const carousel = modalElement.querySelector('.grimoire-carousel');
    const nav = modalElement.querySelector('.grimoire-carousel-nav');
    const prevBtn = modalElement.querySelector('#grimoirePrevBtn');
    const nextBtn = modalElement.querySelector('#grimoireNextBtn');
    const thumbnailNav = modalElement.querySelector('.grimoire-thumbnail-nav');

    // --- NOVA ADIÇÃO (1/3): Função para parar a propagação ---
    // Definida aqui para ser acessível na criação e na destruição dos listeners
    const stopThumbnailNavPropagation = (e) => e.stopPropagation();
    // --- FIM DA ADIÇÃO ---

    carousel.innerHTML = '<div class="no-spells-message">Carregando grimório...</div>';
    nav.style.display = 'none';

    const character = await getData(CARD_STORE_NAME, characterId);
    const spellIds = character.spells || [];

    if (spellIds.length === 0) {
        carousel.innerHTML = '<div class="no-spells-message">Este personagem não conhece magias ou habilidades.</div>';
        return { destroy: () => {} };
    }
    
    const spellPromises = spellIds.map(id => getData(SPELL_STORE_NAME, id));
    const originalSpellsData = (await Promise.all(spellPromises))
        .filter(Boolean)
        .filter(spell => spell.type === 'magia');

    if (originalSpellsData.length === 0) {
        carousel.innerHTML = '<div class="no-spells-message">Este personagem não conhece magias.</div>';
        return { destroy: () => {} };
    }

    carousel.innerHTML = '';
    nav.style.display = 'flex';
    
    const spellCardPromises = originalSpellsData.map(async (spellData) => {
        let imageURL = 'https://placehold.co/160x160/14b8a6/1f2937?text=Magia';
        if (spellData.image) {
            imageURL = URL.createObjectURL(bufferToBlob(spellData.image, spellData.imageMimeType));
        }
        const cardElement = await createSpellCardElement({ ...spellData, imageURL }, { isStatic: true });

        cardElement.style.transition = 'none';
        cardElement.style.opacity = 1;
        cardElement.style.transform = "scale(0.8)";

        const container3d = cardElement.querySelector('.card-3d-container');
        if (container3d) {
            container3d.style.height = '100%';
        }
        
        const item = document.createElement('div');
        item.className = 'grimoire-carousel-item';

         const rpgCard = cardElement.querySelector('.rpg-card');
        if (rpgCard) {
            rpgCard.classList.add('in-carousel'); // Adiciona a classe especial aqui
            rpgCard.style.height = '500px'; 
        }

        item.appendChild(cardElement);
        return item;
    });
    
    const originalItems = await Promise.all(spellCardPromises);
    
    thumbnailNav.innerHTML = '';
    originalSpellsData.forEach((spellData, index) => {
        const thumbItem = document.createElement('div');
        thumbItem.className = 'grimoire-thumbnail-item';
        thumbItem.dataset.index = index;
        let imageURL = 'https://placehold.co/160x160/14b8a6/1f2937?text=Magia';
        if (spellData.image) {
            imageURL = URL.createObjectURL(bufferToBlob(spellData.image, spellData.imageMimeType));
        }
        thumbItem.innerHTML = `<img src="${imageURL}" alt="${spellData.name}">`;
        thumbnailNav.appendChild(thumbItem);
    });

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

    function updateCarousel(withTransition = true)
    {
        if (items.length === 0) return;

        const itemWidth = getItemWidth();
        const viewportWidth = viewport.offsetWidth;
        const offset = (currentIndex * itemWidth) - (viewportWidth / 2) + (itemWidth / 2);

        carousel.style.transition = withTransition ? 'transform 0.5s cubic-bezier(0.77, 0, 0.175, 1)' : 'none';
        carousel.style.transform = `translateX(-${offset}px)`;

        items.forEach((item, index) => {
            item.classList.toggle('active', index === currentIndex);
        });
        const realIndex = (currentIndex - cloneCount + numeroDeItens) % numeroDeItens;
        const thumbnails = modalElement.querySelectorAll('.grimoire-thumbnail-item');

        thumbnails.forEach((thumb, index) => {
            if (index === realIndex) {
                thumb.classList.add('active');
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                thumb.classList.remove('active');
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
    
    thumbnailNav.addEventListener('click', (e) => {
        const thumbItem = e.target.closest('.grimoire-thumbnail-item');
        if (!thumbItem || isDragging) return;
        const clickedIndex = parseInt(thumbItem.dataset.index);
        if (!isNaN(clickedIndex)) {
            currentIndex = clickedIndex + cloneCount;
            updateCarousel();
            //startAutoRotate();
        }
    });

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
        if (itemWidth === 0) { //startAutoRotate();
         return; }
        const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(carousel).transform).m41;
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

    // --- NOVA ADIÇÃO (2/3): Ativa a "barreira" de eventos na barra de miniaturas ---
    thumbnailNav.addEventListener('mousedown', stopThumbnailNavPropagation);
    thumbnailNav.addEventListener('touchstart', stopThumbnailNavPropagation);
    thumbnailNav.addEventListener('wheel', stopThumbnailNavPropagation); // Importante para a roda do mouse
    // --- FIM DA ADIÇÃO ---

    updateCarousel(false);
    //startAutoRotate();

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
            
            // --- NOVA ADIÇÃO (3/3): Desativa a "barreira" de eventos ao fechar o modal ---
            thumbnailNav.removeEventListener('mousedown', stopThumbnailNavPropagation);
            thumbnailNav.removeEventListener('touchstart', stopThumbnailNavPropagation);
            thumbnailNav.removeEventListener('wheel', stopThumbnailNavPropagation);
            // --- FIM DA ADIÇÃO ---
        }
    };
}