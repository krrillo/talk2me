# 🎓 Talk2Me

**Plataforma educativa interactiva de español para niños con hipoacusia neurosensorial bilateral**

Talk2Me es una aplicación web diseñada específicamente para niños de 6-12 años con pérdida auditiva leve a moderada.  
Utiliza inteligencia artificial para generar historias personalizadas y ejercicios educativos que se adaptan al nivel de cada estudiante, enfocándose en comprensión lectora, gramática y escritura.

---

## ✨ Características Principales

### 🎯 Sistema Educativo Adaptativo
- 10 niveles progresivos (50-500+ palabras por historia)
- Validación pedagógica de 3 capas: gramática, coherencia y alineación pedagógica
- Regeneración automática de ejercicios de baja calidad con feedback específico
- Ejercicios de respaldo validados manualmente para casos de fallo

### 🎮 Tipos de Ejercicios Interactivos
- **Arrastra palabras (drag_words):** Completar oraciones arrastrando la palabra correcta  
- **Ordena oraciones (order_sentence):** Reorganizar palabras para formar oraciones correctas  
- **Completa palabras (complete_words):** Escribir la palabra faltante en una oración  
- **Opción múltiple (multi_choice):** Preguntas de comprensión lectora  
- **Escritura libre (free_writing):** Respuestas abiertas con rúbrica de evaluación

### 🤖 Generación de Contenido con IA
- GPT-4o-mini para generación de historias y ejercicios educativos  
- DALL-E 3 para ilustraciones infantiles estilo *flat illustration*  
- LangGraph para orquestar flujos multimodales (texto → imágenes → ejercicios)  
- Validación de seguridad de contenido apropiado para niños

### ♿ Accesibilidad y Diseño Inclusivo
- Estándares AA/AAA de accesibilidad web  
- Alto contraste (≥7:1) en toda la interfaz  
- Fuente **Comic Neue** optimizada para legibilidad infantil  
- Modo de movimiento reducido para sensibilidad visual  
- Escalado de texto configurable

### 🔒 Privacidad y Seguridad
- Cumplimiento **GDPR/COPPA** con mínima recolección de datos  
- Sesiones encriptadas con **PostgreSQL session store**  
- Sin tracking de datos sensibles de menores

---

## 🛠️ Stack Tecnológico

### **Frontend**
- React 18 con Vite para desarrollo rápido  
- TypeScript para type safety end-to-end  
- Radix UI: componentes accesibles y primitivos  
- Tailwind CSS para diseño responsive  
- GSAP & Framer Motion para animaciones premium  
- React Three Fiber para elementos 3D (opcional)  
- TanStack Query para gestión de estado del servidor  
- React Router para navegación client-side

### **Backend**
- Node.js 18+ con Express.js  
- TypeScript con módulos ESM  
- LangChain para orquestación de IA  
- LangGraph para workflows multi-paso  
- OpenAI SDK (GPT-4o-mini, DALL-E 3)

### **Base de Datos**
- PostgreSQL 14+ (Neon Serverless)  
- Drizzle ORM para queries type-safe  
- Drizzle Kit para migraciones automáticas

---

## 🎯 Sistema de Niveles Progresivos

**HablaConmigo** implementa un sistema de 10 niveles que aumenta gradualmente la complejidad lingüística:

| Nivel | Nombre            | Palabras   | Gramática                                      | Ejercicios                                                            |
|:------|:------------------|:-----------|:----------------------------------------------|:---------------------------------------------------------------------|
| 1     | Inicial           | 50–80      | SVO simple, vocabulario concreto               | drag_words, multi_choice                                              |
| 2     | Básico            | 80–100     | Adjetivos, artículos, presente simple          | drag_words, multi_choice                                              |
| 3     | Intermedio        | 100–130    | Conectores (y, pero, porque), pasado           | order_sentence, complete_words, multi_choice                          |
| 4     | Avanzado          | 130–160    | Verbos irregulares, plurales, ortografía       | complete_words, order_sentence, multi_choice                          |
| 5     | Experto           | 150–200    | Subordinadas, pronombres, tiempos compuestos   | order_sentence, complete_words, multi_choice, free_writing            |
| 6     | Intermedio Alto   | 200–250    | Nexos complejos, tiempos perfectos             | order_sentence, complete_words, multi_choice, free_writing            |
| 7     | Avanzado Alto     | 250–300    | Oraciones compuestas, subjuntivo básico        | order_sentence, complete_words, multi_choice, free_writing            |
| 8     | Profesional       | 300–350    | Modismos, metáforas, estilo descriptivo        | order_sentence, complete_words, multi_choice, free_writing            |
| 9     | Experto Avanzado  | 350–400    | Lenguaje figurado, narración compleja          | order_sentence, complete_words, multi_choice, free_writing            |
| 10    | Maestría          | 400–500+   | Textos literarios, argumentación avanzada      | order_sentence, complete_words, multi_choice, free_writing            |

---

## 🔁 Flujo Completo

### 🧩 Generación de Historia (GPT-4o-mini)
- Tema y nivel especificados por el usuario  
- 3 páginas con texto apropiado para el nivel  
- Vocabulario clave con definiciones y emojis  

### 🎨 Generación de Imagen (DALL-E 3)
- Estilo: *"flat illustration child-friendly"*  
- 1 imagen de portada optimizada
- Emojis para vocabulario (sin generar imágenes)  

### 🧠 Generación de Ejercicios (GPT-4o-mini + Validadores)
- 2–4 ejercicios según el nivel  
- Validación de 3 capas (**grammar**, **coherence**, **pedagogy**)  
- Regeneración automática si *score* < 70

### 💾 Persistencia
- Historia guardada en tabla `stories`  
- Ejercicios en tabla `exercises`  
- Imágenes en tabla `assets`  
- Relación usuario-historia en `user_stories`