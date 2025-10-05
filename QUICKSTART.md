# 🚀 Guía de Inicio Rápido

## ⚡ Setup en 5 minutos

### 1. Prerrequisitos

```bash
node --version  # Debe ser 16+
npm --version   # Debe ser 8+
```

### 2. Obtener API Key de Gemini

1. Ve a https://ai.google.dev/
2. Haz click en "Get API Key"
3. Copia tu API key

### 3. Clonar y configurar

```bash
git clone https://github.com/[tu-usuario]/nasa-research-assistant.git
cd nasa-research-assistant
npm install
cp .env.example .env
```

### 4. Configurar API Key

Edita `.env` y agrega tu API key:

```bash
REACT_APP_GEMINI_API_KEY=tu_api_key_aqui
```

### 5. Ejecutar

```bash
npm start
```

## 🧪 Pruebas Recomendadas

### Consulta 1: Pérdida Ósea

```
¿Cómo afecta la microgravedad a la pérdida de masa ósea en astronautas y qué mecanismos celulares están involucrados?
```

### Consulta 2: Experimentos con Ratones

```
¿Qué resultados han dado los experimentos con ratones en microgravidad para entender los efectos del espacio en la fisiología humana?
```

### Consulta 3: Contramedidas Médicas

```
¿Cuáles son las contramedidas médicas más prometedoras para mantener la salud de astronautas en misiones espaciales largas?
```

## 🔍 Cómo Usar

1. **Conectar**: Verifica que aparezca "✅ Conectado a Gemini"
2. **Consultar**: Escribe tu pregunta en el campo de búsqueda
3. **Revisar**: Ve los papers relevantes encontrados
4. **Analizar**: Haz click en "🔬 Analizar Paper" para análisis detallado
5. **Explorar**: Lee los hallazgos clave y puntuación de relevancia

## 🐛 Troubleshooting

### Error: "❌ No conectado"

- Verifica que tu API key esté en `.env`
- Revisa la consola del navegador (F12) para errores
- Asegúrate de que el API key sea válido

### Error: "No papers encontrados"

- Prueba con consultas más específicas
- Usa términos en inglés como "microgravity", "bone loss"
- Verifica que el archivo `nasa_articles_context.json` esté cargado

### Error de red

- Verifica tu conexión a internet
- Revisa si hay límites en tu API key de Gemini
