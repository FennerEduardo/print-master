// ========== FILTERS ==========
const FILTERS = [
    { name: "Normal", css: "none" },
    { name: "B/N", css: "grayscale(100%)" },
    { name: "Sepia", css: "sepia(80%)" },
    { name: "Vintage", css: "sepia(40%) contrast(90%) brightness(95%)" },
    { name: "Cálido", css: "saturate(130%) hue-rotate(-10deg)" },
    { name: "Frío", css: "saturate(110%) hue-rotate(20deg) brightness(105%)" },
    { name: "Alto Contraste", css: "contrast(150%) brightness(105%)" },
    { name: "Dramático", css: "contrast(130%) brightness(80%) saturate(120%)" },
    { name: "Fade", css: "contrast(80%) brightness(115%) saturate(80%)" },
    { name: "Invertir", css: "invert(100%)" }
];

// ========== CROP MANAGER ==========
class CropManager {
    constructor() {
        this.modal = document.getElementById("crop-modal");
        this.canvas = document.getElementById("crop-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.selection = document.getElementById("crop-selection");
        this.callback = null;
        this.img = null;
        this.crop = { x: 0, y: 0, w: 0, h: 0 };
        this.scale = 1;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = { x: 0, y: 0 };
        this.initEvents();
    }

    initEvents() {
        document.getElementById("crop-cancel").onclick = () => this.close();
        document.getElementById("crop-reset").onclick = () => this.resetSelection();
        document.getElementById("crop-apply").onclick = () => this.apply();
        this.selection.addEventListener("mousedown", (e) => this.startDrag(e));
        document.addEventListener("mousemove", (e) => this.onDrag(e));
        document.addEventListener("mouseup", () => this.stopDrag());
    }

    open(src, cb) {
        this.callback = cb;
        this.modal.classList.remove("hidden");
        this.img = new Image();
        this.img.onload = () => {
            const maxW = 600, maxH = 400;
            this.scale = Math.min(maxW / this.img.naturalWidth, maxH / this.img.naturalHeight, 1);
            this.canvas.width = this.img.naturalWidth * this.scale;
            this.canvas.height = this.img.naturalHeight * this.scale;
            this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
            this.resetSelection();
        };
        this.img.src = src;
    }

    resetSelection() {
        const p = 0.1;
        this.crop = {
            x: this.canvas.width * p, y: this.canvas.height * p,
            w: this.canvas.width * (1 - 2 * p), h: this.canvas.height * (1 - 2 * p)
        };
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        const s = this.selection;
        s.style.left = this.crop.x + "px";
        s.style.top = this.crop.y + "px";
        s.style.width = this.crop.w + "px";
        s.style.height = this.crop.h + "px";
    }

    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        const rect = this.selection.getBoundingClientRect();
        this.dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    onDrag(e) {
        if (!this.isDragging) return;
        const wrap = this.canvas.getBoundingClientRect();
        let nx = e.clientX - wrap.left - this.dragStart.x;
        let ny = e.clientY - wrap.top - this.dragStart.y;
        nx = Math.max(0, Math.min(nx, this.canvas.width - this.crop.w));
        ny = Math.max(0, Math.min(ny, this.canvas.height - this.crop.h));
        this.crop.x = nx;
        this.crop.y = ny;
        this.updateSelectionUI();
    }

    stopDrag() { this.isDragging = false; }

    apply() {
        const sx = this.crop.x / this.scale, sy = this.crop.y / this.scale;
        const sw = this.crop.w / this.scale, sh = this.crop.h / this.scale;
        const out = document.createElement("canvas");
        out.width = sw; out.height = sh;
        out.getContext("2d").drawImage(this.img, sx, sy, sw, sh, 0, 0, sw, sh);
        const dataUrl = out.toDataURL("image/png");
        if (this.callback) this.callback(dataUrl);
        this.close();
    }

    close() { this.modal.classList.add("hidden"); }
}

// ========== FILTER MANAGER ==========
class FilterManager {
    constructor() {
        this.modal = document.getElementById("filter-modal");
        this.preview = document.getElementById("filter-preview");
        this.grid = document.getElementById("filter-grid");
        this.brightness = document.getElementById("filter-brightness");
        this.contrast = document.getElementById("filter-contrast");
        this.saturate = document.getElementById("filter-saturate");
        this.callback = null;
        this.currentFilter = "none";
        this.src = "";
        this.initEvents();
    }

    initEvents() {
        document.getElementById("filter-cancel").onclick = () => this.close();
        document.getElementById("filter-reset").onclick = () => this.reset();
        document.getElementById("filter-apply").onclick = () => this.apply();
        [this.brightness, this.contrast, this.saturate].forEach(s => {
            s.addEventListener("input", () => this.updatePreview());
        });
    }

    open(src, currentFilter, cb) {
        this.src = src;
        this.callback = cb;
        this.preview.src = src;
        this.currentFilter = currentFilter || "none";
        this.brightness.value = 100;
        this.contrast.value = 100;
        this.saturate.value = 100;
        this.modal.classList.remove("hidden");
        this.renderGrid();
        this.updatePreview();
    }

    renderGrid() {
        this.grid.innerHTML = "";
        FILTERS.forEach(f => {
            const item = document.createElement("div");
            item.className = "filter-item" + (this.currentFilter === f.css ? " active" : "");
            item.innerHTML = `<img src="${this.src}" style="filter:${f.css}"><span>${f.name}</span>`;
            item.onclick = () => {
                this.currentFilter = f.css;
                this.grid.querySelectorAll(".filter-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                this.updatePreview();
            };
            this.grid.appendChild(item);
        });
    }

    updatePreview() {
        const b = this.brightness.value, c = this.contrast.value, s = this.saturate.value;
        const adjust = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
        const base = this.currentFilter === "none" ? "" : this.currentFilter;
        this.preview.style.filter = base ? `${base} ${adjust}` : adjust;
    }

    getFilterString() {
        const b = this.brightness.value, c = this.contrast.value, s = this.saturate.value;
        const adjust = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
        const base = this.currentFilter === "none" ? "" : this.currentFilter;
        return base ? `${base} ${adjust}` : adjust;
    }

    apply() {
        if (this.callback) this.callback(this.getFilterString());
        this.close();
    }

    reset() {
        this.currentFilter = "none";
        this.brightness.value = 100;
        this.contrast.value = 100;
        this.saturate.value = 100;
        this.renderGrid();
        this.updatePreview();
    }

    close() { this.modal.classList.add("hidden"); }
}
