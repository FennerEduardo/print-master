# PrintMaster 🖨️

> **[Español](#español)** | **[English](#english)**

---

## Español

**PrintMaster** es una aplicación web interactiva (SPA) diseñada para la configuración precisa de imágenes para impresión profesional. Permite a los usuarios organizar layouts complejos en diversos tamaños de papel, desde formatos estándar de oficina hasta pliegos de gran formato, con herramientas de edición en tiempo real y exportación a PDF.

### 🚀 Funcionalidades

#### 📄 Configuración de Papel
- **Formatos Predefinidos:** Soporte para estándares de Colombia/Latam (Pliego, 1/2, 1/4, 1/8, Oficio CO), formatos Digitales/USA (Tabloide, Carta, Legal) y Serie ISO A (A0–A4).
- **Tamaños Personalizados:** Opción para definir dimensiones exactas en centímetros.
- **Orientación Dinámica:** Cambio instantáneo entre modo Vertical (Portrait) y Horizontal (Landscape).
- **Manejo de Márgenes:** Control deslizante para ajustar los márgenes de seguridad en milímetros.

#### 🖼️ Gestión de Imágenes
- **Carga Flexible:** Soporte para "Drag & Drop" (arrastrar y soltar) o selección tradicional de múltiples archivos.
- **Posicionamiento Inteligente:** Las imágenes importadas se colocan en cascada diagonal para facilitar su diferenciación visual.
- **Vista Previa:** Lista lateral de miniaturas para fácil acceso.

#### 📑 Múltiples Mesas de Trabajo
- **Gestión de Páginas:** Añade, elimina y navega entre múltiples páginas dentro del mismo proyecto.
- **Vista en Lista Vertical:** Las mesas de trabajo se organizan verticalmente con scroll suave para un flujo de trabajo continuo.
- **Arrastrar entre Páginas:** Mueve imágenes de una página a otra simplemente arrastrándolas sobre la mesa de trabajo destino.

#### 🎯 Guías de Alineación
- **Centrado Inteligente:** Guías visuales de color magenta aparecen automáticamente al acercarse al centro horizontal o vertical de la página.
- **Snapping a Márgenes:** Las imágenes se ajustan automáticamente a los márgenes de seguridad configurados.

#### 🎨 Edición en el Lienzo
- **Manipulación Directa:** Mueve y escala imágenes directamente sobre el lienzo de impresión.
- **Herramientas de Selección:**
  - **Centrado:** Botones para centrar horizontal y verticalmente.
  - **Efecto Polaroid:** Transforma cualquier imagen en una foto estilo Polaroid con pie de foto personalizable.
  - **Duplicación y Rotación:** Duplica elementos rápidamente o rótalos en incrementos de 90°.
  - **Gestión de Capas:** Trae elementos al frente para organizar superposiciones.
- **Zoom Interactivo:** Control de acercamiento/alejamiento para ajustes de precisión.

#### 📤 Exportación Profesional
- **Exportar a PDF Multi-página:** Genera un documento PDF de alta calidad con todas las mesas de trabajo del proyecto, listo para enviar a impresión.

### 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología |
|-----------|-----------|
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| **Tipografía** | Google Fonts (Outfit & Indie Flower) |
| **Iconografía** | Font Awesome 6 |
| **Renderizado** | [html2canvas](https://html2canvas.hertzen.com/) |
| **Generación PDF** | [jsPDF](https://parall.ax/products/jspdf) |

### 💻 Instalación y Uso

PrintMaster es una aplicación estática, por lo que no requiere de un proceso de construcción (build) complejo.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/fennereduardo/print-master.git
   cd print-master
   ```

2. **Abrir el proyecto:**
   Simplemente abre el archivo `index.html` en tu navegador preferido.

   > **Recomendación:** Para una mejor experiencia con la carga de archivos y recursos, usa un servidor local. Por ejemplo, la extensión **Live Server** en VS Code o ejecuta en terminal:
   > ```bash
   > python -m http.server
   > ```

### 📝 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo y mejorarlo.

---

## English

**PrintMaster** is an interactive web application (SPA) designed for precise image configuration for professional printing. It allows users to organize complex layouts on various paper sizes, from standard office formats to large-format sheets, with real-time editing tools and PDF export.

### 🚀 Features

#### 📄 Paper Configuration
- **Predefined Formats:** Support for Colombia/Latin America standards (Pliego, 1/2, 1/4, 1/8, Oficio CO), Digital/USA formats (Tabloid, Letter, Legal), and ISO A Series (A0–A4).
- **Custom Sizes:** Option to define exact dimensions in centimeters.
- **Dynamic Orientation:** Instant switch between Portrait and Landscape modes.
- **Margin Control:** Slider to adjust safety margins in millimeters.

#### 🖼️ Image Management
- **Flexible Upload:** Drag & Drop support or traditional multi-file selection.
- **Smart Positioning:** Imported images are placed in a diagonal cascade for easy visual differentiation.
- **Preview:** Sidebar thumbnail list for quick access.

#### 📑 Multiple Artboards
- **Page Management:** Add, remove, and navigate between multiple pages within the same project.
- **Vertical List View:** Artboards are organized vertically with smooth scrolling for a continuous workflow.
- **Cross-Page Drag:** Move images from one page to another by simply dragging them onto the target artboard.

#### 🎯 Alignment Guides
- **Smart Centering:** Magenta visual guides appear automatically when approaching the horizontal or vertical center of the page.
- **Margin Snapping:** Images automatically snap to the configured safety margins.

#### 🎨 Canvas Editing
- **Direct Manipulation:** Move and scale images directly on the print canvas.
- **Selection Tools:**
  - **Centering:** Buttons for horizontal and vertical centering.
  - **Polaroid Effect:** Transform any image into a Polaroid-style photo with customizable caption.
  - **Duplication & Rotation:** Quickly duplicate elements or rotate them in 90° increments.
  - **Layer Management:** Bring elements to front to organize overlaps.
- **Interactive Zoom:** Zoom in/out controls for precision adjustments.

#### 📤 Professional Export
- **Multi-page PDF Export:** Generate a high-quality PDF document with all project artboards, ready for printing.

### 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| **Typography** | Google Fonts (Outfit & Indie Flower) |
| **Icons** | Font Awesome 6 |
| **Rendering** | [html2canvas](https://html2canvas.hertzen.com/) |
| **PDF Generation** | [jsPDF](https://parall.ax/products/jspdf) |

### 💻 Installation & Usage

PrintMaster is a static application — no complex build process required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fennereduardo/print-master.git
   cd print-master
   ```

2. **Open the project:**
   Simply open `index.html` in your preferred browser.

   > **Recommendation:** For a better experience with file loading and resources, use a local server. For example, the **Live Server** extension in VS Code, or run:
   > ```bash
   > python -m http.server
   > ```

### 📝 License

This project is open source. Feel free to use and improve it.

---

## ✍️ Autor / Author

**Fenner Eduardo González Castellanos**

🌐 [fennereduardo.com](https://fennereduardo.com)
