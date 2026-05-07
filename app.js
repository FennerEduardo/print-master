const PaperSizes = {
    "pliego": { width: 70, height: 100, label: "Pliego (70x100 cm)" },
    "medio-pliego": { width: 50, height: 70, label: "1/2 Pliego (50x70 cm)" },
    "cuarto-pliego": { width: 35, height: 50, label: "1/4 Pliego (35x50 cm)" },
    "octavo-pliego": { width: 25, height: 35, label: "1/8 Pliego (25x35 cm)" },
    "oficio-col": { width: 21.6, height: 33, label: "Oficio CO (21.6x33 cm)" },
    "tabloide": { width: 27.9, height: 43.2, label: "Tabloide (27.9x43.2 cm)" },
    "tabloide-extra": { width: 30.4, height: 45.7, label: "Tabloide Extra (30.4x45.7 cm)" },
    "carta": { width: 21.6, height: 27.9, label: "Carta (21.6x27.9 cm)" },
    "legal": { width: 21.6, height: 35.6, label: "Legal US (21.6x35.6 cm)" },
    "a0": { width: 84.1, height: 118.9, label: "A0 (84.1x118.9 cm)" },
    "a1": { width: 59.4, height: 84.1, label: "A1 (59.4x84.1 cm)" },
    "a2": { width: 42, height: 59.4, label: "A2 (42x59.4 cm)" },
    "a3": { width: 29.7, height: 42, label: "A3 (29.7x42 cm)" },
    "a4": { width: 21, height: 29.7, label: "A4 (21x29.7 cm)" }
};

class PrintApp {
    constructor() {
        this.state = {
            paperSize: "carta",
            orientation: "portrait",
            margin: 5,
            customWidth: 21.6,
            customHeight: 27.9,
            zoom: 1,
            pages: [],
            currentPageId: null,
            selectedImageId: null,
            snapThreshold: 10
        };
        this.cropManager = new CropManager();
        this.filterManager = new FilterManager();
        this.initElements();
        this.initEvents();
        this.addPage();
    }

    initElements() {
        this.canvasWrapper = document.getElementById("canvas-wrapper");
        this.paperSizeSelect = document.getElementById("paper-size");
        this.customSizeControls = document.getElementById("custom-size-controls");
        this.customWidthInput = document.getElementById("custom-width");
        this.customHeightInput = document.getElementById("custom-height");
        this.btnPortrait = document.getElementById("btn-portrait");
        this.btnLandscape = document.getElementById("btn-landscape");
        this.marginInput = document.getElementById("paper-margin");
        this.marginDisplay = document.getElementById("margin-value");
        this.dropZone = document.getElementById("drop-zone");
        this.fileInput = document.getElementById("file-input");
        this.exportBtn = document.getElementById("export-pdf");
        this.resetBtn = document.getElementById("reset-canvas");
        this.selectionTools = document.getElementById("selection-tools");
        this.zoomLevelDisplay = document.getElementById("zoom-level");
        this.btnPolaroid = document.getElementById("btn-polaroid");
        this.polaroidTextInput = document.getElementById("polaroid-text-input");
        this.addPageBtn = document.getElementById("add-page");
        this.pageListSidebar = document.getElementById("page-list-sidebar");
        this.guideH = document.getElementById("guide-h");
        this.guideV = document.getElementById("guide-v");
    }

