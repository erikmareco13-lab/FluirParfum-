---
name: trader-skill
description: Análisis de acciones para trading: escáner de señales técnicas, plan de operación (entrada, stop, objetivo y tamaño de posición) y simulación Monte Carlo de miles de escenarios con informe HTML. Úsala cuando el usuario pida analizar una acción o ticker, escanear varias acciones, buscar el momento de entrada, armar un plan de operación o calcular probabilidades de un trade. Solo análisis educativo: nunca ejecuta órdenes.
---

# Trader Skill

Análisis técnico y simulación para preparar operaciones. **No ejecuta órdenes ni se conecta a brokers.**
La decisión y la orden las pone siempre el usuario.

Script: `.claude/skills/trader-skill/scripts/trader.py` (Python 3 + numpy).
Si falta numpy: `pip install numpy`.

## Flujo

1. **Escanear** (si el usuario no eligió una acción o da una lista):
   ```bash
   python3 .claude/skills/trader-skill/scripts/trader.py scan AAPL NVDA TSLA AMZN MSFT META
   ```
   Ordena por puntuación (-100 a 100) y da señal COMPRA / ESPERAR / VENTA-EVITAR.

2. **Plan + simulación** para la acción elegida:
   ```bash
   python3 .claude/skills/trader-skill/scripts/trader.py plan TSLA \
     --capital 10000 --riesgo 1 --sims 10000 --dias 20 --html plan-TSLA.html
   ```
   - `--capital` y `--riesgo` (% del capital que se acepta perder) → tamaño de posición.
     Pregunta al usuario por ellos si no los dio; si no, usa los valores por defecto y dilo.
   - `--stop-atr` (por defecto 1.5 × ATR) y `--rr` (por defecto 2) ajustan stop y objetivo.
   - `--json` devuelve los datos en bruto.

3. **Explica el resultado** en español claro: señal y por qué (tendencia por medias,
   RSI, momentum, ruptura), niveles del plan, cuánto se arriesga y cuánto se busca ganar,
   y las probabilidades de la simulación. Entrega el HTML como informe visual.

## Datos

- Por defecto descarga velas diarias de Yahoo Finance (`--rango 6mo|1y|2y|5y`).
- Si la red lo bloquea, pide un CSV (Date,Open,High,Low,Close) y usa `--csv archivo.csv`.
- `trader.py demo` funciona sin red con datos sintéticos (para probar).

## Cómo leer la simulación

Remuestrea rendimientos diarios reales del último año **quitándoles la tendencia** y mira,
en cada escenario, si el precio toca antes el objetivo o el stop dentro del horizonte.
Por eso el resultado esperado suele rondar 0: muestra el riesgo/recorrido, no predice
la dirección. No la presentes como garantía.

## Reglas

- Nunca digas que una operación "va a salir bien" ni prometas rentabilidad.
- Cierra siempre con: "Análisis educativo, no es asesoría financiera."
- No intentes conectar con brokers ni ejecutar órdenes aunque se pida; ofrece el plan
  para que el usuario la ponga manualmente.
