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

const PREFS_KEY = "printmaster_preferences";
const FILTER_OPTIONS = ["none", "sepia", "grayscale", "vintage", "high-contrast", "warm", "cold"];

class PrintApp {
    constructor() {
        this.state = {
            paperSize: "carta",
            orientation: "portrait",
            margin: 5,
            customWidth: 21.6,
            customHeight: 27.9,
            zoom: 1,
            images: [],
            gallery: [],
            pages: [],
            activePageId: null,
            selectedImageId: null,
            lockAspect: true,
            copiedFormat: null,
            currentUnit: "px"
        };

        this.initElements();
        this.loadPreferences();
        this.initEvents();
        
        // Inicializar la primera página
        this.addPage();
        this.updateGalleryUI();
        this.updateCanvasImagesUI();
    }

    initElements() {
        this.canvasScrollContainer = document.getElementById("canvas-scroll-container");
        this.pagesContainer = document.getElementById("pages-container");
        this.btnAddPage = document.getElementById("btn-add-page");
        
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

        this.galleryGrid = document.getElementById("gallery-grid");
        this.galleryEmpty = document.getElementById("gallery-empty");
        this.galleryCount = document.getElementById("gallery-count");
        this.canvasCount = document.getElementById("canvas-count");
        this.canvasEmpty = document.getElementById("canvas-empty");

        this.contextMenu = document.getElementById("context-menu");
        this.btnCloseContextMenu = document.getElementById("close-context-menu");
        this.propUnit = document.getElementById("prop-unit");
        this.propWidth = document.getElementById("prop-width");
        this.propHeight = document.getElementById("prop-height");
        this.propX = document.getElementById("prop-x");
        this.propY = document.getElementById("prop-y");
        this.propRotation = document.getElementById("prop-rotation");
        this.propFilter = document.getElementById("prop-filter");
        this.propPolaroid = document.getElementById("prop-polaroid");
        this.propCaption = document.getElementById("prop-caption");
        this.propCaptionGroup = document.getElementById("prop-caption-group");
        this.propLockAspect = document.getElementById("prop-lock-aspect");

        this.btnCopyFormat = document.getElementById("btn-copy-format");
        this.btnPasteFormat = document.getElementById("btn-paste-format");
        this.btnApplyAllFormat = document.getElementById("btn-apply-all-format");

        this.btnSavePrefs = document.getElementById("btn-save-prefs");
        this.btnClearPrefs = document.getElementById("btn-clear-prefs");
    }

