# PrintMaster 🖨️

**PrintMaster** es una aplicación web interactiva (SPA) diseñada para la configuración precisa de imágenes para impresión profesional. Permite a los usuarios organizar layouts complejos en diversos tamaños de papel, desde formatos estándar de oficina hasta pliegos de gran formato, con herramientas de edición en tiempo real y exportación a PDF.

## 🚀 Funcionalidades

### 📄 Configuración de Papel
- **Formatos Predefinidos:** Soporte para estándares de Colombia/Latam (Pliego, 1/2, 1/4, 1/8, Oficio CO), formatos Digitales/USA (Tabloide, Carta, Legal) y Serie ISO A (A0-A4).
- **Tamaños Personalizados:** Opción para definir dimensiones exactas en centímetros.
- **Orientación Dinámica:** Cambio instantáneo entre modo Vertical (Portrait) y Horizontal (Landscape).
- **Manejo de Márgenes:** Control deslizante para ajustar los márgenes de seguridad en milímetros.

### 🖼️ Gestión de Imágenes
- **Carga Flexible:** Soporte para "Drag & Drop" (arrastrar y soltar) o selección tradicional de múltiples archivos.
- **Vista Previa:** Lista lateral de imágenes cargadas para fácil acceso.

### 🎨 Edición en el Lienzo
- **Manipulación Directa:** Mueve y escala imágenes directamente sobre el lienzo de impresión.
- **Herramientas de Selección:**
  - **Centrado:** Botones para centrar horizontal y verticalmente.
  - **Efecto Polaroid:** Transforma cualquier imagen en una foto estilo Polaroid con pie de foto personalizable.
  - **Duplicación y Rotación:** Duplica elementos rápidamente o rótalos en incrementos de 90°.
  - **Gestión de Capas:** Trae elementos al frente para organizar superposiciones.
- **Zoom Interactivo:** Control de acercamiento/alejamiento para ajustes de precisión.

### 📤 Exportación Profesional
- **Exportar a PDF:** Genera un documento PDF de alta calidad manteniendo el layout configurado, listo para enviar a impresión.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Tipografía:** Google Fonts (Outfit & Indie Flower).
- **Iconografía:** Font Awesome 6.
- **Librerías Externas:**
  - [html2canvas](https://html2canvas.hertzen.com/) para el renderizado del lienzo.
  - [jsPDF](https://parall.ax/products/jspdf) para la generación del documento PDF.

## 💻 Instalación y Uso

PrintMaster es una aplicación estática, por lo que no requiere de un proceso de construcción (build) complejo.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/print-master.git
   cd print-master
   ```

2. **Abrir el proyecto:**
   - Simplemente abre el archivo `index.html` en tu navegador preferido.
   - **Recomendación:** Para una mejor experiencia con la carga de archivos y recursos, se recomienda usar un servidor local (por ejemplo, la extensión "Live Server" en VS Code o ejecutando `python -m http.server` en la terminal).

## 📝 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo y mejorarlo.