    initEvents() {
        this.paperSizeSelect.addEventListener("change", (e) => {
            this.state.paperSize = e.target.value;
            this.customSizeControls.classList.toggle("hidden", e.target.value !== "custom");
            this.updateAllPages();
        });

        [this.customWidthInput, this.customHeightInput].forEach(el => {
            el.addEventListener("input", () => {
                this.state.customWidth = parseFloat(this.customWidthInput.value) || 0;
                this.state.customHeight = parseFloat(this.customHeightInput.value) || 0;
                this.updateAllPages();
            });
        });

        this.btnPortrait.addEventListener("click", () => {
            this.state.orientation = "portrait";
            this.btnPortrait.classList.add("active");
            this.btnLandscape.classList.remove("active");
            this.updateAllPages();
        });

        this.btnLandscape.addEventListener("click", () => {
            this.state.orientation = "landscape";
            this.btnLandscape.classList.add("active");
            this.btnPortrait.classList.remove("active");
            this.updateAllPages();
        });

        this.marginInput.addEventListener("input", (e) => {
            this.state.margin = parseInt(e.target.value);
            this.marginDisplay.innerText = `${this.state.margin} mm`;
            this.updateAllPages();
        });

        document.getElementById("zoom-in").addEventListener("click", () => this.updateZoom(0.1));
        document.getElementById("zoom-out").addEventListener("click", () => this.updateZoom(-0.1));

        this.dropZone.addEventListener("click", () => this.fileInput.click());
        this.fileInput.addEventListener("change", (e) => this.handleFiles(e.target.files));
        
        this.dropZone.addEventListener("dragover", (e) => { e.preventDefault(); this.dropZone.classList.add("dragover"); });
        this.dropZone.addEventListener("dragleave", () => this.dropZone.classList.remove("dragover"));
        this.dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            this.dropZone.classList.remove("dragover");
            this.handleFiles(e.dataTransfer.files);
        });

        document.getElementById("btn-delete").addEventListener("click", () => this.deleteSelected());
        document.getElementById("btn-rotate").addEventListener("click", () => this.rotateSelected());
        document.getElementById("btn-duplicate").addEventListener("click", () => this.duplicateSelected());
        document.getElementById("btn-center-h").addEventListener("click", () => this.centerSelected("h"));
        document.getElementById("btn-center-v").addEventListener("click", () => this.centerSelected("v"));
        document.getElementById("btn-layer-up").addEventListener("click", () => this.bringToFront());
        document.getElementById("btn-crop").addEventListener("click", () => this.cropSelected());
        document.getElementById("btn-filter").addEventListener("click", () => this.filterSelected());
        document.getElementById("btn-dist-h").addEventListener("click", () => this.distributeImages("h"));
        document.getElementById("btn-dist-v").addEventListener("click", () => this.distributeImages("v"));
        this.btnPolaroid.addEventListener("click", () => this.togglePolaroid());
        this.polaroidTextInput.addEventListener("input", (e) => this.updatePolaroidText(e.target.value));

        this.resetBtn.addEventListener("click", () => this.clearAll());
        this.exportBtn.addEventListener("click", () => this.exportToPDF());
        this.addPageBtn.addEventListener("click", () => this.addPage());

        window.addEventListener("mousedown", (e) => {
            if (e.target.closest(".page-container")) {
                const pageId = e.target.closest(".page-container").id.replace('page-', '');
                this.selectPage(pageId);
            }
            if (!e.target.closest(".placed-image") && !e.target.closest(".status-bar") && !e.target.closest(".sidebar")) {
                this.selectImage(null);
            }
        });
    }

    addPage() {
        const id = "p-" + Date.now();
        const page = {
            id,
            images: [],
            element: null
        };

        const pageContainer = document.createElement("div");
        pageContainer.className = "page-container";
        pageContainer.id = "page-" + id;
        
        const label = document.createElement("div");
        label.className = "page-number-label";
        label.innerText = `Página ${this.state.pages.length + 1}`;
        
        const canvas = document.createElement("div");
        canvas.id = "print-canvas";
        
        const marginGuide = document.createElement("div");
        marginGuide.id = "margin-guide";
        
        canvas.appendChild(marginGuide);
        pageContainer.appendChild(label);
        pageContainer.appendChild(canvas);
        this.canvasWrapper.appendChild(pageContainer);
        
        page.element = canvas;
        this.state.pages.push(page);
        this.selectPage(id);
        this.updateAllPages();
        this.renderPageList();
        
        // Scroll to new page
        setTimeout(() => pageContainer.scrollIntoView({ behavior: 'smooth' }), 100);
    }

    selectPage(id) {
        this.state.currentPageId = id;
        document.querySelectorAll(".page-container").forEach(el => {
            el.classList.toggle("active", el.id === "page-" + id);
        });
        this.renderPageList();
    }

    removePage(id) {
        if (this.state.pages.length <= 1) return;
        const index = this.state.pages.findIndex(p => p.id === id);
        if (index !== -1) {
            const page = this.state.pages[index];
            document.getElementById("page-" + id).remove();
            this.state.pages.splice(index, 1);
            if (this.state.currentPageId === id) {
                this.selectPage(this.state.pages[Math.max(0, index - 1)].id);
            }
            this.renderPageList();
            this.updatePageNumbers();
        }
    }

    updatePageNumbers() {
        this.state.pages.forEach((p, i) => {
            const label = document.getElementById("page-" + p.id).querySelector(".page-number-label");
            label.innerText = `Página ${i + 1}`;
        });
    }

    renderPageList() {
        this.pageListSidebar.innerHTML = "";
        this.state.pages.forEach((p, i) => {
            const item = document.createElement("div");
            item.className = `page-item-sidebar ${p.id === this.state.currentPageId ? 'active' : ''}`;
            item.innerHTML = `
                <span><i class="fa-solid fa-file"></i> Página ${i + 1}</span>
                ${this.state.pages.length > 1 ? `<i class="fa-solid fa-xmark btn-delete-page" data-id="${p.id}"></i>` : ''}
            `;
            item.onclick = (e) => {
                if (e.target.classList.contains('btn-delete-page')) {
                    this.removePage(e.target.dataset.id);
                } else {
                    this.selectPage(p.id);
                    document.getElementById("page-" + p.id).scrollIntoView({ behavior: 'smooth' });
                }
            };
            this.pageListSidebar.appendChild(item);
        });
    }

    updateAllPages() {
        let w, h;
        if (this.state.paperSize === "custom") {
            w = this.state.customWidth;
            h = this.state.customHeight;
        } else {
            const size = PaperSizes[this.state.paperSize];
            w = size.width;
            h = size.height;
        }

        if (this.state.orientation === "landscape") {
            [w, h] = [h, w];
        }

        const ratio = 37.795; // cm to px conversion factor
        const pxW = w * ratio;
        const pxH = h * ratio;

        this.state.pages.forEach(p => {
            const canvas = p.element;
            const container = canvas.parentElement;
            container.style.width = `${pxW}px`;
            container.style.height = `${pxH}px`;
            
            const guide = canvas.querySelector("#margin-guide");
            guide.style.top = `${this.state.margin}mm`;
            guide.style.left = `${this.state.margin}mm`;
            guide.style.right = `${this.state.margin}mm`;
            guide.style.bottom = `${this.state.margin}mm`;
        });

        this.fitCanvasToScreen();
    }

    fitCanvasToScreen() {
        const areaWidth = document.querySelector(".canvas-area").clientWidth - 100;
        const canvasWidth = parseFloat(this.state.pages[0].element.parentElement.style.width);
        const scale = Math.min(areaWidth / canvasWidth, 1);
        this.state.zoom = scale;
        this.applyZoom();
    }

    updateZoom(delta) {
        this.state.zoom = Math.max(0.1, Math.min(3, this.state.zoom + delta));
        this.applyZoom();
    }

    applyZoom() {
        this.canvasWrapper.style.transform = `scale(${this.state.zoom})`;
        this.zoomLevelDisplay.innerText = `${Math.round(this.state.zoom * 100)}%`;
    }

    handleFiles(files) {
        let fileIndex = 0;
        Array.from(files).forEach(file => {
            if (file.type.startsWith("image/")) {
                const idx = fileIndex++;
                const reader = new FileReader();
                reader.onload = (e) => this.addImage(e.target.result, idx);
                reader.readAsDataURL(file);
            }
        });
    }

    addImage(src, batchIndex = 0) {
        const id = "img-" + Date.now() + Math.random().toString(36).substr(2, 5);
        const activePage = this.state.pages.find(p => p.id === this.state.currentPageId);
        const existingCount = activePage.images.length;
        const offset = (existingCount + batchIndex) * 30;
        
        const imgObj = {
            id,
            src,
            x: 40 + offset,
            y: 40 + offset,
            width: 250,
            height: 250,
            rotation: 0,
            polaroid: false,
            caption: "Recuerdo",
            filter: "none"
        };

        const div = document.createElement("div");
        div.className = "placed-image";
        div.id = id;
        div.style.left = `${imgObj.x}px`;
        div.style.top = `${imgObj.y}px`;
        div.style.width = `${imgObj.width}px`;

        const imgContainer = document.createElement("div");
        imgContainer.className = "img-container";
        imgContainer.style.width = "100%";
        imgContainer.style.overflow = "hidden";
        
        const img = new Image();
        img.src = src;
        img.style.width = "100%";
        img.style.display = "block";

        img.onload = () => {
            const aspect = img.naturalHeight / img.naturalWidth;
            imgObj.height = imgObj.width * aspect;
            div.style.height = `${imgObj.height}px`;
            const resizer = document.createElement("div");
            resizer.className = "resizer br";
            div.appendChild(resizer);
            this.initManipulation(div, imgObj);
        };

        const captionDiv = document.createElement("div");
        captionDiv.className = "polaroid-caption hidden";
        captionDiv.innerText = imgObj.caption;

        imgContainer.appendChild(img);
        div.appendChild(imgContainer);
        div.appendChild(captionDiv);
        
        activePage.element.appendChild(div);
        activePage.images.push(imgObj);
        
        this.selectImage(id);
        this.updateThumbnails();
    }

    initManipulation(el, imgData) {
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startW, startH, startLeft, startTop;

        el.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.selectImage(imgData.id);

            if (e.target.classList.contains("resizer")) {
                isResizing = true;
            } else {
                isDragging = true;
            }

            startX = e.clientX;
            startY = e.clientY;
            startW = el.offsetWidth;
            startH = el.offsetHeight;
            startLeft = el.offsetLeft;
            startTop = el.offsetTop;

            const onMouseMove = (e) => {
                const dx = (e.clientX - startX) / this.state.zoom;
                const dy = (e.clientY - startY) / this.state.zoom;

                if (isDragging) {
                    let nextX = startLeft + dx;
                    let nextY = startTop + dy;
                    
                    // Guidelines & Snapping
                    this.handleGuidelines(el, nextX, nextY, imgData);
                } else if (isResizing) {
                    const aspect = startH / startW;
                    imgData.width = Math.max(50, startW + dx);
                    imgData.height = imgData.width * aspect;
                    el.style.width = `${imgData.width}px`;
                    el.style.height = `${imgData.height}px`;
                }
            };

            const onMouseUp = (e) => {
                isDragging = false;
                isResizing = false;
                this.hideGuides();
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                
                // Cross-page drag: detect if image was dropped over a different page
                if (!isResizing) {
                    this.checkCrossPageDrop(el, imgData, e);
                }
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    handleGuidelines(el, x, y, imgData) {
        const canvas = el.parentElement;
        const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
        const margin = this.state.margin * 3.7795;
        const iw = el.offsetWidth, ih = el.offsetHeight;
        const T = this.state.snapThreshold;
        let snapX = x, snapY = y, showH = false, showV = false;
        const centerX = cw / 2, centerY = ch / 2;

        // Page center snap
        if (Math.abs((x + iw/2) - centerX) < T) { snapX = centerX - iw/2; showV = true; }
        if (Math.abs((y + ih/2) - centerY) < T) { snapY = centerY - ih/2; showH = true; }

        // Margin snap
        if (Math.abs(x - margin) < T) snapX = margin;
        if (Math.abs((x + iw) - (cw - margin)) < T) snapX = cw - margin - iw;
        if (Math.abs(y - margin) < T) snapY = margin;
        if (Math.abs((y + ih) - (ch - margin)) < T) snapY = ch - margin - ih;

        // Image-to-image snap
        const page = this.state.pages.find(p => p.element === canvas);
        if (page) {
            for (const other of page.images) {
                if (other.id === imgData.id) continue;
                const ox = other.x, oy = other.y;
                const oel = document.getElementById(other.id);
                if (!oel) continue;
                const ow = oel.offsetWidth, oh = oel.offsetHeight;
                // Left edge to left/right edge
                if (Math.abs(snapX - ox) < T) snapX = ox;
                if (Math.abs(snapX - (ox + ow)) < T) snapX = ox + ow;
                // Right edge to left/right edge
                if (Math.abs((snapX + iw) - ox) < T) snapX = ox - iw;
                if (Math.abs((snapX + iw) - (ox + ow)) < T) snapX = ox + ow - iw;
                // Center X to center X
                if (Math.abs((snapX + iw/2) - (ox + ow/2)) < T) snapX = ox + ow/2 - iw/2;
                // Top edge to top/bottom edge
                if (Math.abs(snapY - oy) < T) snapY = oy;
                if (Math.abs(snapY - (oy + oh)) < T) snapY = oy + oh;
                // Bottom edge to top/bottom edge
                if (Math.abs((snapY + ih) - oy) < T) snapY = oy - ih;
                if (Math.abs((snapY + ih) - (oy + oh)) < T) snapY = oy + oh - ih;
                // Center Y to center Y
                if (Math.abs((snapY + ih/2) - (oy + oh/2)) < T) snapY = oy + oh/2 - ih/2;
            }
        }

        imgData.x = snapX; imgData.y = snapY;
        el.style.left = `${snapX}px`; el.style.top = `${snapY}px`;

        // Update guide lines
        if (showV) this.guideV.classList.remove("hidden"); else this.guideV.classList.add("hidden");
        if (showH) this.guideH.classList.remove("hidden"); else this.guideH.classList.add("hidden");
        if (showV) {
            const r = canvas.getBoundingClientRect(), wr = this.canvasWrapper.getBoundingClientRect();
            this.guideV.style.left = `${r.left - wr.left + (cw * this.state.zoom / 2)}px`;
            this.guideV.style.height = `${ch * this.state.zoom}px`;
            this.guideV.style.top = `${r.top - wr.top}px`;
        }
        if (showH) {
            const r = canvas.getBoundingClientRect(), wr = this.canvasWrapper.getBoundingClientRect();
            this.guideH.style.top = `${r.top - wr.top + (ch * this.state.zoom / 2)}px`;
            this.guideH.style.width = `${cw * this.state.zoom}px`;
            this.guideH.style.left = `${r.left - wr.left}px`;
        }
    }

    hideGuides() {
        this.guideH.classList.add("hidden");
        this.guideV.classList.add("hidden");
    }

    checkCrossPageDrop(el, imgData, mouseEvent) {
        const mouseX = mouseEvent.clientX;
        const mouseY = mouseEvent.clientY;
        
        // Find which page the mouse is over
        for (const page of this.state.pages) {
            const pageContainer = page.element.parentElement;
            const rect = pageContainer.getBoundingClientRect();
            
            if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
                // Check if this is a different page than the current parent
                const currentCanvas = el.parentElement;
                if (currentCanvas !== page.element) {
                    // Remove from old page's data
                    for (const p of this.state.pages) {
                        const idx = p.images.findIndex(img => img.id === imgData.id);
                        if (idx !== -1) {
                            p.images.splice(idx, 1);
                            break;
                        }
                    }
                    
                    // Calculate new position relative to target page
                    const targetRect = page.element.getBoundingClientRect();
                    const newX = (mouseX - targetRect.left) / this.state.zoom - el.offsetWidth / 2;
                    const newY = (mouseY - targetRect.top) / this.state.zoom - el.offsetHeight / 2;
                    
                    imgData.x = Math.max(0, newX);
                    imgData.y = Math.max(0, newY);
                    el.style.left = `${imgData.x}px`;
                    el.style.top = `${imgData.y}px`;
                    
                    // Move DOM element to new page
                    page.element.appendChild(el);
                    page.images.push(imgData);
                    
                    // Select the target page
                    this.selectPage(page.id);
                    this.updateThumbnails();
                }
                break;
            }
        }
    }

    selectImage(id) {
        this.state.selectedImageId = id;
        document.querySelectorAll(".placed-image").forEach(el => {
            el.classList.toggle("selected", el.id === id);
        });
        this.selectionTools.classList.toggle("hidden", !id);
        
        if (id) {
            const allImages = this.state.pages.flatMap(p => p.images);
            const imgData = allImages.find(img => img.id === id);
            this.btnPolaroid.classList.toggle("active", imgData.polaroid);
            this.polaroidTextInput.classList.toggle("hidden", !imgData.polaroid);
            this.polaroidTextInput.value = imgData.caption;
        }
    }

    togglePolaroid() {
        if (!this.state.selectedImageId) return;
        const allImages = this.state.pages.flatMap(p => p.images);
        const imgData = allImages.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        const caption = el.querySelector(".polaroid-caption");
        
        imgData.polaroid = !imgData.polaroid;
        el.classList.toggle("polaroid", imgData.polaroid);
        caption.classList.toggle("hidden", !imgData.polaroid);
        this.btnPolaroid.classList.toggle("active", imgData.polaroid);
        this.polaroidTextInput.classList.toggle("hidden", !imgData.polaroid);
        
        const img = el.querySelector("img");
        const aspect = img.naturalHeight / img.naturalWidth;
        if (imgData.polaroid) {
            el.style.height = "auto";
        } else {
            el.style.height = `${imgData.width * aspect}px`;
        }
    }

    updatePolaroidText(text) {
        if (!this.state.selectedImageId) return;
        const allImages = this.state.pages.flatMap(p => p.images);
        const imgData = allImages.find(img => img.id === this.state.selectedImageId);
        imgData.caption = text;
        const el = document.getElementById(this.state.selectedImageId);
        const caption = el.querySelector(".polaroid-caption");
        caption.innerText = text;
    }

    deleteSelected() {
        if (!this.state.selectedImageId) return;
        const el = document.getElementById(this.state.selectedImageId);
        if (el) el.remove();
        this.state.pages.forEach(p => {
            p.images = p.images.filter(img => img.id !== this.state.selectedImageId);
        });
        this.selectImage(null);
        this.updateThumbnails();
    }

    rotateSelected() {
        if (!this.state.selectedImageId) return;
        const allImages = this.state.pages.flatMap(p => p.images);
        const imgData = allImages.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        imgData.rotation = (imgData.rotation + 90) % 360;
        const img = el.querySelector("img");
        img.style.transform = `rotate(${imgData.rotation}deg)`;
    }

    duplicateSelected() {
        if (!this.state.selectedImageId) return;
        const allImages = this.state.pages.flatMap(p => p.images);
        const imgData = allImages.find(img => img.id === this.state.selectedImageId);
        this.addImage(imgData.src);
        
        const activePage = this.state.pages.find(p => p.id === this.state.currentPageId);
        const lastImg = activePage.images[activePage.images.length - 1];
        const el = document.getElementById(lastImg.id);
        
        lastImg.x = imgData.x + 20;
        lastImg.y = imgData.y + 20;
        lastImg.width = imgData.width;
        lastImg.rotation = imgData.rotation;
        lastImg.polaroid = imgData.polaroid;
        lastImg.caption = imgData.caption;
        
        el.style.left = `${lastImg.x}px`;
        el.style.top = `${lastImg.y}px`;
        el.style.width = `${lastImg.width}px`;
        if (lastImg.polaroid) {
            el.classList.add("polaroid");
            el.querySelector(".polaroid-caption").classList.remove("hidden");
            el.querySelector(".polaroid-caption").innerText = lastImg.caption;
            el.style.height = "auto";
        }
        el.querySelector("img").style.transform = `rotate(${lastImg.rotation}deg)`;
        this.selectImage(lastImg.id);
    }

    centerSelected(axis) {
        if (!this.state.selectedImageId) return;
        const el = document.getElementById(this.state.selectedImageId);
        const canvas = el.parentElement;
        const imgData = this.state.pages.flatMap(p => p.images).find(img => img.id === this.state.selectedImageId);
        const canvasW = canvas.offsetWidth;
        const canvasH = canvas.offsetHeight;

        if (axis === "h") {
            imgData.x = (canvasW - el.offsetWidth) / 2;
            el.style.left = `${imgData.x}px`;
        } else {
            imgData.y = (canvasH - el.offsetHeight) / 2;
            el.style.top = `${imgData.y}px`;
        }
    }

    bringToFront() {
        if (!this.state.selectedImageId) return;
        const el = document.getElementById(this.state.selectedImageId);
        el.parentElement.appendChild(el);
    }

    cropSelected() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.pages.flatMap(p => p.images).find(i => i.id === this.state.selectedImageId);
        this.cropManager.open(imgData.src, (croppedSrc) => {
            imgData.src = croppedSrc;
            const el = document.getElementById(imgData.id);
            const img = el.querySelector("img");
            img.src = croppedSrc;
            img.onload = () => {
                const aspect = img.naturalHeight / img.naturalWidth;
                imgData.height = imgData.width * aspect;
                el.style.height = imgData.polaroid ? "auto" : `${imgData.height}px`;
            };
            this.updateThumbnails();
        });
    }

    filterSelected() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.pages.flatMap(p => p.images).find(i => i.id === this.state.selectedImageId);
        this.filterManager.open(imgData.src, imgData.filter, (filterStr) => {
            imgData.filter = filterStr;
            const el = document.getElementById(imgData.id);
            el.querySelector("img").style.filter = filterStr;
        });
    }

    distributeImages(axis) {
        const page = this.state.pages.find(p => p.id === this.state.currentPageId);
        if (!page || page.images.length < 2) return;
        const canvas = page.element;
        const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
        const margin = this.state.margin * 3.7795;
        const imgs = page.images.slice().sort((a, b) => axis === "h" ? a.x - b.x : a.y - b.y);
        if (axis === "h") {
            let totalW = 0;
            imgs.forEach(img => { const el = document.getElementById(img.id); totalW += el.offsetWidth; });
            const space = (cw - 2 * margin - totalW) / (imgs.length - 1);
            let cx = margin;
            imgs.forEach(img => {
                const el = document.getElementById(img.id);
                img.x = cx; el.style.left = `${cx}px`;
                cx += el.offsetWidth + space;
            });
        } else {
            let totalH = 0;
            imgs.forEach(img => { const el = document.getElementById(img.id); totalH += el.offsetHeight; });
            const space = (ch - 2 * margin - totalH) / (imgs.length - 1);
            let cy = margin;
            imgs.forEach(img => {
                const el = document.getElementById(img.id);
                img.y = cy; el.style.top = `${cy}px`;
                cy += el.offsetHeight + space;
            });
        }
    }

    clearAll() {
        if (confirm("¿Estás seguro de que deseas limpiar todo el proyecto? Se eliminarán todas las páginas e imágenes.")) {
            this.canvasWrapper.innerHTML = "";
            this.state.pages = [];
            this.addPage();
            this.selectImage(null);
            this.updateThumbnails();
        }
    }

    updateThumbnails() {
        const list = document.getElementById("image-list");
        list.innerHTML = "";
        const allImages = this.state.pages.flatMap(p => p.images);
        allImages.forEach(img => {
            const thumb = document.createElement("div");
            thumb.className = "image-thumb";
            thumb.innerHTML = `<img src="${img.src}">`;
            thumb.addEventListener("click", () => this.selectImage(img.id));
            list.appendChild(thumb);
        });
    }

    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        this.selectImage(null); 

        const loadingBtn = this.exportBtn;
        const originalText = loadingBtn.innerHTML;
        loadingBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exportando...';
        loadingBtn.disabled = true;

        try {
            const originalZoom = this.state.zoom;
            this.state.zoom = 1;
            this.applyZoom();

            let w, h;
            if (this.state.paperSize === "custom") {
                w = this.state.customWidth;
                h = this.state.customHeight;
            } else {
                const size = PaperSizes[this.state.paperSize];
                w = size.width;
                h = size.height;
            }
            if (this.state.orientation === "landscape") [w, h] = [h, w];

            const pdf = new jsPDF({
                orientation: this.state.orientation,
                unit: "cm",
                format: [w, h]
            });

            for (let i = 0; i < this.state.pages.length; i++) {
                const page = this.state.pages[i];
                const canvasEl = page.element;
                const marginGuide = canvasEl.querySelector("#margin-guide");
                
                marginGuide.style.display = "none";
                
                const canvasCapture = await html2canvas(canvasEl, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: "#ffffff"
                });
                
                marginGuide.style.display = "block";
                const imgData = canvasCapture.toDataURL("image/jpeg", 0.95);
                
                if (i > 0) pdf.addPage([w, h], this.state.orientation);
                pdf.addImage(imgData, "JPEG", 0, 0, w, h);
            }

            pdf.save(`PrintMaster_Proyecto_${Date.now()}.pdf`);

            this.state.zoom = originalZoom;
            this.applyZoom();
        } catch (err) {
            console.error(err);
            alert("Error al generar el PDF.");
        } finally {
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.app = new PrintApp();
});
