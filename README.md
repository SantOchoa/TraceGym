# TraceGym — Gimnasio de Trazado Mental para Estudiantes de Sistemas 🧠⚡

> *«Entrena la mente para predecir código sin correrlo en el compilador.»*

**TraceGym** es una herramienta web interactiva diseñada para estudiantes de semestres intermedios de Ingeniería de Sistemas (Programación II, Estructuras de Datos en Python). Permite entrenar el razonamiento deductivo y la predicción en papel de fragmentos de código, identificando puntos ciegos antes de parciales escritos.

---

## 🎯 Problema Pedagógico
En los parciales universitarios de programación presenciales, los profesores evalúan:
* *¿Qué imprime exactamente este código?*
* Errores sutiles como *off-by-one*, mutaciones *in-place* no deseadas, paso por referencia vs copias superficiales, o argumentos mutables por defecto cuestan valiosos puntos.
* Practicar en un IDE ejecutando el código elimina el esfuerzo mental que se debe entrenar.
* TraceGym resuelve esto forzando la **predicción manual** y contrastándola con **Python compilado a WebAssembly (Pyodide)** sin depender de APIs de pago ni servidores externos.

---

## 🚀 Funcionalidades Principales

1. **Generador de Retos de Predicción:**
   * **6 Conceptos Clave:** Recursión, Slicing, Alias de Listas, Ámbito de Variables (LEGB), Bucles Anidados y Argumentos Mutables por Defecto.
   * **3 Niveles:** Básico, Medio y Avanzado.
   * **Banco de 42 Retos:** Fragmentos representativos de parciales universitarios.
   * **Motor de Mutaciones AST:** Aplica una sola mutación sutil (operadores, cotas de `range`, rebanadas, referencias). Descarta mutantes inválidos o con salida idéntica.
   * **Soporte para Código Propio:** Pega tu propio código (hasta 40 líneas) para mutarlo y evaluarlo en caliente.

2. **Predecir Antes de Ver:**
   * Campo para escribir la salida exacta por consola.
   * Traza opcional de variables por iteración.
   * **2 Pistas Progresivas:**
     * Pista 1: Concepto involucrado (-25 pts).
     * Pista 2: Línea sospechosa (-25 pts).

3. **Verificar y Ver el Porqué:**
   * **Pyodide WebAssembly:** Ejecución 100% en el navegador con límite de seguridad de 5 segundos.
   * **Comparación Línea a Línea:** Contraste visual entre predicción y salida física.
   * **Depurador Mental Paso a Paso:** Controles de paso anterior, siguiente, auto-play y visualización del diccionario de variables locales e impresiones acumuladas.
   * **Diff Visual:** Resalta la línea divergente del mutante vs código base.
   * **Explicación Pedagógica:** Análisis de la trampa sintáctica y mental típica de examen.

4. **Mapa de Puntos Ciegos & Repetición Espaciada:**
   * **Métricas Locales:** Precisión por concepto, intentos y tasa global en `localStorage` (100% privado).
   * **Algoritmo de Repetición Espaciada (1, 3 y 7 días):** El botón *«Repasar»* prioriza automáticamente los conceptos fallados.
   * **Modo Sesión 20 Minutos:** Batería express de 5 retos contra reloj simulando la presión de un parcial presencial.

---

## 🎨 Diseño & Estética
* **Tema Claro Ultra-Minimalista:** Fondo blanco y gris cálido (`#FAFAFA` y `#FFFFFF`), bordes sutiles y textos negro carbón (`#0A0A0A`).
* **Tipografía Inter:** Interfaz con escala refinada (15px) y espaciado limpio.
* **Acentos en Rojo Brillante:** `#FF0033` con animaciones táctiles elásticas (`active:scale-95`).
* **Regla Estricta:** Todo texto en rojo se presenta en tipografía cursiva elegante (*Cormorant Garamond* / *Playfair Display* itálica).

---

## 🛠️ Tecnologías Utilizadas
* **Frontend:** React 19 + TypeScript + Vite
* **Estilos:** Tailwind CSS v4
* **Motor Python:** Pyodide WebAssembly (Python 3.12 en navegador)
* **Iconos:** Lucide React
* **Efectos:** Canvas Confetti

---

## 💻 Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/SantOchoa/TraceGym.git
cd TraceGym

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Construir para producción
npm run build
```

---

## 📄 Licencia
Proyecto académico y pedagógico desarrollado para la formación en Ingeniería de Sistemas.
