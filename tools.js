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
        this.action = null; // 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
        this.dragStart = { x: 0, y: 0 };
        this.cropStart = { x: 0, y: 0, w: 0, h: 0 };
        this.initEvents();
    }

    initEvents() {
        document.getElementById("crop-cancel").onclick = () => this.close();
        document.getElementById("crop-reset").onclick = () => this.resetSelection();
        document.getElementById("crop-apply").onclick = () => this.apply();

        this.selection.addEventListener("mousedown", (e) => {
            e.preventDefault();
            const handle = e.target.closest(".crop-handle");
            if (handle) {
                this.action = "resize-" + handle.dataset.corner;
            } else {
                this.action = "move";
            }
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.cropStart = { ...this.crop };
            document.addEventListener("mousemove", this._onDrag);
            document.addEventListener("mouseup", this._onUp);
        });

        this._onDrag = (e) => this.onDrag(e);
        this._onUp = () => this.stopDrag();
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
            this.addHandles();
        };
        this.img.src = src;
    }

    addHandles() {
        this.selection.querySelectorAll(".crop-handle").forEach(h => h.remove());
        ["tl", "tr", "bl", "br"].forEach(corner => {
            const h = document.createElement("div");
            h.className = `crop-handle ${corner}`;
            h.dataset.corner = corner;
            this.selection.appendChild(h);
        });
    }

    resetSelection() {
        const p = 0.05;
        this.crop = {
            x: this.canvas.width * p,
            y: this.canvas.height * p,
            w: this.canvas.width * (1 - 2 * p),
            h: this.canvas.height * (1 - 2 * p)
        };
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        this.selection.style.left = this.crop.x + "px";
        this.selection.style.top = this.crop.y + "px";
        this.selection.style.width = Math.max(30, this.crop.w) + "px";
        this.selection.style.height = Math.max(30, this.crop.h) + "px";
    }

    onDrag(e) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        const cw = this.canvas.width, ch = this.canvas.height;

        if (this.action === "move") {
            let nx = this.cropStart.x + dx;
            let ny = this.cropStart.y + dy;
            nx = Math.max(0, Math.min(nx, cw - this.crop.w));
            ny = Math.max(0, Math.min(ny, ch - this.crop.h));
            this.crop.x = nx;
            this.crop.y = ny;
        } else if (this.action && this.action.startsWith("resize-")) {
            const corner = this.action.replace("resize-", "");
            let { x, y, w, h } = this.cropStart;

            if (corner === "br") {
                w = Math.max(30, w + dx);
                h = Math.max(30, h + dy);
            } else if (corner === "bl") {
                const newX = x + dx;
                w = Math.max(30, w - dx);
                h = Math.max(30, h + dy);
                if (w > 30) this.crop.x = newX;
            } else if (corner === "tr") {
                const newY = y + dy;
                w = Math.max(30, w + dx);
                h = Math.max(30, h - dy);
                if (h > 30) this.crop.y = newY;
            } else if (corner === "tl") {
                const newX = x + dx;
                const newY = y + dy;
                w = Math.max(30, w - dx);
                h = Math.max(30, h - dy);
                if (w > 30) this.crop.x = newX;
                if (h > 30) this.crop.y = newY;
            }

            // Clamp to canvas
            if (this.crop.x < 0) { w += this.crop.x; this.crop.x = 0; }
            if (this.crop.y < 0) { h += this.crop.y; this.crop.y = 0; }
            w = Math.min(w, cw - this.crop.x);
            h = Math.min(h, ch - this.crop.y);

            this.crop.w = w;
            this.crop.h = h;
        }

        this.updateSelectionUI();
    }

    stopDrag() {
        this.action = null;
        document.removeEventListener("mousemove", this._onDrag);
        document.removeEventListener("mouseup", this._onUp);
    }

    apply() {
        const sx = this.crop.x / this.scale, sy = this.crop.y / this.scale;
        const sw = this.crop.w / this.scale, sh = this.crop.h / this.scale;
        const out = document.createElement("canvas");
        out.width = sw; out.height = sh;
        out.getContext("2d").drawImage(this.img, sx, sy, sw, sh, 0, 0, sw, sh);
        if (this.callback) this.callback(out.toDataURL("image/png"));
        this.close();
    }

    close() {
        this.modal.classList.add("hidden");
        this.stopDrag();
    }
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
        this.currentFilter = (currentFilter && currentFilter !== "none") ? currentFilter : "none";
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
        this.preview.style.filter = this.getFilterString();
    }

    getFilterString() {
        const b = this.brightness.value, c = this.contrast.value, s = this.saturate.value;
        const adjust = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
        const base = this.currentFilter === "none" ? "" : this.currentFilter;
        return base ? `${base} ${adjust}` : adjust;
    }

    apply() {
        const result = this.getFilterString();
        if (this.callback) this.callback(result);
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
