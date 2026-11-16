#!/usr/bin/env python3
"""Trader Skill: escáner, plan de operación y simulación Monte Carlo.

Solo análisis educativo. No ejecuta órdenes ni es asesoría financiera.

Uso:
  trader.py scan  AAPL NVDA TSLA ...            # ranking de señales
  trader.py plan  TSLA [--capital 10000] [--riesgo 1] [--sims 10000] [--dias 20]
  trader.py plan  TSLA --csv precios.csv        # usar datos propios
  trader.py demo                                # datos sintéticos (sin red)

Opciones comunes: --rango 1y  --html informe.html  --json
CSV: columnas Date,Open,High,Low,Close[,Volume] (formato de Yahoo/Stooq).
"""
import argparse
import csv
import datetime as dt
import html
import json
import sys
import urllib.error
import urllib.request

import numpy as np


# ---------------------------------------------------------------- datos
def fetch_yahoo(ticker, rango="1y"):
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
           f"?range={rango}&interval=1d")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.load(r)
    res = data["chart"]["result"][0]
    q = res["indicators"]["quote"][0]
    rows = []
    for i, ts in enumerate(res["timestamp"]):
        o, h, l, c = q["open"][i], q["high"][i], q["low"][i], q["close"][i]
        if None in (o, h, l, c):
            continue
        rows.append((dt.date.fromtimestamp(ts).isoformat(), o, h, l, c))
    return rows


def load_csv(path):
    rows = []
    with open(path, newline="") as f:
        for r in csv.DictReader(f):
            r = {k.strip().lower(): v for k, v in r.items()}
            try:
                rows.append((r["date"], float(r["open"]), float(r["high"]),
                             float(r["low"]), float(r["close"])))
            except (KeyError, ValueError):
                continue
    return rows


def synthetic(seed=7, n=260, start=250.0):
    rng = np.random.default_rng(seed)
    ret = rng.normal(0.0012, 0.025, n)
    close = start * np.exp(np.cumsum(ret))
    rows, d = [], dt.date.today() - dt.timedelta(days=int(n * 1.45))
    for c, r in zip(close, ret):
        d += dt.timedelta(days=1)
        while d.weekday() >= 5:
            d += dt.timedelta(days=1)
        o = c / np.exp(r)
        span = abs(rng.normal(0, 0.012)) * c
        rows.append((d.isoformat(), o, max(o, c) + span, min(o, c) - span, c))
    return rows


def get_rows(ticker, args):
    if getattr(args, "csv", None):
        return load_csv(args.csv)
    if ticker.upper().startswith("DEMO"):
        return synthetic(seed=sum(map(ord, ticker.upper())))
    return fetch_yahoo(ticker, args.rango)


# ---------------------------------------------------------- indicadores
def sma(x, n):
    return float(np.mean(x[-n:])) if len(x) >= n else float("nan")


def rsi(close, n=14):
    d = np.diff(close[-(n * 5):])
    up, dn = np.clip(d, 0, None), np.clip(-d, 0, None)
    a_up, a_dn = up[:n].mean(), dn[:n].mean()
    for u, w in zip(up[n:], dn[n:]):  # suavizado de Wilder
        a_up = (a_up * (n - 1) + u) / n
        a_dn = (a_dn * (n - 1) + w) / n
    return 100.0 if a_dn == 0 else float(100 - 100 / (1 + a_up / a_dn))


def atr(high, low, close, n=14):
    pc = close[:-1]
    tr = np.maximum.reduce([high[1:] - low[1:], abs(high[1:] - pc), abs(low[1:] - pc)])
    return float(np.mean(tr[-n:]))


