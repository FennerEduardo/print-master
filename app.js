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
            images: [],
            selectedImageId: null
        };

        this.initElements();
        this.initEvents();
        this.updateCanvas();
    }

    initElements() {
        this.canvas = document.getElementById("print-canvas");
        this.canvasWrapper = document.getElementById("canvas-wrapper");
        this.marginGuide = document.getElementById("margin-guide");
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
    }

    initEvents() {
        this.paperSizeSelect.addEventListener("change", (e) => {
            this.state.paperSize = e.target.value;
            this.customSizeControls.classList.toggle("hidden", e.target.value !== "custom");
            this.updateCanvas();
        });

        [this.customWidthInput, this.customHeightInput].forEach(el => {
            el.addEventListener("input", () => {
                this.state.customWidth = parseFloat(this.customWidthInput.value) || 0;
                this.state.customHeight = parseFloat(this.customHeightInput.value) || 0;
                this.updateCanvas();
            });
        });

        this.btnPortrait.addEventListener("click", () => {
            this.state.orientation = "portrait";
            this.btnPortrait.classList.add("active");
            this.btnLandscape.classList.remove("active");
            this.updateCanvas();
        });

        this.btnLandscape.addEventListener("click", () => {
            this.state.orientation = "landscape";
            this.btnLandscape.classList.add("active");
            this.btnPortrait.classList.remove("active");
            this.updateCanvas();
        });

        this.marginInput.addEventListener("input", (e) => {
            this.state.margin = parseInt(e.target.value);
            this.marginDisplay.innerText = `${this.state.margin} mm`;
            this.updateCanvas();
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
        this.btnPolaroid.addEventListener("click", () => this.togglePolaroid());
        
        this.polaroidTextInput.addEventListener("input", (e) => {
            this.updatePolaroidText(e.target.value);
        });

        this.resetBtn.addEventListener("click", () => this.clearAll());
        this.exportBtn.addEventListener("click", () => this.exportToPDF());

        this.canvas.addEventListener("mousedown", (e) => {
            if (e.target === this.canvas || e.target === this.marginGuide) {
                this.selectImage(null);
            }
        });
    }

    updateCanvas() {
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

        const ratio = 37.795;
        this.canvas.style.width = `${w * ratio}px`;
        this.canvas.style.height = `${h * ratio}px`;

        this.marginGuide.style.top = `${this.state.margin}mm`;
        this.marginGuide.style.left = `${this.state.margin}mm`;
        this.marginGuide.style.right = `${this.state.margin}mm`;
        this.marginGuide.style.bottom = `${this.state.margin}mm`;

        this.fitCanvasToScreen();
    }

    fitCanvasToScreen() {
        const areaWidth = document.querySelector(".canvas-area").clientWidth - 100;
        const areaHeight = document.querySelector(".canvas-area").clientHeight - 100;
        const canvasWidth = parseFloat(this.canvas.style.width);
        const canvasHeight = parseFloat(this.canvas.style.height);

        const scale = Math.min(areaWidth / canvasWidth, areaHeight / canvasHeight, 1);
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
        Array.from(files).forEach(file => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => this.addImage(e.target.result);
                reader.readAsDataURL(file);
            }
        });
    }

    addImage(src) {
        const id = "img-" + Date.now() + Math.random().toString(36).substr(2, 5);
        const imgObj = {
            id,
            src,
            x: 50,
            y: 50,
            width: 250,
            height: 250,
            rotation: 0,
            polaroid: false,
            caption: "Recuerdo"
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
        this.canvas.appendChild(div);
        this.state.images.push(imgObj);
        
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
                    imgData.x = startLeft + dx;
                    imgData.y = startTop + dy;
                    el.style.left = `${imgData.x}px`;
                    el.style.top = `${imgData.y}px`;
                } else if (isResizing) {
                    const aspect = startH / startW;
                    imgData.width = Math.max(50, startW + dx);
                    imgData.height = imgData.width * aspect;
                    el.style.width = `${imgData.width}px`;
                    el.style.height = `${imgData.height}px`;
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

    selectImage(id) {
        this.state.selectedImageId = id;
        document.querySelectorAll(".placed-image").forEach(el => {
            el.classList.toggle("selected", el.id === id);
        });
        this.selectionTools.classList.toggle("hidden", !id);
        
        if (id) {
            const imgData = this.state.images.find(img => img.id === id);
            this.btnPolaroid.classList.toggle("active", imgData.polaroid);
            this.polaroidTextInput.classList.toggle("hidden", !imgData.polaroid);
            this.polaroidTextInput.value = imgData.caption;
        }
    }

    togglePolaroid() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
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
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        imgData.caption = text;
        const el = document.getElementById(this.state.selectedImageId);
        const caption = el.querySelector(".polaroid-caption");
        caption.innerText = text;
    }

    deleteSelected() {
        if (!this.state.selectedImageId) return;
        const el = document.getElementById(this.state.selectedImageId);
        if (el) el.remove();
        this.state.images = this.state.images.filter(img => img.id !== this.state.selectedImageId);
        this.selectImage(null);
        this.updateThumbnails();
    }

    rotateSelected() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        imgData.rotation = (imgData.rotation + 90) % 360;
        
        const img = el.querySelector("img");
        img.style.transform = `rotate(${imgData.rotation}deg)`;
    }

    duplicateSelected() {
        if (!this.state.selectedImageId) return;
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        this.addImage(imgData.src);
        
        const lastImg = this.state.images[this.state.images.length - 1];
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
        const imgData = this.state.images.find(img => img.id === this.state.selectedImageId);
        const el = document.getElementById(this.state.selectedImageId);
        const canvasW = parseFloat(this.canvas.style.width);
        const canvasH = parseFloat(this.canvas.style.height);

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
        this.canvas.appendChild(el);
    }

    clearAll() {
        if (confirm("¿Estás seguro de que deseas limpiar todo el lienzo?")) {
            this.canvas.querySelectorAll(".placed-image").forEach(el => el.remove());
            this.state.images = [];
            this.selectImage(null);
            this.updateThumbnails();
        }
    }

    updateThumbnails() {
        const list = document.getElementById("image-list");
        list.innerHTML = "";
        this.state.images.forEach(img => {
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
        loadingBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
        loadingBtn.disabled = true;

        try {
            // Fix: Hide guide and ensure high resolution without dark mode artifacts
            const originalZoom = this.state.zoom;
            this.state.zoom = 1;
            this.applyZoom();

            // Create a temporary clone for cleaner capture if needed, 
            // but for now we just hide the guide
            this.marginGuide.style.display = "none";
            
            // Wait for any animations to settle
            await new Promise(r => setTimeout(r, 600));

            const canvas = await html2canvas(this.canvas, {
                scale: 4, // Even higher resolution
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedCanvas = clonedDoc.getElementById("print-canvas");
                    clonedCanvas.style.boxShadow = "none";
                    clonedCanvas.style.background = "#ffffff";
                    // Ensure images are fully opaque
                    clonedCanvas.querySelectorAll(".placed-image").forEach(img => {
                        img.style.animation = "none";
                        img.style.opacity = "1";
                    });
                }
            });

            this.marginGuide.style.display = "block";
            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            
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

            // Create PDF with custom size in CM
            const pdf = new jsPDF({
                orientation: this.state.orientation,
                unit: "cm",
                format: [w, h],
                putOnlyUsedFonts: true,
                floatPrecision: 16
            });

            pdf.addImage(imgData, "JPEG", 0, 0, w, h, undefined, 'FAST');
            pdf.save(`PrintMaster_${this.state.paperSize}_${Date.now()}.pdf`);

            this.state.zoom = originalZoom;
            this.applyZoom();
        } catch (err) {
            console.error(err);
            alert("Error al generar el PDF.");
            this.marginGuide.style.display = "block";
        } finally {
            loadingBtn.innerHTML = originalText;
            loadingBtn.disabled = false;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.app = new PrintApp();
});
