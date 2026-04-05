/**
 * Advanced Furniture Preview Logic
 * Renders HTML/CSS representation of complex modular furniture.
 */

window.renderPreview = function(container, summary) {
    if (!container || !summary) return;
    
    const { configuration, color, material } = summary;
    const { width, height, depth, partitionCount, selectedModules } = configuration;

    container.innerHTML = '';
    container.style.perspective = '1500px';
    container.className = 'relative flex items-center justify-center w-full h-full overflow-visible';

    // Scale Logic
    const maxDim = Math.max(width, height);
    const scale = (Math.min(container.clientWidth, container.clientHeight) * 0.7) / maxDim;
    const sw = width * scale;
    const sh = height * scale;
    const sd = depth * scale;

    // 3D Scene Wrapper
    const scene = document.createElement('div');
    scene.className = 'relative transition-transform duration-700 preserve-3d';
    scene.style.width = `${sw}px`;
    scene.style.height = `${sh}px`;
    scene.style.transform = `rotateY(${configuration.rotation || -25}deg) rotateX(10deg)`;
    scene.style.transformStyle = 'preserve-3d';

    const hex = color ? color.hex : '#F5F5F5';

    // Side Planes Helper
    const createPlane = (w, h, transform, customClass = '') => {
        const p = document.createElement('div');
        p.className = `absolute border border-black/10 transition-colors duration-500 ${customClass}`;
        p.style.width = `${w}px`;
        p.style.height = `${h}px`;
        p.style.transform = transform;
        p.style.backgroundColor = hex;
        return p;
    };

    // 1. Back
    scene.appendChild(createPlane(sw, sh, `translateZ(${-sd/2}px)`, 'shadow-inner'));
    
    // 2. Bottom
    scene.appendChild(createPlane(sw, sd, `rotateX(90deg) translateZ(${-sh + sd/2}px)`, 'brightness-75'));
    
    // 3. Top
    scene.appendChild(createPlane(sw, sd, `rotateX(90deg) translateZ(${sd/2}px)`, 'brightness-110'));
    
    // 4. Left Side
    scene.appendChild(createPlane(sd, sh, `rotateY(90deg) translateZ(${-sd/2}px)`, 'brightness-90'));
    
    // 5. Right Side
    scene.appendChild(createPlane(sd, sh, `rotateY(90deg) translateZ(${sw - sd/2}px)`, 'brightness-95'));

    // INTERNAL CONTENT (Partitions, Shelves, Drawers)
    const content = document.createElement('div');
    content.className = 'absolute inset-0 flex';
    content.style.transform = `translateZ(${-sd/2 + 2}px)`; // Slightly forward from back
    content.style.transformStyle = 'preserve-3d'; // CRITICAL: Allow children to have their own 3D space
    content.style.width = `${sw}px`;
    content.style.height = `${sh}px`;

    for (let i = 1; i <= partitionCount; i++) {
        const partition = document.createElement('div');
        partition.className = 'flex-1 relative border-r border-black/10 last:border-r-0';
        partition.style.transformStyle = 'preserve-3d'; // CRITICAL: Allow doors to render in 3D relative to partition
        
        const data = selectedModules[`partition_${i}`] || { shelfCount: 0, drawerCount: 0, doorModel: 'none' };
        
        // Physical Dimensions from product or defaults
        const hangerH = product.hangerHeight || 100;
        const shelfH = product.shelfHeight || 30;
        const drawerH = product.drawerHeight || 20;
        const hScale = sh / height; // Pixels per CM

        const isHanger = data.id === 'hanger';
        const dCount = data.drawerCount || 0;
        const sCount = data.shelfCount || 0;

        // 1. Drawers (at the bottom)
        if (dCount > 0) {
            const drawersWrap = document.createElement('div');
            drawersWrap.className = 'absolute bottom-0 w-full flex flex-col-reverse';
            drawersWrap.style.height = `${dCount * drawerH * hScale}px`;
            for (let d = 0; d < dCount; d++) {
                const drw = document.createElement('div');
                drw.className = 'w-full border-t border-black/20 flex items-center justify-center';
                drw.style.height = `${drawerH * hScale}px`;
                drw.innerHTML = '<div class="w-6 h-0.5 bg-black/10 rounded-full"></div>';
                drawersWrap.appendChild(drw);
            }
            partition.appendChild(drawersWrap);
        }

        // 2. Hanger (at the top)
        if (isHanger) {
            const hangerArea = document.createElement('div');
            hangerArea.className = 'absolute top-0 w-full';
            hangerArea.style.height = `${hangerH * hScale}px`;
            
            const bar = document.createElement('div');
            bar.className = 'absolute left-[10%] w-[80%] h-1 bg-gray-400 rounded-full shadow-sm';
            bar.style.top = '20px'; // Visual offset from top
            hangerArea.appendChild(bar);
            partition.appendChild(hangerArea);
        }

        // 3. Shelves (distributed in available middle space)
        if (sCount > 0) {
            const offsetTop = isHanger ? (hangerH * hScale) : 0;
            const offsetBottom = (dCount * drawerH * hScale);
            const availablePx = sh - offsetTop - offsetBottom;
            
            if (availablePx > 10) {
                const gap = availablePx / (sCount + 1);
                for (let s = 1; s <= sCount; s++) {
                    const shelf = document.createElement('div');
                    shelf.className = 'absolute w-full border-b border-black/20';
                    shelf.style.top = `${offsetTop + (s * gap)}px`;
                    partition.appendChild(shelf);
                }
            }
        }

        // DOORS (INDIVIDUAL PER PARTITION)
        if (data.doorModel && data.doorModel !== 'none') {
            const door = document.createElement('div');
            door.className = 'absolute inset-0 z-20 transition-all duration-700 origin-left border border-black/10';
            door.style.transform = `translateZ(${sd/2 + 2}px)`; // Front face (Move slightly more forward)
            door.style.transformStyle = 'preserve-3d'; 
            door.style.backgroundColor = hex;

            if (data.doorModel === 'panel' || data.doorModel === 'plain') {
                // Düz kapak: Gövde rengi + ince bir panel çerçevesi
                door.style.backgroundColor = hex;
                door.innerHTML = '<div class="absolute inset-2 border border-black/5 rounded-sm"></div>';
            } else if (data.doorModel === 'mirror' || data.doorModel === 'mirror-full' || data.doorModel === 'mirrored') {
                // Aynalı kapak: Grileştirilmiş mavi gradyan + yansıma efekti
                door.className += ' bg-gradient-to-br from-gray-100 via-blue-50/30 to-gray-400 opacity-90';
                door.innerHTML = `
                    <div class="absolute inset-0 bg-white/10 opacity-40"></div>
                    <div class="absolute top-0 left-0 w-full h-full overflow-hidden">
                        <div class="absolute -top-[100%] -left-[100%] w-[300%] h-[100%] bg-white/20 rotate-45 transform"></div>
                    </div>
                    <div class="absolute inset-4 border border-white/40 shadow-inner"></div>
                `;
            } else {
                door.style.backgroundColor = hex;
            }

            // Handle (Enhanced Visibility)
            if (configuration.handlesEnabled) {
                const h = document.createElement('div');
                // Use absolute positioning relative to the door's 3D plane
                h.className = 'absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-[30%] bg-zinc-800 rounded-full shadow-lg border-r border-white/10';
                h.style.transform = 'translateZ(3px)'; // Pop the handle out 3px from the door
                door.appendChild(h);
            }
            partition.appendChild(door);
        }

        content.appendChild(partition);
    }
    scene.appendChild(content);


    // DIMENSION LABELS (SVG)
    const labels = document.createElement('div');
    labels.className = 'absolute inset-0 pointer-events-none overflow-visible';
    labels.style.transform = 'translateZ(100px)'; // Labels in front
    
    const labelHTML = `
        <div class="absolute -bottom-12 left-0 w-full flex flex-col items-center">
            <div class="w-full h-px bg-black/20 relative">
                <div class="absolute left-0 -top-1 w-px h-2 bg-black"></div>
                <div class="absolute right-0 -top-1 w-px h-2 bg-black"></div>
            </div>
            <span class="text-[10px] font-bold mt-1 text-black/40">${width} CM</span>
        </div>
        <div class="absolute -right-16 top-0 h-full flex items-center">
             <div class="h-full w-px bg-black/20 relative">
                <div class="absolute top-0 -left-1 h-px w-2 bg-black"></div>
                <div class="absolute bottom-0 -left-1 h-px w-2 bg-black"></div>
            </div>
            <span class="text-[10px] font-bold ml-2 text-black/40" style="writing-mode: vertical-rl;">${height} CM</span>
        </div>
    `;
    labels.innerHTML = labelHTML;
    scene.appendChild(labels);

    container.appendChild(scene);

    // Visual Polish: Shadow below
    const shadow = document.createElement('div');
    shadow.className = 'absolute -bottom-20 left-1/2 -translate-x-1/2 w-[120%] h-12 bg-black/5 blur-2xl rounded-full scale-y-50';
    container.appendChild(shadow);
};