def analyze(ticker, rows):
    if len(rows) < 60:
        raise ValueError(f"{ticker}: hacen falta al menos 60 velas (hay {len(rows)})")
    _, o, h, l, c = (np.array(col, dtype=object if i == 0 else float)
                     for i, col in enumerate(zip(*rows)))
    last = float(c[-1])
    s20, s50 = sma(c, 20), sma(c, 50)
    s200 = sma(c, 200)
    r = rsi(c)
    a = atr(h, l, c)
    mom20 = last / c[-21] - 1
    hi20 = float(np.max(h[-21:-1]))
    vol = float(np.std(np.diff(np.log(c[-60:]))) * np.sqrt(252))

    # puntuación de -100 a 100
    score = 0
    score += 25 if last > s20 else -25
    score += 25 if s20 > s50 else -25
    if not np.isnan(s200):
        score += 15 if last > s200 else -15
    score += int(np.clip(mom20 * 200, -20, 20))
    if r > 75:
        score -= 15  # sobrecompra
    elif r < 30:
        score += 10  # sobreventa (posible rebote)
    breakout = last >= hi20
    if breakout:
        score += 10
    score = int(np.clip(score, -100, 100))
    signal = "COMPRA" if score >= 40 else "VENTA/EVITAR" if score <= -40 else "ESPERAR"

    return {
        "ticker": ticker.upper(), "fecha": rows[-1][0], "precio": round(last, 2),
        "sma20": round(s20, 2), "sma50": round(s50, 2),
        "sma200": None if np.isnan(s200) else round(s200, 2),
        "rsi14": round(r, 1), "atr14": round(a, 2),
        "momentum20d_pct": round(mom20 * 100, 2), "volatilidad_anual_pct": round(vol * 100, 1),
        "ruptura_maximo20d": bool(breakout), "maximo20d": round(hi20, 2),
        "puntuacion": score, "senal": signal,
        "_close": c, "_high": h, "_low": l,
    }


