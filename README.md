# Fragmentos do Acaso — Parte II

Trailer cinematográfico de 34 segundos construído com HTML, SVG, JavaScript, Playwright, Chromium e FFmpeg.

## Especificações

- 1920 × 1080
- 16:9
- 34 segundos
- 2040 frames na versão definitiva de 60 FPS
- 1020 frames na prévia de 30 FPS
- H.264, yuv420p, AAC stereo 48 kHz
- 120 BPM / 68 batidas teóricas ao longo da duração
- Linha temporal determinística por `window.seek(t)`

## Instalação

```bash
npm install
npx playwright install chromium
npm run audio
```

## Prévia visual obrigatória

```bash
npm run previews
```

Isso gera:

- `previews/preview.mp4`
- capturas em `previews/preview-*.png`
- `previews/contact-sheet.jpg`

A prévia usa 1020 frames a 30 FPS. Revise o vídeo e a imagem de contato antes da renderização definitiva.

## Renderização definitiva

```bash
npm run render
```

O arquivo final é criado em:

```text
output/FRAGMENTOS_DO_ACASO_PARTE_II.mp4
```

## Pré-visualização no navegador

```bash
npm run serve
```

Abra `http://localhost:4173`. No console de Chromium, use `seek` para analisar qualquer instante:

```js
window.seek(11);
window.seek(24);
window.seek(32.5);
```

## Arquivos

- `index.html`: composição SVG/HTML determinística e timeline
- `audio-generator.js`: trilha WAV original em D menor
- `render.js`: capturas Playwright e codificação FFmpeg
- `previews/`: prévias e material de contato
- `output/`: versão MP4 definitiva

## Dependências externas

É necessário instalar FFmpeg no sistema. Fontes externas não são necessárias; o projeto usa fontes serifadas, sem serifa e monoespaçadas disponíveis no sistema.