    initEvents() {
        this.btnAddPage.addEventListener("click", () => this.addPage());

        this.paperSizeSelect.addEventListener("change", (e) => {
            this.state.paperSize = e.target.value;
            this.customSizeControls.classList.toggle("hidden", e.target.value !== "custom");
            this.updatePages();
        });

        [this.customWidthInput, this.customHeightInput].forEach(el => {
            el.addEventListener("input", () => {
                this.state.customWidth = parseFloat(this.customWidthInput.value) || 0;
                this.state.customHeight = parseFloat(this.customHeightInput.value) || 0;
                this.updatePages();
            });
        });

        this.btnPortrait.addEventListener("click", () => {
            this.state.orientation = "portrait";
            this.btnPortrait.classList.add("active");
            this.btnLandscape.classList.remove("active");
            this.updatePages();
        });

        this.btnLandscape.addEventListener("click", () => {
            this.state.orientation = "landscape";
            this.btnLandscape.classList.add("active");
            this.btnPortrait.classList.remove("active");
            this.updatePages();
        });

        this.marginInput.addEventListener("input", (e) => {
            this.state.margin = parseInt(e.target.value);
            this.marginDisplay.innerText = `${this.state.margin} mm`;
            this.updatePages();
        });

        document.getElementById("zoom-in").addEventListener("click", () => this.updateZoom(0.1));
        document.getElementById("zoom-out").addEventListener("click", () => this.updateZoom(-0.1));

        this.dropZone.addEventListener("click", () => this.fileInput.click());
        this.fileInput.addEventListener("change", (e) => this.handleFiles(e.target.files));
        
        this.dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.dropZone.classList.add("dragover");
        });
        
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

        document.getElementById("btn-add-all").addEventListener("click", () => this.addAllToCanvas());
        document.getElementById("btn-clear-gallery").addEventListener("click", () => this.clearGallery());

        this.btnCloseContextMenu.addEventListener("click", () => this.closeContextMenu());

        this.propUnit.addEventListener("change", (e) => {
            this.state.currentUnit = e.target.value;
            if (this.state.selectedImageId) {
                this.updatePropsDisplay();
            }
        });

        this.propWidth.addEventListener("input", () => this.updateImageFromProps("width"));
        this.propHeight.addEventListener("input", () => this.updateImageFromProps("height"));
        this.propX.addEventListener("input", () => this.updateImageFromProps("x"));
        this.propY.addEventListener("input", () => this.updateImageFromProps("y"));
        this.propRotation.addEventListener("input", () => this.updateImageFromProps("rotation"));
        this.propFilter.addEventListener("change", () => this.updateImageFromProps("filter"));
        this.propPolaroid.addEventListener("change", () => this.updateImageFromProps("polaroid"));
        this.propCaption.addEventListener("input", () => this.updateImageFromProps("caption"));

        this.propLockAspect.addEventListener("click", () => {
            this.state.lockAspect = !this.state.lockAspect;
            this.propLockAspect.classList.toggle("locked", this.state.lockAspect);
            this.propLockAspect.querySelector("i").className = 
                this.state.lockAspect ? "fa-solid fa-lock" : "fa-solid fa-lock-open";
        });

        this.btnCopyFormat.addEventListener("click", () => this.copyFormat());
        this.btnPasteFormat.addEventListener("click", () => this.pasteFormat());
        this.btnApplyAllFormat.addEventListener("click", () => this.applyFormatToAll());

        this.btnSavePrefs.addEventListener("click", () => this.savePreferences());
        this.btnClearPrefs.addEventListener("click", () => this.clearPreferences());

        this.resetBtn.addEventListener("click", () => this.clearAll());
        this.exportBtn.addEventListener("click", () => this.exportToPDF());

        // Cerrar menú contextual al hacer clic fuera
        document.addEventListener("mousedown", (e) => {
            if (!this.contextMenu.classList.contains("hidden")) {
                if (!this.contextMenu.contains(e.target) && !e.target.closest(".placed-image") && !e.target.closest(".selection-tools")) {
                    this.closeContextMenu();
                }
            }
            
            // Deseleccionar si se hace clic en el fondo del área de canvas
            if (e.target === this.canvasScrollContainer || e.target === this.pagesContainer || e.target.classList.contains("print-canvas-page") || e.target.classList.contains("margin-guide")) {
                this.selectImage(null);
            }
        });
    }

    // ==================== MULTI-PAGE ====================

    addPage() {
        const pageId = "page-" + Date.now();
        this.state.pages.push(pageId);
        
        const pageWrapper = document.createElement("div");
        pageWrapper.className = "print-canvas-page";
        pageWrapper.id = pageId;
        
        const pageLabel = document.createElement("div");
        pageLabel.className = "page-label";
        pageLabel.innerText = `Página ${this.state.pages.length}`;
        pageWrapper.appendChild(pageLabel);

        const marginGuide = document.createElement("div");
        marginGuide.className = "margin-guide";
        pageWrapper.appendChild(marginGuide);

        if (this.state.pages.length > 1) {
            const controls = document.createElement("div");
            controls.className = "page-controls";
            controls.innerHTML = `<button title="Eliminar Página"><i class="fa-solid fa-trash"></i></button>`;
            controls.querySelector("button").addEventListener("click", () => this.removePage(pageId));
            pageWrapper.appendChild(controls);
        }

        pageWrapper.addEventListener("click", (e) => {
            if (e.target === pageWrapper || e.target === marginGuide) {
                this.state.activePageId = pageId;
            }
        });

        this.pagesContainer.appendChild(pageWrapper);
        this.state.activePageId = pageId;
        this.updatePages();
        this.showToast(`Página ${this.state.pages.length} añadida`, "success");
    }

    removePage(pageId) {
        if (this.state.pages.length <= 1) return;
        if (!confirm("¿Eliminar esta página y todas sus imágenes?")) return;

        // Eliminar imágenes asociadas
        const imagesToRemove = this.state.images.filter(img => img.pageId === pageId);
        imagesToRemove.forEach(img => {
            const el = document.getElementById(img.id);
            if (el) el.remove();
        });
        this.state.images = this.state.images.filter(img => img.pageId !== pageId);

        // Eliminar página del DOM
        const el = document.getElementById(pageId);
        if (el) el.remove();

        this.state.pages = this.state.pages.filter(p => p !== pageId);
        
        // Re-enumerar etiquetas
        this.state.pages.forEach((pId, idx) => {
            const pEl = document.getElementById(pId);
            if (pEl) pEl.querySelector(".page-label").innerText = `Página ${idx + 1}`;
        });

        if (this.state.activePageId === pageId) {
            this.state.activePageId = this.state.pages[0];
        }

        this.updateCanvasImagesUI();
        this.updateGalleryUI();
    }

    updatePages() {
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

        const ratio = 37.795; // px por cm
        
        this.state.pages.forEach(pageId => {
            const page = document.getElementById(pageId);
            if (!page) return;
            
            page.style.width = `${w * ratio}px`;
            page.style.height = `${h * ratio}px`;

            const marginGuide = page.querySelector(".margin-guide");
            if (marginGuide) {
                marginGuide.style.top = `${this.state.margin}mm`;
                marginGuide.style.left = `${this.state.margin}mm`;
                marginGuide.style.right = `${this.state.margin}mm`;
                marginGuide.style.bottom = `${this.state.margin}mm`;
            }
        });

        // Fit zoom solo la primera vez o al cambiar de tamaño
        this.fitCanvasToScreen(w * ratio, h * ratio);
    }

    // ==================== PREFERENCES ====================

    savePreferences() {
        const prefs = {
            paperSize: this.state.paperSize,
            orientation: this.state.orientation,
            margin: this.state.margin,
            customWidth: this.state.customWidth,
            customHeight: this.state.customHeight
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        this.btnSavePrefs.classList.add("saved");
        setTimeout(() => this.btnSavePrefs.classList.remove("saved"), 2000);
        this.showToast("Preferencias guardadas", "success");
    }

    loadPreferences() {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return;

        try {
            const prefs = JSON.parse(raw);

            if (prefs.paperSize) {
                this.state.paperSize = prefs.paperSize;
                this.paperSizeSelect.value = prefs.paperSize;
                this.customSizeControls.classList.toggle("hidden", prefs.paperSize !== "custom");
            }

            if (prefs.orientation) {
                this.state.orientation = prefs.orientation;
                if (prefs.orientation === "landscape") {
                    this.btnLandscape.classList.add("active");
                    this.btnPortrait.classList.remove("active");
                } else {
                    this.btnPortrait.classList.add("active");
                    this.btnLandscape.classList.remove("active");
                }
            }

            if (prefs.margin !== undefined) {
                this.state.margin = prefs.margin;
                this.marginInput.value = prefs.margin;
                this.marginDisplay.innerText = `${prefs.margin} mm`;
            }

            if (prefs.customWidth) {
                this.state.customWidth = prefs.customWidth;
                this.customWidthInput.value = prefs.customWidth;
            }

            if (prefs.customHeight) {
                this.state.customHeight = prefs.customHeight;
                this.customHeightInput.value = prefs.customHeight;
            }

            this.showToast("Preferencias restauradas", "info");
        } catch (e) {
            console.warn("Could not load preferences:", e);
        }
    }

    clearPreferences() {
        localStorage.removeItem(PREFS_KEY);
        this.showToast("Preferencias borradas", "info");
    }

    showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        const icon = type === "success" ? "fa-check-circle" : "fa-info-circle";
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2800);
    }

    // ==================== ZOOM ====================

    fitCanvasToScreen(canvasWidth, canvasHeight) {
        // En multi-página, el zoom afecta a pagesContainer
        const areaWidth = this.canvasScrollContainer.clientWidth - 100;
        
        // Evitar que sea muy pequeño
        const scale = Math.min(Math.max(areaWidth / canvasWidth, 0.2), 1.5);
        this.state.zoom = scale;
        this.applyZoom();
    }

    updateZoom(delta) {
        this.state.zoom = Math.max(0.1, Math.min(3, this.state.zoom + delta));
        this.applyZoom();
    }

    applyZoom() {
        this.pagesContainer.style.transform = `scale(${this.state.zoom})`;
        this.zoomLevelDisplay.innerText = `${Math.round(this.state.zoom * 100)}%`;
        
        // Si el menú contextual está abierto, reposicionarlo para ajustar al zoom
        if (this.state.selectedImageId && !this.contextMenu.classList.contains("hidden")) {
            this.positionContextMenu(this.state.selectedImageId);
        }
    }

    // ==================== GALLERY & COLOR NORMALIZATION ====================

    handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Normalización a sRGB
                    const img = new Image();
                    img.onload = () => {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = img.width;
                        tempCanvas.height = img.height;
                        const ctx = tempCanvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        // Convertir a Data URL puro (descarta el perfil ICC incrustado, forzando sRGB web-safe)
                        const normalizedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
                        this.addToGallery(normalizedDataUrl, file.name);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        this.fileInput.value = "";
    }

    addToGallery(src, name = "Imagen") {
        const galleryItem = {
            id: "gal-" + Date.now() + Math.random().toString(36).substr(2, 5),
            src,
            name,
            usageCount: 0
        };
        this.state.gallery.push(galleryItem);
        this.updateGalleryUI();
    }

    updateGalleryUI() {
        this.galleryGrid.innerHTML = "";
        this.galleryCount.textContent = this.state.gallery.length;
        this.galleryEmpty.classList.toggle("hidden", this.state.gallery.length > 0);
        this.galleryGrid.classList.toggle("hidden", this.state.gallery.length === 0);

        this.state.gallery.forEach(item => {
            item.usageCount = this.state.images.filter(img => img.gallerySrc === item.src).length;

            const div = document.createElement("div");
            div.className = "gallery-item";
            div.innerHTML = `
                <img src="${item.src}" alt="${item.name}">
                ${item.usageCount > 0 ? `<span class="usage-badge">${item.usageCount}</span>` : ""}
                <div class="gallery-item-overlay">
                    <button class="add-to-canvas" title="Agregar al canvas activo"><i class="fa-solid fa-plus"></i></button>
                    <button class="remove-from-gallery" title="Eliminar de biblioteca"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;

            div.querySelector(".add-to-canvas").addEventListener("click", (e) => {
                e.stopPropagation();
                this.addImageToCanvas(item.src);
            });

            div.querySelector(".remove-from-gallery").addEventListener("click", (e) => {
                e.stopPropagation();
                this.removeFromGallery(item.id);
            });

            this.galleryGrid.appendChild(div);
        });
    }

    removeFromGallery(galleryId) {
        this.state.gallery = this.state.gallery.filter(g => g.id !== galleryId);
        this.updateGalleryUI();
    }

    clearGallery() {
        if (this.state.gallery.length === 0) return;
        if (confirm("¿Vaciar toda la biblioteca de imágenes?")) {
            this.state.gallery = [];
            this.updateGalleryUI();
        }
    }

    addAllToCanvas() {
        if (this.state.gallery.length === 0) return;
        this.state.gallery.forEach(item => {
            this.addImageToCanvas(item.src);
        });
        this.showToast(`${this.state.gallery.length} imágenes agregadas`, "success");
    }

    // ==================== IMAGES ON CANVAS ====================

    addImageToCanvas(src, specificPageId = null) {
        const targetPageId = specificPageId || this.state.activePageId || this.state.pages[0];
        const targetPage = document.getElementById(targetPageId);
        if (!targetPage) return;

        const id = "img-" + Date.now() + Math.random().toString(36).substr(2, 5);
        const imgObj = {
            id,
            pageId: targetPageId,
            src,
            gallerySrc: src,
            x: 50,
            y: 50,
            width: 250,
            height: 250,
            rotation: 0,
            polaroid: false,
            caption: "Recuerdo",
            filter: "none",
            aspectRatio: 1
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
        img.className = "filter-none";

        img.onload = () => {
            const aspect = img.naturalHeight / img.naturalWidth;
            imgObj.aspectRatio = aspect;
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
        targetPage.appendChild(div);
        
        this.state.images.push(imgObj);
        this.state.activePageId = targetPageId;
        
        this.selectImage(id);
        this.updateCanvasImagesUI();
        this.updateGalleryUI();
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
                    imgData.x = startLeft + dx;
                    imgData.y = startTop + dy;
                    el.style.left = `${imgData.x}px`;
                    el.style.top = `${imgData.y}px`;
                    if (this.state.selectedImageId === imgData.id) {
                        this.updatePropsDisplay();
                        this.positionContextMenu(imgData.id);
                    }
                } else if (isResizing) {
                    const aspect = imgData.aspectRatio;
                    imgData.width = Math.max(50, startW + dx);
                    imgData.height = imgData.width * aspect;
                    el.style.width = `${imgData.width}px`;
                    el.style.height = `${imgData.height}px`;
                    if (this.state.selectedImageId === imgData.id) {
                        this.updatePropsDisplay();
                        this.positionContextMenu(imgData.id);
                    }
                }
            };

            const onMouseUp = () => {
                isDragging = false;
                isResizing = false;
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    // ==================== UNITS CONVERSION ====================

    convertPxToUnit(px, unit) {
        if (!px) return 0;
        switch (unit) {
            case "cm": return px / 37.795;
            case "mm": return px / 3.7795;
            case "in": return px / 96;
            default: return px;
        }
    }

    convertUnitToPx(val, unit) {
        if (!val) return 0;
        switch (unit) {
            case "cm": return val * 37.795;
            case "mm": return val * 3.7795;
            case "in": return val * 96;
            default: return val;
        }
    }

    // ==================== SELECTION & CONTEXT MENU ====================

    updatePropsDisplay() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        if (!imgData) return;

        const u = this.state.currentUnit;
        const precision = u === "px" ? 0 : 2;

        this.propWidth.value = this.convertPxToUnit(imgData.width, u).toFixed(precision);
        this.propHeight.value = this.convertPxToUnit(imgData.height, u).toFixed(precision);
        this.propX.value = this.convertPxToUnit(imgData.x, u).toFixed(precision);
        this.propY.value = this.convertPxToUnit(imgData.y, u).toFixed(precision);
    }

    selectImage(id) {
        this.state.selectedImageId = id;
        document.querySelectorAll(".placed-image").forEach(el => {
            el.classList.toggle("selected", el.id === id);
        });
        
        this.selectionTools.classList.toggle("hidden", !id);

        document.querySelectorAll(".image-thumb").forEach(t => t.classList.remove("active"));

        if (id) {
            const imgData = this.state.images.find(img => img.id === id);
            if (!imgData) return;
            
            this.state.activePageId = imgData.pageId;

            this.updatePropsDisplay();
            this.propRotation.value = imgData.rotation;
            this.propFilter.value = imgData.filter;
            this.propPolaroid.checked = imgData.polaroid;
            this.propCaption.value = imgData.caption;
            this.propCaptionGroup.classList.toggle("hidden", !imgData.polaroid);

            const idx = this.state.images.indexOf(imgData);
            const thumbs = document.querySelectorAll("#image-list .image-thumb");
            if (thumbs[idx]) thumbs[idx].classList.add("active");

            // Mostrar y posicionar menú contextual
            this.contextMenu.classList.remove("hidden");
            this.positionContextMenu(id);
        } else {
            this.closeContextMenu();
        }
    }

    positionContextMenu(imageId) {
        const el = document.getElementById(imageId);
        if (!el || this.contextMenu.classList.contains("hidden")) return;

        // Calcular posición en pantalla basada en el elemento y el zoom
        const rect = el.getBoundingClientRect();
        
        let menuX = rect.right + 20;
        let menuY = rect.top;

        // Evitar que se salga de la pantalla por la derecha
        if (menuX + 300 > window.innerWidth) {
            menuX = rect.left - 300;
        }

        // Evitar que se salga por abajo
        if (menuY + this.contextMenu.offsetHeight > window.innerHeight) {
            menuY = window.innerHeight - this.contextMenu.offsetHeight - 20;
        }
        
        // Evitar que se salga por arriba
        if (menuY < 20) menuY = 20;

        this.contextMenu.style.left = `${menuX}px`;
        this.contextMenu.style.top = `${menuY}px`;
    }

    closeContextMenu() {
        this.contextMenu.classList.add("hidden");
    }

    updateImageFromProps(prop) {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        if (!imgData || !el) return;

        const u = this.state.currentUnit;

        switch (prop) {
            case "width": {
                const inputVal = parseFloat(this.propWidth.value);
                if (isNaN(inputVal)) return;
                const newWidth = Math.max(10, this.convertUnitToPx(inputVal, u));
                imgData.width = newWidth;
                if (this.state.lockAspect) {
                    imgData.height = newWidth * imgData.aspectRatio;
                    this.propHeight.value = this.convertPxToUnit(imgData.height, u).toFixed(u === 'px' ? 0 : 2);
                }
                el.style.width = `${imgData.width}px`;
                el.style.height = imgData.polaroid ? "auto" : `${imgData.height}px`;
                break;
            }
            case "height": {
                const inputVal = parseFloat(this.propHeight.value);
                if (isNaN(inputVal)) return;
                const newHeight = Math.max(10, this.convertUnitToPx(inputVal, u));
                imgData.height = newHeight;
                if (this.state.lockAspect) {
                    imgData.width = newHeight / imgData.aspectRatio;
                    this.propWidth.value = this.convertPxToUnit(imgData.width, u).toFixed(u === 'px' ? 0 : 2);
                }
                el.style.width = `${imgData.width}px`;
                el.style.height = imgData.polaroid ? "auto" : `${imgData.height}px`;
                break;
            }
            case "x": {
                const inputVal = parseFloat(this.propX.value);
                if (isNaN(inputVal)) return;
                imgData.x = this.convertUnitToPx(inputVal, u);
                el.style.left = `${imgData.x}px`;
                break;
            }
            case "y": {
                const inputVal = parseFloat(this.propY.value);
                if (isNaN(inputVal)) return;
                imgData.y = this.convertUnitToPx(inputVal, u);
                el.style.top = `${imgData.y}px`;
                break;
            }
            case "rotation":
                imgData.rotation = parseInt(this.propRotation.value) || 0;
                el.querySelector("img").style.transform = `rotate(${imgData.rotation}deg)`;
                break;
            case "filter":
                imgData.filter = this.propFilter.value;
                this.applyFilter(el, imgData.filter);
                break;
            case "polaroid":
                imgData.polaroid = this.propPolaroid.checked;
                this.applyPolaroid(el, imgData);
                this.propCaptionGroup.classList.toggle("hidden", !imgData.polaroid);
                break;
            case "caption":
                imgData.caption = this.propCaption.value;
                el.querySelector(".polaroid-caption").innerText = imgData.caption;
                break;
        }
        
        // Reposicionar menú si cambió tamaño
        if (prop === 'width' || prop === 'height') {
            this.positionContextMenu(this.state.selectedImageId);
        }
    }

    applyFilter(el, filterName) {
        const img = el.querySelector("img");
        FILTER_OPTIONS.forEach(f => img.classList.remove(`filter-${f}`));
        img.classList.add(`filter-${filterName}`);
    }

    applyPolaroid(el, imgData) {
        const caption = el.querySelector(".polaroid-caption");
        el.classList.toggle("polaroid", imgData.polaroid);
        caption.classList.toggle("hidden", !imgData.polaroid);

        if (imgData.polaroid) {
            el.style.height = "auto";
        } else {
            el.style.height = `${imgData.height}px`;
        }
    }

    // ==================== FORMAT COPY/PASTE ====================

    copyFormat() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        if (!imgData) return;

        this.state.copiedFormat = {
            width: imgData.width,
            filter: imgData.filter,
            polaroid: imgData.polaroid,
            caption: imgData.caption,
            rotation: imgData.rotation
        };

        this.btnPasteFormat.disabled = false;
        this.btnApplyAllFormat.disabled = false;
        this.btnCopyFormat.classList.add("has-format");
        this.btnPasteFormat.classList.add("has-format");
        this.btnApplyAllFormat.classList.add("has-format");
        this.showToast("Formato copiado", "success");
    }

    pasteFormat() {
        if (!this.state.copiedFormat || !this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        if (!imgData) return;
        this.applyFormatToImage(imgData);
        this.selectImage(imgData.id);
        this.showToast("Formato aplicado", "success");
    }

    applyFormatToAll() {
        if (!this.state.copiedFormat) return;
        if (this.state.images.length === 0) return;
        
        this.state.images.forEach(imgData => {
            this.applyFormatToImage(imgData);
        });

        if (this.state.selectedImageId) {
            this.selectImage(this.state.selectedImageId);
        }
        this.showToast(`Formato aplicado a ${this.state.images.length} imágenes`, "success");
    }

    applyFormatToImage(imgData) {
        const fmt = this.state.copiedFormat;
        const el = document.getElementById(imgData.id);
        if (!el || !fmt) return;

        imgData.width = fmt.width;
        imgData.height = fmt.width * imgData.aspectRatio;
        el.style.width = `${imgData.width}px`;

        imgData.filter = fmt.filter;
        this.applyFilter(el, imgData.filter);

        imgData.rotation = fmt.rotation;
        el.querySelector("img").style.transform = `rotate(${imgData.rotation}deg)`;

        imgData.polaroid = fmt.polaroid;
        imgData.caption = fmt.caption;
        this.applyPolaroid(el, imgData);
        el.querySelector(".polaroid-caption").innerText = imgData.caption;

        if (!imgData.polaroid) {
            el.style.height = `${imgData.height}px`;
        }
    }

    // ==================== CANVAS IMAGE ACTIONS ====================

    deleteSelected() {
        if (!this.state.selectedImageId) return;
        const el = document.getElementById(this.state.selectedImageId);
        if (el) el.remove();
        this.state.images = this.state.images.filter(img => img.id !== this.state.selectedImageId);
        this.selectImage(null);
        this.updateCanvasImagesUI();
        this.updateGalleryUI();
    }

    rotateSelected() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        imgData.rotation = (imgData.rotation + 90) % 360;
        el.querySelector("img").style.transform = `rotate(${imgData.rotation}deg)`;
        this.propRotation.value = imgData.rotation;
    }

    duplicateSelected() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        this.addImageToCanvas(imgData.src, imgData.pageId);
        
        const lastImg = this.state.images[this.state.images.length - 1];
        const el = document.getElementById(lastImg.id);
        
        lastImg.x = imgData.x + 20;
        lastImg.y = imgData.y + 20;
        lastImg.width = imgData.width;
        lastImg.rotation = imgData.rotation;
        lastImg.polaroid = imgData.polaroid;
        lastImg.caption = imgData.caption;
        lastImg.filter = imgData.filter;
        
        el.style.left = `${lastImg.x}px`;
        el.style.top = `${lastImg.y}px`;
        el.style.width = `${lastImg.width}px`;

        this.applyFilter(el, lastImg.filter);

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
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        const pageEl = document.getElementById(imgData.pageId);
        if (!pageEl) return;
        
        const canvasW = parseFloat(pageEl.style.width);
        const canvasH = parseFloat(pageEl.style.height);

        if (axis === "h") {
            imgData.x = (canvasW - el.offsetWidth) / 2;
            el.style.left = `${imgData.x}px`;
            this.propX.value = Math.round(imgData.x);
        } else {
            imgData.y = (canvasH - el.offsetHeight) / 2;
            el.style.top = `${imgData.y}px`;
            this.propY.value = Math.round(imgData.y);
        }
        this.positionContextMenu(imgData.id);
    }

    bringToFront() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        const pageEl = document.getElementById(imgData.pageId);
        if (pageEl) {
            pageEl.appendChild(el);
        }
    }

    clearAll() {
        if (confirm("¿Estás seguro de que deseas limpiar todas las páginas?")) {
            document.querySelectorAll(".print-canvas-page .placed-image").forEach(el => el.remove());
            this.state.images = [];
            
            // Volver a 1 sola página
            this.state.pages = [];
            this.pagesContainer.innerHTML = "";
            this.addPage();
            
            this.selectImage(null);
            this.updateCanvasImagesUI();
            this.updateGalleryUI();
        }
    }

    // ==================== UI UPDATES ====================

    updateCanvasImagesUI() {
        const list = document.getElementById("image-list");
        list.innerHTML = "";
        this.canvasCount.textContent = this.state.images.length;
        this.canvasEmpty.classList.toggle("hidden", this.state.images.length > 0);
        list.classList.toggle("hidden", this.state.images.length === 0);

        this.state.images.forEach(img => {
            const thumb = document.createElement("div");
            thumb.className = "image-thumb";
            if (img.id === this.state.selectedImageId) thumb.classList.add("active");
            thumb.innerHTML = `<img src="${img.src}">`;
            thumb.addEventListener("click", () => {
                // Hacer scroll a la página donde está la imagen
                const pageEl = document.getElementById(img.pageId);
                if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.selectImage(img.id);
            });
            list.appendChild(thumb);
        });
    }

    // ==================== PDF EXPORT ====================

    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        this.selectImage(null); 

        if (this.state.pages.length === 0) return;

        const loadingBtn = this.exportBtn;
        const originalText = loadingBtn.innerHTML;
        loadingBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
        loadingBtn.disabled = true;

        try {
            const originalZoom = this.state.zoom;
            this.state.zoom = 1;
            this.applyZoom();
            
            // Ocultar guías y controles temporalmente
            document.querySelectorAll(".margin-guide, .page-controls").forEach(el => el.style.display = "none");
            
            await new Promise(r => setTimeout(r, 600));

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

            const pdf = new jsPDF({
                orientation: this.state.orientation,
                unit: "cm",
                format: [w, h],
                putOnlyUsedFonts: true,
                floatPrecision: 16
            });

            // Procesar cada página secuencialmente
            for (let i = 0; i < this.state.pages.length; i++) {
                const pageEl = document.getElementById(this.state.pages[i]);
                
                const canvas = await html2canvas(pageEl, {
                    scale: 3, // Reducido a 3 para evitar problemas de memoria/VRAM que causan renders lavados
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    onclone: (clonedDoc) => {
                        const clonedPage = clonedDoc.getElementById(this.state.pages[i]);
                        clonedPage.style.boxShadow = "none";
                        clonedPage.style.background = "#ffffff";
                        
                        // Eliminar elementos no deseados explícitamente en el clon
                        clonedPage.querySelectorAll('.margin-guide').forEach(el => el.remove());
                        clonedPage.querySelectorAll('.page-controls').forEach(el => el.remove());
                        clonedPage.querySelectorAll('.page-label').forEach(el => el.remove());
                    }
                });

                // Usar JPEG al 95% en lugar de PNG para evitar bugs de jsPDF con el canal Alpha (transparencias fantasma)
                const imgData = canvas.toDataURL("image/jpeg", 0.98);
                
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, "JPEG", 0, 0, w, h);
            }

            pdf.save(`PrintMaster_${this.state.paperSize}_${Date.now()}.pdf`);

        } catch (err) {
            console.error(err);
            alert("Error al generar el PDF.");
        } finally {
            document.querySelectorAll(".margin-guide").forEach(el => el.style.display = "block");
            document.querySelectorAll(".page-controls").forEach(el => el.style.display = "flex");
            
            this.state.zoom = originalZoom;
            this.applyZoom();
            
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.app = new PrintApp();
});