# ------------------------------------------------------ plan + Monte Carlo
def make_plan(a, capital, riesgo_pct, stop_atr=1.5, rr=2.0):
    entry = a["precio"]
    stop = entry - stop_atr * a["atr14"]
    target = entry + rr * (entry - stop)
    riesgo_eur = capital * riesgo_pct / 100
    por_accion = entry - stop
    acciones = int(riesgo_eur // por_accion) if por_accion > 0 else 0
    acciones = min(acciones, int(capital // entry))
    return {
        "entrada": round(entry, 2), "stop": round(stop, 2), "objetivo": round(target, 2),
        "ratio_riesgo_beneficio": rr, "acciones": acciones,
        "inversion": round(acciones * entry, 2),
        "perdida_max": round(acciones * por_accion, 2),
        "beneficio_obj": round(acciones * (target - entry), 2),
    }


def monte_carlo(a, plan, sims=10000, dias=20, seed=42):
    """Bootstrap de rendimientos diarios reales; mira si toca objetivo o stop primero."""
    c = a["_close"]
    rets = np.diff(np.log(c[-250:]))
    rets = rets - rets.mean()  # sin deriva: no asumimos que la tendencia sigue
    rng = np.random.default_rng(seed)
    paths = plan["entrada"] * np.exp(np.cumsum(rng.choice(rets, (sims, dias)), axis=1))
    hit_t = paths >= plan["objetivo"]
    hit_s = paths <= plan["stop"]
    first_t = np.where(hit_t.any(1), hit_t.argmax(1), dias + 1)
    first_s = np.where(hit_s.any(1), hit_s.argmax(1), dias + 1)
    win = first_t < first_s
    loss = first_s < first_t
    none = ~(win | loss)
    final = paths[:, -1]
    pnl = np.where(win, plan["objetivo"] - plan["entrada"],
                   np.where(loss, plan["stop"] - plan["entrada"], final - plan["entrada"]))
    pnl_total = pnl * plan["acciones"]
    return {
        "simulaciones": sims, "dias": dias,
        "prob_objetivo_pct": round(win.mean() * 100, 1),
        "prob_stop_pct": round(loss.mean() * 100, 1),
        "prob_ninguno_pct": round(none.mean() * 100, 1),
        "resultado_esperado": round(float(pnl_total.mean()), 2),
        "p5": round(float(np.percentile(pnl_total, 5)), 2),
        "p95": round(float(np.percentile(pnl_total, 95)), 2),
        "_paths": paths[:120], "_pnl": pnl_total,
    }


# ------------------------------------------------------------- informe
def svg_paths(a, plan, mc, w=640, h=260):
    hist = a["_close"][-60:]
    paths = mc["_paths"]
    n_hist, n_fut = len(hist), paths.shape[1]
    allv = np.concatenate([hist, paths.ravel(), [plan["stop"], plan["objetivo"]]])
    lo, hi = np.percentile(allv, 1), np.percentile(allv, 99)
    lo, hi = min(lo, plan["stop"]) * 0.99, max(hi, plan["objetivo"]) * 1.01
    tot = n_hist + n_fut
    X = lambda i: 8 + (w - 16) * i / (tot - 1)
    Y = lambda v: 8 + (h - 16) * (1 - (v - lo) / (hi - lo))
    out = [f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="Precio y escenarios simulados">']
    for p in paths:
        pts = " ".join(f"{X(n_hist - 1 + i):.1f},{Y(v):.1f}"
                       for i, v in enumerate(np.concatenate([[plan['entrada']], p])))
        col = "var(--up)" if p.max() >= plan["objetivo"] else "var(--down)" if p.min() <= plan["stop"] else "var(--muted)"
        out.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-opacity=".18" stroke-width="1"/>')
    pts = " ".join(f"{X(i):.1f},{Y(v):.1f}" for i, v in enumerate(hist))
    out.append(f'<polyline points="{pts}" fill="none" stroke="var(--ink)" stroke-width="2"/>')
    for val, lab, col in ((plan["objetivo"], "Objetivo", "var(--up)"),
                          (plan["entrada"], "Entrada", "var(--ink)"),
                          (plan["stop"], "Stop", "var(--down)")):
        out.append(f'<line x1="8" x2="{w-8}" y1="{Y(val):.1f}" y2="{Y(val):.1f}" stroke="{col}" stroke-dasharray="4 4"/>'
                   f'<text x="{w-10}" y="{Y(val)-4:.1f}" text-anchor="end" fill="{col}" font-size="11">{lab} {val:.2f}</text>')
    out.append("</svg>")
    return "".join(out)


def write_html(path, a, plan, mc):
    e = html.escape
    kpis = [("Señal", a["senal"]), ("Puntuación", f'{a["puntuacion"]}/100'),
            ("Prob. objetivo", f'{mc["prob_objetivo_pct"]}%'), ("Prob. stop", f'{mc["prob_stop_pct"]}%'),
            ("Resultado esperado", f'{mc["resultado_esperado"]:+.2f}')]
    rows = [("Precio", a["precio"]), ("SMA 20 / 50 / 200", f'{a["sma20"]} / {a["sma50"]} / {a["sma200"]}'),
            ("RSI 14", a["rsi14"]), ("ATR 14", a["atr14"]), ("Momentum 20d", f'{a["momentum20d_pct"]}%'),
            ("Volatilidad anual", f'{a["volatilidad_anual_pct"]}%'),
            ("Entrada / Stop / Objetivo", f'{plan["entrada"]} / {plan["stop"]} / {plan["objetivo"]}'),
            ("Acciones", plan["acciones"]), ("Inversión", plan["inversion"]),
            ("Pérdida máx. / Beneficio obj.", f'{plan["perdida_max"]} / {plan["beneficio_obj"]}'),
            ("Rango P5–P95", f'{mc["p5"]} … {mc["p95"]}')]
    doc = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Plan {e(a['ticker'])}</title>
<style>
:root{{--bg:#fafaf7;--card:#fff;--ink:#1d1d1b;--muted:#8a8a85;--line:#e6e4de;--up:#1f8a5b;--down:#c8443a}}
@media (prefers-color-scheme:dark){{:root{{--bg:#151513;--card:#1f1f1c;--ink:#f1efe9;--muted:#8d8b84;--line:#33322e;--up:#4cc38a;--down:#ef6a5e}}}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}}
main{{max-width:720px;margin:0 auto;padding:24px 16px}}h1{{margin:0 0 4px;font-size:24px}}
.sub{{color:var(--muted);margin:0 0 20px}}.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px}}
.k,.card{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}}
.k b{{display:block;font-size:20px}}.k span{{color:var(--muted);font-size:12px}}
svg{{width:100%;height:auto}}table{{width:100%;border-collapse:collapse}}td{{padding:6px 0;border-bottom:1px solid var(--line)}}
td:last-child{{text-align:right;font-variant-numeric:tabular-nums}}.warn{{color:var(--muted);font-size:12px;margin-top:16px}}
</style></head><body><main>
<h1>Plan de operación · {e(a['ticker'])}</h1>
<p class="sub">Datos al {e(a['fecha'])} · {mc['simulaciones']:,} simulaciones a {mc['dias']} días</p>
<div class="kpis">{''.join(f'<div class="k"><span>{e(k)}</span><b>{e(str(v))}</b></div>' for k, v in kpis)}</div>
<div class="card">{svg_paths(a, plan, mc)}</div><br>
<div class="card"><table>{''.join(f'<tr><td>{e(k)}</td><td>{e(str(v))}</td></tr>' for k, v in rows)}</table></div>
<p class="warn">Análisis educativo generado automáticamente. No es asesoría financiera. Las probabilidades vienen de remuestrear
rendimientos pasados sin tendencia; el mercado real puede comportarse distinto (gaps, noticias, liquidez).</p>
</main></body></html>"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(doc)


def public(d):
    return {k: v for k, v in d.items() if not k.startswith("_")}


# ------------------------------------------------------------------ CLI
def cmd_scan(args):
    out = []
    for t in args.tickers:
        try:
            out.append(public(analyze(t, get_rows(t, args))))
        except Exception as ex:  # noqa: BLE001
            out.append({"ticker": t.upper(), "error": str(ex)})
    out.sort(key=lambda r: r.get("puntuacion", -999), reverse=True)
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return
    print(f"{'Ticker':<8}{'Precio':>10}{'RSI':>7}{'Mom20d':>9}{'Punt.':>7}  Señal")
    for r in out:
        if "error" in r:
            print(f"{r['ticker']:<8}  error: {r['error']}")
            continue
        print(f"{r['ticker']:<8}{r['precio']:>10.2f}{r['rsi14']:>7.1f}{r['momentum20d_pct']:>8.1f}%"
              f"{r['puntuacion']:>7}  {r['senal']}{'  ↑ruptura' if r['ruptura_maximo20d'] else ''}")


def cmd_plan(args):
    a = analyze(args.ticker, get_rows(args.ticker, args))
    plan = make_plan(a, args.capital, args.riesgo, args.stop_atr, args.rr)
    mc = monte_carlo(a, plan, args.sims, args.dias)
    if args.html:
        write_html(args.html, a, plan, mc)
    result = {"analisis": public(a), "plan": plan, "simulacion": public(mc)}
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    print(f"== {a['ticker']} · {a['fecha']} · precio {a['precio']} ==")
    print(f"Señal: {a['senal']} (puntuación {a['puntuacion']})  RSI {a['rsi14']}  ATR {a['atr14']}  "
          f"SMA20 {a['sma20']}  SMA50 {a['sma50']}  SMA200 {a['sma200']}")
    print(f"Plan: entrada {plan['entrada']}  stop {plan['stop']}  objetivo {plan['objetivo']}  "
          f"(R:R 1:{plan['ratio_riesgo_beneficio']})")
    print(f"Tamaño: {plan['acciones']} acciones  inversión {plan['inversion']}  "
          f"pérdida máx {plan['perdida_max']}  beneficio obj {plan['beneficio_obj']}")
    print(f"Monte Carlo ({mc['simulaciones']} sims, {mc['dias']} días): objetivo {mc['prob_objetivo_pct']}%  "
          f"stop {mc['prob_stop_pct']}%  ninguno {mc['prob_ninguno_pct']}%  "
          f"esperado {mc['resultado_esperado']:+}  P5 {mc['p5']}  P95 {mc['p95']}")
    if args.html:
        print(f"Informe: {args.html}")


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--rango", default="1y", help="rango de Yahoo: 6mo, 1y, 2y, 5y")
    common.add_argument("--csv", help="CSV propio en vez de descargar")
    common.add_argument("--json", action="store_true")

    s = sub.add_parser("scan", parents=[common])
    s.add_argument("tickers", nargs="+")
    s.set_defaults(func=cmd_scan)

    pl = sub.add_parser("plan", parents=[common])
    pl.add_argument("ticker")
    pl.add_argument("--capital", type=float, default=10000)
    pl.add_argument("--riesgo", type=float, default=1.0, help="%% del capital a arriesgar")
    pl.add_argument("--stop-atr", type=float, default=1.5)
    pl.add_argument("--rr", type=float, default=2.0, help="ratio beneficio/riesgo")
    pl.add_argument("--sims", type=int, default=10000)
    pl.add_argument("--dias", type=int, default=20)
    pl.add_argument("--html")
    pl.set_defaults(func=cmd_plan)

    d = sub.add_parser("demo")
    d.set_defaults(func=lambda a: (
        cmd_scan(argparse.Namespace(tickers=["DEMO1", "DEMO2", "DEMO3"], csv=None, rango="1y", json=False)),
        print(),
        cmd_plan(argparse.Namespace(ticker="DEMO1", csv=None, rango="1y", json=False, capital=10000,
                                    riesgo=1.0, stop_atr=1.5, rr=2.0, sims=10000, dias=20, html="demo.html"))))

    args = p.parse_args(argv)
    try:
        args.func(args)
    except urllib.error.URLError as ex:
        sys.exit(f"No se pudieron descargar datos ({ex}). Usa --csv con un archivo de precios.")


if __name__ == "__main__":
    main()
