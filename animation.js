        const ALL_CLASSES = ['star-container', 'arcane-recharge', 'zoom-box', 'heal-container', 'coin-container', 'spill-container', 'energize-effect', 'glowing-card', 'glow-purple', 'glow-red', 'glow-yellow', 'glow-green', 'glow-gold', 'glow-potion', 'glow-cyan', 'animate', 'glow-dark'];

        function resetcard3d(animationBox) {
            // Remove todas as classes de animação
            animationBox.classList.remove(...ALL_CLASSES);
            // Remove todas as partículas geradas, preservando o conteúdo original
            animationBox.querySelectorAll('.rune-container, .aura-particle, .coin, .potion-pulse, .potion-svg-container, .energize-particle').forEach(el => el.remove());
            
            const existingOverlayDamage = animationBox.querySelector('.damage-overlay');
            if (existingOverlayDamage) {
                existingOverlayDamage.remove();
            }

            const existingOverlayHeal = animationBox.querySelector('.heal-overlay');
            if (existingOverlayHeal) {
                existingOverlayHeal.remove();
            }
            
            const existingOverlayRune = animationBox.querySelector('.rune-container');
            if (existingOverlayRune) {
                existingOverlayRune.remove();
            }
        }

        function triggerAnimation(element, animationClass) {
            
            element.classList.remove(animationClass);
            void element.offsetWidth; 
            element.classList.add(animationClass);
        }
              

         function createHealParticles(numberOfParticles, animationBox) {
            for (let i = 0; i < numberOfParticles; i++) {
                const particle = document.createElement('span');
                particle.className = 'heal-particle';
                const angle = Math.random() * 360;
                const radius = Math.random() * 150 + 50; // Raio da explosão
                const endX = Math.cos(angle * (Math.PI / 180)) * radius;
                const endY = Math.sin(angle * (Math.PI / 180)) * radius; // Faz ir para todas as direções
                particle.style.setProperty('--heal-end-transform', `translate(${endX}px, ${endY}px) scale(1)`);
                animationBox.appendChild(particle);
            }
        }

        function createCoins(numberOfCoins) {
            for (let i = 0; i < numberOfCoins; i++) {
                const coin = document.createElement('span');
                coin.className = 'coin';
                const size = Math.random() * 15 + 20;
                const duration = Math.random() * 0.8 + 1.2;
                const delay = Math.random() * 1.5;
                coin.style.width = `${size}px`;
                coin.style.height = `${size}px`;
                coin.style.left = `${Math.random() * 85 + 5}%`;
                coin.style.animationDuration = `${duration}s`;
                coin.style.animationDelay = `${delay}s`;
                animationBox.appendChild(coin);
            }
        }

        function createDamageOverlay(animationBox) {
            // Cria a div de dano e a adiciona na caixa de animação
            const overlay = document.createElement('div');
            overlay.className = 'damage-overlay';
            animationBox.appendChild(overlay);
        }
       
        function createHealOverlay(animationBox) {
            const overlay = document.createElement('div');
            overlay.className = 'heal-overlay';
            animationBox.appendChild(overlay);
        }



           function createRuneEffect(animationBox)
           {
            const svgNS = "http://www.w3.org/2000/svg";
            const container = document.createElement('div');
            container.className = 'rune-container';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.setAttribute('viewBox', '0 0 250 250');
            svg.innerHTML = `
                <defs>
                    <path id="textPath" d="M 125, 125 m -105, 0 a 105,105 0 1,1 210,0 a 105,105 0 1,1 -210,0"></path>
                </defs>
                <g class="rotatable-group" transform-origin="center" style="transform-box: fill-box;">
                    <g class="magic-words" font-size="6.5" fill="#a78bfa">
                        <text>
                            <textPath href="#textPath" textLength="660" lengthAdjust="spacingAndGlyphs">
                                IGNIS ✧ AQUA ✧ TERRA ✧ AER ✧ ORDO ✧ CHAOS ✧ LUX ✧ NOX ✧ SOL ✧ LUNA ✧ SPIRITUS ✧ MATERIA ✧ VITA ✧ MORS ✧ SCIENTIA ✧ CREATIO ✧
                            </textPath>
                        </text>
                    </g>
                    <g stroke="#a78bfa" stroke-width="2" fill="none">
                        <circle cx="125" cy="125" r="95" />
                        <circle cx="125" cy="125" r="85" />
                        <circle cx="125" cy="125" r="42.5" />
                        <circle cx="125" cy="82.5" r="42.5" />
                        <circle cx="125" cy="167.5" r="42.5" />
                        <circle cx="88.3" cy="103.75" r="42.5" />
                        <circle cx="161.7" cy="103.75" r="42.5" />
                        <circle cx="88.3" cy="146.25" r="42.5" />
                        <circle cx="161.7" cy="146.25" r="42.5" />
                        <path d="M125 45 L184.28 155 L65.72 155 Z" />
                        <path d="M125 205 L65.72 95 L184.28 95 Z" />
                    </g>
                </g>
            `;
            container.appendChild(svg);
            animationBox.appendChild(container);
        }
        