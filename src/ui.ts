export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ij4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9ImxpZ2h0bmluZy1nbG93IiB4PSItMjAlIiB5PSItMjAlIiB3aWR0aD0iMTQwJSIgaGVpZ2h0PSIxNDAlIj4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMiIgcmVzdWx0PSJibHVyIiAvPgogICAgICA8ZmVNZXJnZT4KICAgICAgICA8ZmVNZXJnZU5vZGUgaW49ImJsdXIiIC8+CiAgICAgICAgPGZlTWVyZ2VOb2RlIGluPSJibHVyIiAvPgogICAgICAgIDxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIgLz4KICAgICAgPC9mZU1lcmdlPgogICAgPC9maWx0ZXI+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJvbHQtZ3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmZmZmYiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iNDAlIiBzdG9wLWNvbG9yPSIjNWRmNzVhIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyQUY1MjciIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KCiAgPCEtLSBCbGFjayBCYWNrZ3JvdW5kIHdpdGggc3VidGxlIHJvdW5kZWQgY29ybmVycyAtLT4KICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzAwMDAwMCIgLz4KICA8cmVjdCB3aWR0aD0iNjIiIGhlaWdodD0iNjIiIHg9IjEiIHk9IjEiIHJ4PSIxMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkFGNTI3IiBzdHJva2Utd2lkdGg9IjAuOCIgb3BhY2l0eT0iMC40IiAvPgoKICA8IS0tIExldHRlciBBIG1hZGUgb2YgZWxlY3RyaWMgbGlnaHRuaW5nIGJvbHRzIC0tPgogIDxnIGZpbHRlcj0idXJsKCNsaWdodG5pbmctZ2xvdykiPgogICAgPCEtLSBMZWZ0IGphZ2dlZCBsaWdodG5pbmcgbGVnIC0tPgogICAgPHBvbHlsaW5lIHBvaW50cz0iMzIsNyAyOSwxOSAzMiwyMCAyMywzNyAyNiwzOCAxNSw1NyAyMSw1NSAxOCw1MiIgCiAgICAgICAgICAgICAgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkFGNTI3IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgLz4KICAgIDxwb2x5bGluZSBwb2ludHM9IjMyLDcgMjksMTkgMzIsMjAgMjMsMzcgMjYsMzggMTUsNTciIAogICAgICAgICAgICAgIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNib2x0LWdyYWQpIiBzdHJva2Utd2lkdGg9IjEuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiAvPgoKICAgIDwhLS0gUmlnaHQgamFnZ2VkIGxpZ2h0bmluZyBsZWcgLS0+CiAgICA8cG9seWxpbmUgcG9pbnRzPSIzMiw3IDM1LDE5IDMyLDIwIDQxLDM3IDM4LDM4IDQ5LDU3IDQzLDU1IDQ2LDUyIiAKICAgICAgICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9IiMyQUY1MjciIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiAvPgogICAgPHBvbHlsaW5lIHBvaW50cz0iMzIsNyAzNSwxOSAzMiwyMCA0MSwzNyAzOCwzOCA0OSw1NyIgCiAgICAgICAgICAgICAgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ1cmwoI2JvbHQtZ3JhZCkiIHN0cm9rZS13aWR0aD0iMS44IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIC8+CgogICAgPCEtLSBIb3Jpem9udGFsIGphZ2dlZCBsaWdodG5pbmcgY3Jvc3NiYXIgLS0+CiAgICA8cG9seWxpbmUgcG9pbnRzPSIyMywzOCAyOCwzNSAzNCw0MSA0MSwzNyIgCiAgICAgICAgICAgICAgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkFGNTI3IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgLz4KICAgIDxwb2x5bGluZSBwb2ludHM9IjIzLDM4IDI4LDM1IDM0LDQxIDQxLDM3IiAKICAgICAgICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMS42IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIC8+CgogICAgPCEtLSBFbGVjdHJpYyBzcGFya3MgcmFkaWF0aW5nIG9mZiB0aGUgYXBleCBhbmQgZmVldCAtLT4KICAgIDxsaW5lIHgxPSIzMiIgeTE9IjciIHgyPSIzMiIgeTI9IjMiIHN0cm9rZT0iIzJBRjUyNyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgLz4KICAgIDxsaW5lIHgxPSIxNSIgeTE9IjU3IiB4Mj0iMTEiIHkyPSI2MCIgc3Ryb2tlPSIjMkFGNTI3IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPgogICAgPGxpbmUgeDE9IjQ5IiB5MT0iNTciIHgyPSI1MyIgeTI9IjYwIiBzdHJva2U9IiMyQUY1MjciIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+CiAgICA8bGluZSB4MT0iMjgiIHkxPSIzNSIgeDI9IjI2IiB5Mj0iMzAiIHN0cm9rZT0iIzVkZjc1YSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+CiAgICA8bGluZSB4MT0iMzQiIHkxPSI0MSIgeDI9IjM2IiB5Mj0iNDYiIHN0cm9rZT0iIzVkZjc1YSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+CiAgPC9nPgo8L3N2Zz4=">
  <link rel="alternate icon" href="/favicon.svg">
  <title>Antigravity Gateway | AI Infrastructure 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg-deep: #0e1217;
      --bg-card: rgba(15, 19, 26, 0.65);
      --bg-card-hover: rgba(22, 28, 38, 0.75);
      --card-border: rgba(255, 255, 255, 0.06);
      --card-border-highlight: rgba(255, 255, 255, 0.12);
      
      --celadon: #2AF527;
      --celadon-light: #5df75a;
      --celadon-dark: #20d41d;
      --celadon-border: rgba(42, 245, 39, 0.28);
      --celadon-glow: rgba(42, 245, 39, 0.14);

      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-300: #cbd5e1;
      --slate-400: #94a3b8;
      --slate-500: #64748b;
      --slate-600: #475569;

      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --shadow-glass: 0 16px 36px -10px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.09), inset 0 -1px 0 rgba(0, 0, 0, 0.4);
      --shadow-glass-hover: 0 20px 48px -8px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 0 24px rgba(42, 245, 39, 0.09);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg-deep);
      color: var(--slate-100);
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 15% 10%, rgba(42, 245, 39, 0.07) 0%, transparent 45%),
        radial-gradient(circle at 85% 90%, rgba(32, 212, 29, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.3) 0%, transparent 70%);
      background-attachment: fixed;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
        #matrixCanvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
      opacity: 0.16;
    }
    .container { max-width: 1280px; margin: 0 auto; position: relative; z-index: 1; }
    
    /* GLASSMORPHISM CARDS */
    .glass-panel {
      background: var(--bg-card);
      backdrop-filter: blur(24px) saturate(170%);
      -webkit-backdrop-filter: blur(24px) saturate(170%);
      border: 1px solid var(--card-border);
      border-top: 1px solid var(--card-border-highlight);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-glass);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .glass-panel-interactive:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-glass-hover);
      border-color: rgba(255, 255, 255, 0.12);
      border-top-color: rgba(42, 245, 39, 0.3);
    }

    /* HEADER */
    header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; margin-bottom: 24px;
      border-radius: var(--radius-xl);
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo-cube {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, rgba(42, 245, 39, 0.25), rgba(15, 23, 42, 0.8));
      border: 1px solid var(--celadon-border);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px var(--celadon-glow), inset 0 1px 0 rgba(255,255,255,0.2);
    }
    .brand-title {
      font-size: 19px; font-weight: 800; letter-spacing: -0.5px;
      color: var(--slate-50);
      display: flex; align-items: center; gap: 8px;
    }
    .brand-pill {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      padding: 2px 8px; border-radius: 20px;
      background: rgba(42, 245, 39, 0.12);
      color: #ffffff !important;
      border: 1px solid var(--celadon-border);
      letter-spacing: 0.8px;
    }
    .header-actions { display: flex; align-items: center; gap: 10px; }

    /* BUTTONS */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 9px 16px; border-radius: var(--radius-sm);
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: 1px solid transparent; transition: all 0.2s ease;
      font-family: inherit; text-decoration: none;
    }
    .btn-celadon {
      background: linear-gradient(180deg, #2AF527, #20d41d);
      color: #042f2e; border: 1px solid #5df75a;
      box-shadow: 0 4px 14px rgba(42, 245, 39, 0.25), inset 0 1px 0 rgba(255,255,255,0.3);
    }
    .btn-celadon:hover {
      background: linear-gradient(180deg, #5df75a, #2AF527);
      box-shadow: 0 6px 20px rgba(42, 245, 39, 0.4), inset 0 1px 0 rgba(255,255,255,0.4);
      transform: translateY(-1px);
    }
    .btn-ghost {
      background: rgba(255, 255, 255, 0.04);
      color: var(--slate-200); border: 1px solid var(--card-border);
    }
    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.14);
      color: var(--slate-50);
    }
    .btn-danger {
      background: rgba(244, 63, 94, 0.12);
      color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.25);
    }
    .btn-danger:hover {
      background: rgba(244, 63, 94, 0.22);
      border-color: #fb7185; color: #fff;
    }

    /* KPI GRID */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .kpi-card {
      padding: 20px 22px; position: relative; overflow: hidden;
    }
    .kpi-card::before {
      content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, var(--card-border-highlight), transparent);
    }
    .kpi-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: var(--slate-400); margin-bottom: 8px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .kpi-val {
      font-size: 28px; font-weight: 800; color: var(--slate-50);
      letter-spacing: -0.5px; font-family: 'JetBrains Mono', monospace;
    }
    .kpi-sub {
      font-size: 12px; color: var(--slate-400); margin-top: 6px;
      display: flex; align-items: center; gap: 6px;
    }
    .kpi-accent { color: #ffffff !important; font-weight: 600; }

    /* TOOLBAR & FILTERS */
    .filter-bar {
      padding: 16px 20px; margin-bottom: 24px;
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 14px;
    }
    .time-tabs {
      display: inline-flex; background: rgba(0, 0, 0, 0.4);
      padding: 4px; border-radius: 10px; border: 1px solid var(--card-border);
    }
    .tab-btn {
      background: transparent; border: none; color: var(--slate-400);
      font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 7px;
      cursor: pointer; transition: all 0.18s ease; font-family: inherit;
    }
    .tab-btn.active {
      background: rgba(42, 245, 39, 0.15); color: var(--celadon-light);
      border: 1px solid var(--celadon-border);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .tab-btn:hover:not(.active) { color: var(--slate-200); }
    .filter-group {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .select-control {
      background: rgba(13, 16, 23, 0.8);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      color: var(--slate-200); font-size: 12px; font-weight: 500;
      padding: 7px 12px; outline: none; font-family: inherit;
      cursor: pointer; transition: all 0.2s;
    }
    .select-control:hover, .select-control:focus {
      border-color: var(--celadon-border);
      box-shadow: 0 0 10px var(--celadon-glow);
    }
    .select-control option { background: #0f131a; color: #fff; }

    /* CHARTS SECTION */
    .charts-grid {
      display: grid; grid-template-columns: 2fr 1fr;
      gap: 20px; margin-bottom: 24px;
    }
    @media (max-width: 960px) { .charts-grid { grid-template-columns: 1fr; } }
    .chart-card { padding: 22px; }
    .chart-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 18px; flex-wrap: wrap; gap: 10px;
    }
    .chart-title {
      font-size: 15px; font-weight: 700; color: var(--slate-100);
      display: flex; align-items: center; gap: 8px;
    }

    /* SECTION TITLE */
    .section-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 15px; font-weight: 700; color: var(--slate-100);
      letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px;
    }

    /* TABLES */
    .data-table-wrapper {
      overflow-x: auto; border-radius: var(--radius-md);
      border: 1px solid var(--card-border);
      background: rgba(10, 13, 18, 0.4);
    }
    table.data-table {
      width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;
    }
    table.data-table th {
      background: rgba(18, 24, 34, 0.75);
      color: var(--slate-400); font-weight: 700; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.6px;
      padding: 12px 16px; border-bottom: 1px solid var(--card-border);
    }
    table.data-table td {
      padding: 13px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--slate-200); vertical-align: middle;
    }
    table.data-table tr:last-child td { border-bottom: none; }
    table.data-table tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* BADGES - Always white text, dark gray background, intense green/accent borders */
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 6px; font-size: 11px;
      font-weight: 700; font-family: 'JetBrains Mono', monospace;
      color: #ffffff !important;
      background: #181d26;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }
    .badge-celadon {
      background: #131d16; color: #ffffff !important;
      border: 1px solid rgba(42, 245, 39, 0.5);
      box-shadow: 0 0 10px rgba(42, 245, 39, 0.2);
    }
    .badge-slate {
      background: #181e29; color: #ffffff !important;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .badge-amber {
      background: #231c13; color: #ffffff !important;
      border: 1px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);
    }
    .badge-rose {
      background: #261418; color: #ffffff !important;
      border: 1px solid rgba(244, 63, 94, 0.5);
      box-shadow: 0 0 10px rgba(244, 63, 94, 0.15);
    }

    /* QUOTA PROGRESS BARS */
    .quota-bar-wrapper {
      width: 100%; height: 7px; background: rgba(0, 0, 0, 0.45);
      border-radius: 999px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.06);
      margin-top: 6px; position: relative;
    }
    .quota-bar-fill {
      height: 100%; border-radius: 999px;
      transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* CODE WIDGET */
    .code-box {
      background: #05070a; border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: var(--radius-sm); padding: 12px 16px;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      color: #ffffff !important; overflow-x: auto; white-space: pre;
    }

    /* MODAL */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      display: none; align-items: center; justify-content: center;
      z-index: 1000; padding: 20px;
    }
    .modal-card {
      background: #0d1117; border: 1px solid var(--card-border-highlight);
      border-radius: var(--radius-xl); max-width: 540px; width: 100%;
      padding: 28px; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.9);
      position: relative;
    }
    .modal-head {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .modal-title { font-size: 18px; font-weight: 800; color: var(--slate-50); }
    .close-btn {
      background: transparent; border: none; color: var(--slate-400);
      font-size: 22px; cursor: pointer;
    }
    .close-btn:hover { color: #fff; }
    .form-group { margin-bottom: 16px; }
    .form-label {
      display: block; font-size: 12px; font-weight: 700;
      color: #ffffff !important; margin-bottom: 6px; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-input {
      width: 100%; background: #06080c; border: 1px solid var(--card-border);
      border-radius: var(--radius-sm); padding: 10px 14px;
      color: #fff; font-size: 13px; font-family: inherit; outline: none;
    }
    .form-input:focus { border-color: #ffffff !important; box-shadow: 0 0 10px var(--celadon-glow); }
  </style>
</head>
<body>
<canvas id="matrixCanvas"></canvas>
<div class="container">

  <!-- TOP HEADER -->
  <header class="glass-panel">
    <div class="brand">
      <div class="logo-cube">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--celadon)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
      <div>
        <div class="brand-title">
          ANTIGRAVITY GATEWAY
          <span class="brand-pill">v2.0 Core</span>
        </div>
        <div style="font-size: 11px; color: var(--slate-400); font-family:JetBrains Mono,monospace;">
          API Endpoint: <span id="displayEndpoint" style="color:var(--celadon);">https://api.aihub.ovh/v1</span>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button class="btn btn-ghost" onclick="refreshAll()" title="Refresh Data & Quotas">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Refresh (<span id="refreshTimer" style="font-family:JetBrains Mono,monospace; color:var(--celadon);">20s</span>)
      </button>
      <button class="btn btn-ghost" onclick="openKeyModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-1-1l-3 3-2-2-3 3 2 2-3 3-2-2-3 3 2 2-3 3-2-2-3 3 2 2-2 2M3 21l3-3"/></svg>
        + New API Key
      </button>
      <button class="btn btn-celadon" onclick="openAccountModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        + Add Google Account
      </button>
      <button class="btn btn-danger" onclick="logout()" style="padding:9px 12px;" title="Logout from Admin Panel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>
  </header>

  <!-- FILTER & RANGE TOOLBAR -->
  <div class="glass-panel filter-bar">
    <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
      <span style="font-size:11px; font-weight:700; color:var(--slate-400); text-transform:uppercase; letter-spacing:0.8px;">Time Range:</span>
      <div class="time-tabs">
        <button class="tab-btn active" id="tab24h" onclick="setTimeRange('24h')">24 Hours</button>
        <button class="tab-btn" id="tab7d" onclick="setTimeRange('7d')">7 Days</button>
        <button class="tab-btn" id="tab30d" onclick="setTimeRange('30d')">30 Days</button>
        <button class="tab-btn" id="tabAll" onclick="setTimeRange('all')">All Time</button>
      </div>
    </div>

    <div class="filter-group">
      <select id="filterKeySelect" class="select-control" onchange="loadStats()">
        <option value="">All API Keys</option>
      </select>

      <select id="filterModelSelect" class="select-control" onchange="loadStats()">
        <option value="">All Models</option>
        <option value="claude-3-7-sonnet">claude-3-7-sonnet</option>
        <option value="claude-opus-4-6-thinking">claude-opus-4-6-thinking</option>
        <option value="gemini-3.8-flash-high">gemini-3.8-flash-high</option>
      </select>

      <select id="filterAccountSelect" class="select-control" onchange="loadStats()">
        <option value="">All Google Accounts</option>
      </select>

      <button class="btn btn-ghost" style="padding:7px 12px; font-size:12px;" onclick="resetFilters()" title="Reset Filters">
        ✕ Reset
      </button>
      <button class="btn btn-ghost" style="padding:7px 12px; font-size:12px;" onclick="exportCsv()" title="Export Logs to CSV">
        📊 CSV
      </button>
    </div>
  </div>

  <!-- KPI SUMMARY CARDS -->
  <div class="kpi-grid">
    <div class="glass-panel kpi-card glass-panel-interactive">
      <div class="kpi-label">
        Total Traffic
        <span class="badge badge-celadon">100% OK</span>
      </div>
      <div class="kpi-val" id="kpiRequests">0</div>
      <div class="kpi-sub">
        <span>Requests processed</span>
      </div>
    </div>

    <div class="glass-panel kpi-card glass-panel-interactive">
      <div class="kpi-label">
        Tokens Consumed (In / Out)
        <span class="badge badge-slate" id="kpiTokensTotalBadge">0 tok</span>
      </div>
      <div class="kpi-val" id="kpiTokens">0</div>
      <div class="kpi-sub">
        Input: <span class="kpi-accent" id="kpiPromptTokens">0</span> | Output: <span style="color:#38bdf8;" id="kpiCompTokens">0</span>
      </div>
    </div>

    <div class="glass-panel kpi-card glass-panel-interactive">
      <div class="kpi-label">
        Average Latency
        <span class="badge badge-celadon">Real-Time</span>
      </div>
      <div class="kpi-val" id="kpiLatency">0.00s</div>
      <div class="kpi-sub">
        <span>API generation response time</span>
      </div>
    </div>

    <div class="glass-panel kpi-card glass-panel-interactive">
      <div class="kpi-label">
        Estimated Savings
        <span class="badge badge-celadon">Anthropic / OpenAI</span>
      </div>
      <div class="kpi-val" id="kpiCostSaved" style="color:var(--celadon);">$0.00</div>
      <div class="kpi-sub">
        <span>Market token equivalence in USD</span>
      </div>
    </div>
  </div>

  <!-- CHARTS ROW -->
  <div class="charts-grid">
    <div class="glass-panel chart-card">
      <div class="chart-header">
        <div class="chart-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--celadon)" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          Usage Dynamics Over Time
        </div>
        <div class="time-tabs">
          <button class="tab-btn active" id="metricReqBtn" onclick="switchTimelineMetric('requests')">Requests</button>
          <button class="tab-btn" id="metricTokBtn" onclick="switchTimelineMetric('tokens')">Tokens</button>
          <button class="tab-btn" id="metricLatBtn" onclick="switchTimelineMetric('latency')">Latency (ms)</button>
        </div>
      </div>
      <div style="position:relative; height:240px;">
        <canvas id="timelineChart"></canvas>
      </div>
    </div>

    <div class="glass-panel chart-card">
      <div class="chart-header">
        <div class="chart-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--celadon)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10h-10z"/></svg>
          Model Distribution
        </div>
      </div>
      <div style="position:relative; height:240px;">
        <canvas id="modelChart"></canvas>
      </div>
    </div>
  </div>

  <!-- TOP 3 VERIFIED MODELS & PREFERRED SETTINGS -->
  <div class="glass-panel" style="padding: 22px; margin-bottom: 24px;">
    <div class="section-head">
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--celadon)" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Top 3 Active Models & Recommended Parameters (Context & Max Output)
      </div>
      <div style="font-size:11px; color:var(--slate-400); font-family:JetBrains Mono,monospace;">
        Ready to copy into Cursor / Windsurf / Cline / Zed
      </div>
    </div>

    <div class="data-table-wrapper" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Model ID</th>
            <th>Engineering Use Case</th>
            <th>Max Context (Input)</th>
            <th>Max Output Tokens</th>
            <th>Thinking / Reasoning</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color:#fff; font-family:JetBrains Mono,monospace;">claude-3-7-sonnet</strong></td>
            <td>Primary model for programming, deep code analysis, and complex reasoning</td>
            <td><span class="badge badge-celadon">200,000 tok (200k)</span></td>
            <td><span class="badge badge-celadon">64,000 tok (64k)</span></td>
            <td><span class="badge badge-slate">Budget: 32,768 (Active)</span></td>
            <td><span class="badge badge-celadon">🟢 Verified</span></td>
          </tr>
          <tr>
            <td><strong style="color:#fff; font-family:JetBrains Mono,monospace;">claude-opus-4-6-thinking</strong></td>
            <td>Highest compute tier — system architecture, complex multi-file algorithms, audits</td>
            <td><span class="badge badge-celadon">200,000 tok (200k)</span></td>
            <td><span class="badge badge-celadon">64,000 tok (64k)</span></td>
            <td><span class="badge badge-slate">Budget: 32,768 (Active)</span></td>
            <td><span class="badge badge-celadon">🟢 Verified</span></td>
          </tr>
          <tr>
            <td><strong style="color:#fff; font-family:JetBrains Mono,monospace;">gemini-3.8-flash-high</strong></td>
            <td>Ultra-fast high-throughput engine with massive 1M context, batch repository processing</td>
            <td><span class="badge badge-celadon" style="background:rgba(56,189,248,0.12); color:#38bdf8; border-color:rgba(56,189,248,0.3);">1,000,000 tok (1M)</span></td>
            <td><span class="badge badge-celadon">64,000 tok (64k)</span></td>
            <td><span class="badge badge-slate">Level: High</span></td>
            <td><span class="badge badge-celadon">🟢 Verified</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 1-CLICK CURSOR CONFIG WIDGET -->
    <div style="background: rgba(8, 11, 16, 0.7); border: 1px solid var(--card-border); border-radius: 12px; padding: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
        <span style="font-size:12px; font-weight:700; color:var(--slate-300);">
          ⚙️ Recommended Cursor / Windsurf Settings Configuration
        </span>
        <button class="btn btn-ghost" style="padding:4px 10px; font-size:11px;" onclick="copyCursorConfig()">
          📋 Copy Config JSON
        </button>
      </div>
      <div class="code-box" id="cursorConfigPreview">{
  "openai.baseUrl": "https://api.aihub.ovh/v1",
  "openai.apiKey": "sk-ag-YOUR-KEY-HERE",
  "customModels": [
    { "name": "claude-3-7-sonnet", "maxContext": 200000, "maxOutput": 64000, "thinking": true },
    { "name": "claude-opus-4-6-thinking", "maxContext": 200000, "maxOutput": 64000, "thinking": true },
    { "name": "gemini-3.8-flash-high", "maxContext": 1000000, "maxOutput": 64000, "thinking": true }
  ]
}</div>
    </div>
  </div>

  <!-- LIVE REQUEST LOG -->
  <div class="glass-panel" style="padding: 22px; margin-bottom: 24px;">
    <div class="section-head">
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--celadon)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Live Request Stream (Latest 25 Requests)
      </div>
      <div style="font-size:11px; color:var(--slate-400);">Auto-refreshes every 20s</div>
    </div>

    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>API Key</th>
            <th>Model</th>
            <th>Serving Google Account</th>
            <th>Latency</th>
            <th>Tokens (In / Out / Total)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="liveLogTableBody">
          <tr><td colspan="7" style="text-align:center; color:var(--slate-500); padding:20px;">No requests recorded yet for the selected filter.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- GOOGLE ACCOUNTS (FAILOVER POOL) WITH LIVE GOOGLE CLOUD QUOTAS -->
  <div class="glass-panel" style="padding: 22px; margin-bottom: 24px;">
    <div class="section-head">
      <div>
        <div class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--celadon)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Connected Google Accounts & Live Quota Meters (Google Cloud)
        </div>
        <div style="font-size:11px; color:var(--slate-400); margin-top:4px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span>Live per-account remaining capacity & exact reset times synced from CloudCode API</span>
          <span id="accountsQuotaSummary" class="badge badge-celadon" style="display:none; font-size:11px; padding:2px 8px;"></span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="btn btn-ghost" style="padding:7px 12px; font-size:12px;" onclick="syncAllQuotas()" title="Sync live quotas from Google Cloud">
          🔄 Sync Quotas
        </button>
        <button class="btn btn-celadon" style="padding:7px 12px; font-size:12px;" onclick="openAccountModal()">
          + Add Account
        </button>
      </div>
    </div>

    <div id="accountsList">
      <div style="text-align:center; padding:24px; color:var(--slate-500);">Loading live account quotas...</div>
    </div>
  </div>

  <!-- API KEYS MANAGEMENT -->
  <div class="glass-panel" style="padding: 22px;">
    <div class="section-head">
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--celadon)" stroke-width="2"><path d="M21 2l-2 2m-1-1l-3 3-2-2-3 3 2 2-3 3-2-2-3 3 2 2-3 3-2-2-3 3 2 2-2 2M3 21l3-3"/></svg>
        API Keys Management (Gateway Users)
      </div>
      <button class="btn btn-ghost" style="padding:7px 12px; font-size:12px;" onclick="openKeyModal()">
        + Create Key
      </button>
    </div>

    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>API Key</th>
            <th>Role</th>
            <th>Created</th>
            <th>Last Used</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="keysTableBody">
          <tr><td colspan="6" style="text-align:center; color:var(--slate-500); padding:20px;">No API keys created yet. Click "+ Create Key" above.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>

<!-- MODAL: ADD GOOGLE ACCOUNT -->
<div class="modal-overlay" id="accountModal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title">Connect Google Account</div>
      <button class="close-btn" onclick="closeAccountModal()">&times;</button>
    </div>
    <div style="font-size:13px; color:var(--slate-300); margin-bottom:16px; line-height:1.5;">
      Click the button below to authorize Antigravity Gateway with your Google Account, then copy the authorization code and paste it here:
    </div>
    <div style="margin-bottom:16px;">
      <a id="oauthLinkBtn" href="#" target="_blank" class="btn btn-celadon" style="width:100%; justify-content:center; padding:12px;">
        1. Open Google Authorization Page ↗
      </a>
    </div>
    <div class="form-group">
      <label class="form-label">2. Paste Authorization Code:</label>
      <input type="text" id="authCodeInput" class="form-input" placeholder="4/0AWgavdf...">
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
      <button class="btn btn-ghost" onclick="closeAccountModal()">Cancel</button>
      <button class="btn btn-celadon" onclick="submitAuthCode()">Submit & Connect Account</button>
    </div>
  </div>
</div>

<!-- MODAL: CREATE API KEY -->
<div class="modal-overlay" id="keyModal">
  <div class="modal-card">
    <div class="modal-head">
      <div class="modal-title">Generate New API Key</div>
      <button class="close-btn" onclick="closeKeyModal()">&times;</button>
    </div>
    <div class="form-group">
      <label class="form-label">Key Name / Identifier:</label>
      <input type="text" id="keyNameInput" class="form-input" placeholder="e.g. Cursor MacBook Pro">
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
      <button class="btn btn-ghost" onclick="closeKeyModal()">Cancel</button>
      <button class="btn btn-celadon" onclick="submitCreateKey()">Create Key</button>
    </div>
  </div>
</div>

<script>
  (function() {
    let adminToken = localStorage.getItem("ag_admin_token") || "";
    let currentRange = "24h";
    let activeTimelineMetric = "requests";
    let cachedStats = null;
    let timelineChart = null;
    let modelChart = null;

    if (window.location.hostname) {
      document.getElementById("displayEndpoint").textContent = window.location.protocol + "//" + window.location.host + "/v1";
    }

    if (!adminToken) {
      adminToken = prompt("Enter Admin Password (Swiat1976):");
      if (adminToken) {
        localStorage.setItem("ag_admin_token", adminToken);
      } else {
        document.body.innerHTML = '<div style="color:#fff; text-align:center; padding:50px;">Admin password required.</div>';
        return;
      }
    }

    window.logout = function() {
      localStorage.removeItem("ag_admin_token");
      location.reload();
    };

    window.setTimeRange = function(range) {
      currentRange = range;
      document.querySelectorAll(".time-tabs button[id^='tab']").forEach(b => b.classList.remove("active"));
      const btn = document.getElementById("tab" + range);
      if (btn) btn.classList.add("active");
      loadStats();
    };

    window.switchTimelineMetric = function(metric) {
      activeTimelineMetric = metric;
      document.getElementById("metricReqBtn").classList.toggle("active", metric === "requests");
      document.getElementById("metricTokBtn").classList.toggle("active", metric === "tokens");
      document.getElementById("metricLatBtn").classList.toggle("active", metric === "latency");
      if (cachedStats && cachedStats._timeline) {
        renderTimeline(cachedStats._timeline);
      }
    };

    window.resetFilters = function() {
      document.getElementById("filterKeySelect").value = "";
      document.getElementById("filterModelSelect").value = "";
      document.getElementById("filterAccountSelect").value = "";
      loadStats();
    };

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

        function getWeeklyResetSeconds() {
      var now = new Date();
      var target = new Date(now.getTime());
      var day = target.getUTCDay();
      // Weekly reset cycle anchor: Thursday 09:00:00 UTC (day 4)
      var daysToAdd = (4 - day + 7) % 7;
      target.setUTCDate(target.getUTCDate() + daysToAdd);
      target.setUTCHours(9, 0, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setUTCDate(target.getUTCDate() + 7);
      }
      return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    }

    function formatCockpitTime(seconds) {
      if (!seconds || seconds <= 0) return "0 minutes";
      if (seconds >= 86400) {
        var d = Math.floor(seconds / 86400);
        var h = Math.floor((seconds % 86400) / 3600);
        var dStr = d === 1 ? "1 day" : d + " days";
        var hStr = h === 1 ? "1 hour" : h + " hours";
        return dStr + ", " + hStr;
      }
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      if (h > 0) {
        var hStr = h === 1 ? "1 hour" : h + " hours";
        var mStr = m === 1 ? "1 minute" : m + " minutes";
        return hStr + ", " + mStr;
      }
      return m === 1 ? "1 minute" : m + " minutes";
    }

    function formatResetTime(seconds, iso) {
      if (!seconds || seconds <= 0) return "Ready / Available now";
      if (seconds >= 86400) {
        var days = Math.floor(seconds / 86400);
        var hours = Math.floor((seconds % 86400) / 3600);
        var mins = Math.floor((seconds % 3600) / 60);
        var dateStr = "";
        if (iso) {
          try {
            var d = new Date(iso);
            dateStr = " (" + d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ")";
          } catch(e) {}
        }
        return days + "d " + hours + "h " + mins + "m" + dateStr;
      }
      var h = Math.floor(seconds / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = seconds % 60;
      var dateStr = "";
      if (iso) {
        try {
          var d = new Date(iso);
          dateStr = " (" + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ")";
        } catch(e) {}
      }
      if (h > 0) return h + "h " + m + "m " + s + "s" + dateStr;
      return m + "m " + s + "s" + dateStr;
    }

    async function loadStats() {
      const key = document.getElementById("filterKeySelect").value;
      const model = document.getElementById("filterModelSelect").value;
      const account = document.getElementById("filterAccountSelect").value;

      let url = "/api/admin/stats?range=" + encodeURIComponent(currentRange);
      if (key) url += "&keyId=" + encodeURIComponent(key);
      if (model) url += "&model=" + encodeURIComponent(model);
      if (account) url += "&accountEmail=" + encodeURIComponent(account);

      try {
        const res = await fetch(url, { headers: { "x-admin-password": adminToken } });
        if (res.status === 401) { logout(); return; }
        const data = await res.json();

        // Build normalised timeline from parallel arrays returned by stats API
        const timelineNorm = (data.labels || []).map((lbl, i) => ({
          timestamp: lbl,
          requests: (data.requestsData || [])[i] || 0,
          tokens: (data.tokensData || [])[i] || 0,
          latencyMs: (data.latencyData || [])[i] || 0,
        }));
        data._timeline = timelineNorm;
        cachedStats = data;

        // KPI
        document.getElementById("kpiRequests").textContent = (data.totalRequests || 0).toLocaleString();
        document.getElementById("kpiTokens").textContent = (data.totalTokens || 0).toLocaleString();
        document.getElementById("kpiTokensTotalBadge").textContent = (data.totalTokens || 0).toLocaleString() + " tok";
        document.getElementById("kpiPromptTokens").textContent = (data.totalPromptTokens || 0).toLocaleString();
        document.getElementById("kpiCompTokens").textContent = (data.totalCompletionTokens || 0).toLocaleString();
        document.getElementById("kpiLatency").textContent = ((data.avgLatencyMs || 0) / 1000).toFixed(2) + "s";
        document.getElementById("kpiCostSaved").textContent = "$" + (data.estimatedCostSavedUsd || 0).toFixed(2);

        renderTimeline(timelineNorm);
        renderModelPie(data.models || []);
        renderLiveLogs(data.recentLogs || []);
      } catch (err) {
        console.error("Stats load error:", err);
      }
    }

    function renderTimeline(timeline) {
      const ctx = document.getElementById("timelineChart");
      if (!ctx) return;
      if (timelineChart) timelineChart.destroy();

      const labels = timeline.map(t => t.timestamp);
      let dataVals = [];
      let labelName = "Requests";
      let borderColor = "#2AF527";
      let bgColor = "rgba(42, 245, 39, 0.12)";

      if (activeTimelineMetric === "tokens") {
        dataVals = timeline.map(t => t.tokens);
        labelName = "Tokens";
        borderColor = "#38bdf8";
        bgColor = "rgba(56, 189, 248, 0.12)";
      } else if (activeTimelineMetric === "latency") {
        dataVals = timeline.map(t => t.latencyMs);
        labelName = "Latency (ms)";
        borderColor = "#f59e0b";
        bgColor = "rgba(245, 158, 11, 0.12)";
      } else {
        dataVals = timeline.map(t => t.requests);
      }

      timelineChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: labelName,
            data: dataVals,
            borderColor,
            backgroundColor: bgColor,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: "rgba(255, 255, 255, 0.04)" },
              ticks: { color: "#64748b", font: { size: 10 } }
            },
            y: {
              grid: { color: "rgba(255, 255, 255, 0.04)" },
              ticks: { color: "#64748b", font: { size: 10 } },
              beginAtZero: true
            }
          }
        }
      });
    }

    function renderModelPie(breakdown) {
      const ctx = document.getElementById("modelChart");
      if (!ctx) return;
      if (modelChart) modelChart.destroy();

      if (!breakdown || breakdown.length === 0) {
        breakdown = [{ model: "No data", totalTokens: 1, requests: 0 }];
      }

      const labels = breakdown.map(b => b.model);
      const dataVals = breakdown.map(b => b.totalTokens || b.requests || 1);
      const colors = ["#2AF527", "#38bdf8", "#818cf8", "#f43f5e"];

      modelChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{
            data: dataVals,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#0f131a"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#94a3b8", font: { size: 10 } }
            }
          }
        }
      });
    }

    function renderLiveLogs(logs) {
      const tbody = document.getElementById("liveLogTableBody");
      if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--slate-500); padding:20px;">No requests recorded yet for the selected filter.</td></tr>';
        return;
      }
      tbody.innerHTML = logs.map(l => {
        const timeStr = new Date(l.timestamp).toLocaleTimeString();
        const latencySec = ((l.latencyMs || 0) / 1000).toFixed(2) + "s";
        return [
          '<tr>',
            '<td style="font-family:JetBrains Mono,monospace; font-size:12px; color:var(--slate-400);">' + timeStr + '</td>',
            '<td><span class="badge badge-slate">' + escapeHtml(l.keyName || "Default Key") + '</span></td>',
            '<td><span class="badge badge-celadon">' + escapeHtml(l.model) + '</span></td>',
            '<td style="font-family:JetBrains Mono,monospace; font-size:12px; color:var(--slate-300);">' + escapeHtml(l.accountEmail || "(rotation)") + '</td>',
            '<td style="font-family:JetBrains Mono,monospace; color:var(--celadon);">' + latencySec + '</td>',
            '<td style="font-family:JetBrains Mono,monospace; font-size:12px;">' + (l.promptTokens || 0) + ' / ' + (l.completionTokens || 0) + ' (<strong style="color:#fff;">' + (l.totalTokens || 0) + '</strong>)</td>',
            '<td><span class="badge badge-celadon">200 OK</span></td>',
          '</tr>'
        ].join("");
      }).join("");
    }

    async function loadData() {
      try {
        const res = await fetch("/api/admin/data", { headers: { "x-admin-password": adminToken } });
        if (res.status === 401) { logout(); return; }
        const data = await res.json();
        renderAccounts(data.accounts || []);
        renderKeys(data.keys || []);
        populateFilterDropdowns(data.keys || [], data.accounts || []);
      } catch (err) {
        console.error("Data load error:", err);
      }
    }

    function populateFilterDropdowns(keys, accounts) {
      const keySelect = document.getElementById("filterKeySelect");
      const currentKey = keySelect.value;
      keySelect.innerHTML = '<option value="">All API Keys</option>' + keys.map(k => {
        return '<option value="' + escapeHtml(k.id) + '">' + escapeHtml(k.name) + '</option>';
      }).join("");
      keySelect.value = currentKey;

      const accSelect = document.getElementById("filterAccountSelect");
      const currentAcc = accSelect.value;
      accSelect.innerHTML = '<option value="">All Google Accounts</option>' + accounts.map(a => {
        return '<option value="' + escapeHtml(a.email) + '">' + escapeHtml(a.email) + '</option>';
      }).join("");
      accSelect.value = currentAcc;
    }

    function getBarColor(pct) {
      if (pct > 40) return "linear-gradient(90deg, #20d41d, #2AF527)";
      if (pct >= 15) return "linear-gradient(90deg, #d97706, #f59e0b)";
      return "linear-gradient(90deg, #e11d48, #f43f5e)";
    }

    function getQuotaColor(pct) {
      if (pct <= 0)  return { stroke: "rgba(255,255,255,0.18)", bar: "rgba(255,255,255,0.10)", pctColor: "rgba(255,255,255,0.35)", glow: "transparent" };
      if (pct < 10)  return { stroke: "#f43f5e",  bar: "linear-gradient(90deg,#be123c,#f43f5e)",  pctColor: "#f43f5e", glow: "#f43f5e" };
      if (pct < 40)  return { stroke: "#fb923c",  bar: "linear-gradient(90deg,#c2410c,#fb923c)",  pctColor: "#fb923c", glow: "#fb923c" };
      if (pct < 75)  return { stroke: "#f59e0b",  bar: "linear-gradient(90deg,#d97706,#f59e0b)",  pctColor: "#f59e0b", glow: "#f59e0b" };
      return           { stroke: "#2AF527",  bar: "linear-gradient(90deg,#20d41d,#2AF527)",  pctColor: "#2AF527", glow: "#2AF527" };
    }

    function getBarBadge(pct, isReset) {
      if (pct <= 0) return '<span class="badge badge-rose">0.0% Exhausted</span>';
      if (pct >= 90) return '<span class="badge badge-celadon">' + pct.toFixed(1) + '% Available</span>';
      if (pct >= 30) return '<span class="badge badge-amber">' + pct.toFixed(1) + '% Available</span>';
      return '<span class="badge badge-rose">' + pct.toFixed(1) + '% Available</span>';
    }

    function renderQuotaRow(label, pct, description, resetSec, isExhausted, tokenInfo, resetIso) {
      pct = Math.min(100, Math.max(0, pct));
      var pctDisplay = (pct % 1 === 0) ? pct.toFixed(0) : pct.toFixed(1);
      var colors = getQuotaColor(pct);

      var circumference = 87.96;
      var dashOffset = circumference - (circumference * (pct / 100));

      var progressBarHtml = "";
      if (isExhausted && resetSec > 0) {
        var totalWindow = resetSec > 86400 ? (7 * 86400) : (5 * 3600);
        var timeRemainingPct = Math.min(100, Math.max(3, Math.round((resetSec / totalWindow) * 100)));
        var barGrad = "linear-gradient(270deg, #be123c, #f43f5e)";
        var barGlow = "rgba(244, 63, 94, 0.35)";
        if (timeRemainingPct <= 25) {
          barGrad = "linear-gradient(270deg, #20d41d, #2AF527)";
          barGlow = "rgba(42, 245, 39, 0.4)";
        } else if (timeRemainingPct <= 60) {
          barGrad = "linear-gradient(270deg, #d97706, #f59e0b)";
          barGlow = "rgba(245, 158, 11, 0.35)";
        }
        progressBarHtml = [
          '<div class="quota-bar-wrapper" style="direction: rtl; background: rgba(255, 255, 255, 0.05); border-color: rgba(255,255,255,0.1); margin-top: 8px;">',
            '<div class="quota-bar-fill" style="width: ' + timeRemainingPct + '%; background: ' + barGrad + '; float: right; box-shadow: 0 0 10px ' + barGlow + ';"></div>',
          '</div>'
        ].join("");
      } else {
        progressBarHtml = [
          '<div class="quota-bar-wrapper" style="margin-top: 8px;">',
            '<div class="quota-bar-fill" style="width: ' + pct + '%; background: ' + colors.bar + '; box-shadow: 0 0 8px ' + colors.glow + '40;"></div>',
          '</div>'
        ].join("");
      }

      var resetBadgeHtml = "";
      if (resetSec > 0) {
        var badgeColor = isExhausted ? "#f43f5e" : (pct < 40 ? "#fb923c" : (pct < 75 ? "#f59e0b" : "#2AF527"));
        var badgeBg = isExhausted ? "rgba(244, 63, 94, 0.14)" : "rgba(42, 245, 39, 0.08)";
        var badgeBorder = isExhausted ? "rgba(244, 63, 94, 0.35)" : "rgba(42, 245, 39, 0.25)";
        resetBadgeHtml = '<div style="margin-top:6px; display:inline-flex; align-items:center; gap:6px; padding:3px 8px; border-radius:6px; background:' + badgeBg + '; border:1px solid ' + badgeBorder + '; font-size:11px; font-weight:700; color:' + badgeColor + '; letter-spacing:0.4px;">' +
          '<span>⏱ Resets in:</span> <span style="font-family:JetBrains Mono,monospace; font-size:11.5px; color:#ffffff;">' + formatResetTime(resetSec, resetIso) + '</span>' +
        '</div>';
      } else {
        resetBadgeHtml = '<div style="margin-top:6px; display:inline-flex; align-items:center; gap:6px; padding:3px 8px; border-radius:6px; background:rgba(42,245,39,0.06); border:1px solid rgba(42,245,39,0.2); font-size:11px; font-weight:600; color:#2AF527;">' +
          '<span>⏱ Resets in:</span> <span style="font-family:JetBrains Mono,monospace; font-size:11.5px; color:#5df75a;">Ready / Full Capacity</span>' +
        '</div>';
      }

      var tokenBadgeHtml = "";
      if (tokenInfo) {
        if (tokenInfo.type === "5h") {
          var rem = tokenInfo.remainingTokens || 0;
          var max = tokenInfo.maxTokens || 0;
          var used = tokenInfo.usedTokens || 0;
          var tokColor = isExhausted ? "#f43f5e" : (pct < 40 ? "#fb923c" : "#2AF527");
          tokenBadgeHtml = '<div style="margin-top:5px; font-size:11.5px; font-family:JetBrains Mono,monospace; color:var(--slate-300);">' +
            'Tokens: <strong style="color:' + tokColor + ';">' + rem.toLocaleString() + '</strong> / ' + max.toLocaleString() + ' remaining ' +
            '<span style="color:var(--slate-400); font-size:10.5px;">(' + used.toLocaleString() + ' used)</span>' +
          '</div>';
        } else if (tokenInfo.type === "weekly") {
          if (isExhausted) {
            tokenBadgeHtml = '<div style="margin-top:5px; font-size:11.5px; font-family:JetBrains Mono,monospace; color:#f43f5e;">' +
              'Weekly Cap: <strong style="color:#f43f5e;">0 tokens remaining</strong> (Quota exhausted until reset)' +
            '</div>';
          } else {
            tokenBadgeHtml = '<div style="margin-top:5px; font-size:11.5px; font-family:JetBrains Mono,monospace; color:var(--slate-300);">' +
              'Weekly Traffic: <strong style="color:#38bdf8;">' + (tokenInfo.tokens || 0).toLocaleString() + '</strong> tokens handled ' +
              '<span style="color:var(--slate-400); font-size:10.5px;">(' + (tokenInfo.requests || 0) + ' req)</span>' +
            '</div>';
          }
        }
      }

      return [
        '<div style="padding: 12px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">',
          '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">',
            '<div style="flex: 1;">',
              '<div style="font-size: 13px; font-weight: 600; color: #f1f5f9;">' + label + '</div>',
              '<div style="font-size: 11px; color: var(--slate-400); margin-top: 3px; line-height: 1.4;">' + description + '</div>',
              tokenBadgeHtml,
              resetBadgeHtml,
            '</div>',
            '<div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">',
              '<span style="font-size: 15px; font-weight: 800; color: ' + colors.pctColor + '; font-family: JetBrains Mono, monospace; text-shadow: 0 0 10px ' + colors.glow + '70;">' + pctDisplay + '%</span>',
              '<div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">',
                '<svg width="32" height="32" viewBox="0 0 36 36">',
                  '<circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="3.5"></circle>',
                  '<circle cx="18" cy="18" r="14" fill="none" stroke="' + colors.stroke + '" stroke-width="3.5" stroke-dasharray="87.96" stroke-dashoffset="' + dashOffset.toFixed(2) + '" stroke-linecap="round" transform="rotate(-90 18 18)" style="transition: stroke-dashoffset 0.6s ease; filter: drop-shadow(0 0 3px ' + colors.glow + '90);"></circle>',
                '</svg>',
              '</div>',
            '</div>',
          '</div>',
          progressBarHtml,
        '</div>'
      ].join("");
    }

    function renderAccounts(accounts) {
      var list = document.getElementById("accountsList");
      if (!accounts || accounts.length === 0) {
        list.innerHTML = '<div style="color:var(--slate-500); padding:20px; text-align:center;">No Google accounts connected yet. Click "+ Add Account" above.</div>';
        return;
      }

      var summaryEl = document.getElementById("accountsQuotaSummary");
      if (summaryEl) {
        var activeCount = 0;
        var claudeTokSum = 0;
        accounts.forEach(function(a) {
          var cQ = a.claudeQuota || {};
          var isEx = a.status === "rate_limited" || cQ.resetSeconds > 86400 || (cQ.remainingPercentage <= 0 && cQ.resetSeconds > 0);
          if (!isEx) activeCount++;
          claudeTokSum += (cQ.remainingTokens != null ? cQ.remainingTokens : (cQ.maxTokens || 250000));
        });
        summaryEl.style.display = "inline-flex";
        summaryEl.textContent = accounts.length + " Accounts (" + activeCount + " Claude Active) • " + (claudeTokSum > 0 ? (claudeTokSum >= 1000000 ? (claudeTokSum/1000000).toFixed(2) + "M" : (claudeTokSum/1000).toFixed(0) + "k") : "0") + " Claude Tokens Ready";
      }

      var lastGoogleModel = "gemini-3.8-flash-high";
      var lastAnthropicModel = "claude-3-7-sonnet";

      if (cachedStats && cachedStats.recentLogs && cachedStats.recentLogs.length > 0) {
        var foundG = false, foundA = false;
        for (var i = 0; i < cachedStats.recentLogs.length; i++) {
          var m = cachedStats.recentLogs[i].model || "";
          if (!foundG && (m.indexOf("gemini") !== -1 || m.indexOf("flash") !== -1)) {
            lastGoogleModel = m;
            foundG = true;
          }
          if (!foundA && (m.indexOf("claude") !== -1 || m.indexOf("sonnet") !== -1 || m.indexOf("opus") !== -1)) {
            lastAnthropicModel = m;
            foundA = true;
          }
          if (foundG && foundA) break;
        }
      }
      list.innerHTML = accounts.map(function(a) {
        var isCooldown = a.status === "rate_limited";
        var r5h = a.requests5h || 0;
        var t5h = (a.tokens5h || 0).toLocaleString();
        var r7d = a.requests7d || 0;
        var t7d = (a.tokens7d || 0).toLocaleString();

        var claudeQ = a.claudeQuota || { remainingPercentage: 100, resetSeconds: 0, maxTokens: 250000, remainingTokens: 250000, usedTokens: 0 };
        var geminiQ = a.geminiQuota || { remainingPercentage: 100, resetSeconds: 0, maxTokens: 1048576, remainingTokens: 1048576, usedTokens: 0 };

        var globalWeeklyResetSec = getWeeklyResetSeconds();

        // Claude Limits
        var isClaudeWeeklyExhausted = (typeof claudeQ.weeklyPercentage === "number" && claudeQ.weeklyPercentage <= 0) || claudeQ.resetSeconds > 86400 || ((claudeQ.weeklyResetSeconds || 0) > 86400 && typeof claudeQ.weeklyPercentage === "number" && claudeQ.weeklyPercentage <= 0);
        var isClaude5hExhausted = a.status === "rate_limited" || ((claudeQ.remainingPercentage <= 0 || !claudeQ.remainingPercentage) && claudeQ.resetSeconds > 0 && claudeQ.resetSeconds <= 86400);
        var claude5hResetSec = (claudeQ.resetSeconds > 0 && claudeQ.resetSeconds <= 86400) ? claudeQ.resetSeconds : (a.cooldownRemainingSeconds || 0);
        var claudeWeeklyResetSec = (claudeQ.weeklyResetSeconds && claudeQ.weeklyResetSeconds > 0) ? claudeQ.weeklyResetSeconds : (isClaudeWeeklyExhausted ? claudeQ.resetSeconds : globalWeeklyResetSec);

        var claude5hPct = (isClaude5hExhausted || isClaudeWeeklyExhausted) ? 0 : (typeof claudeQ.remainingPercentage === "number" ? claudeQ.remainingPercentage : 100);
        var claudeWeeklyPct = (typeof claudeQ.weeklyPercentage === "number") ? claudeQ.weeklyPercentage : (isClaudeWeeklyExhausted ? 0 : 100);

        var claude5hDesc = claudeQ.description || "";
        if (!claude5hDesc) {
          if (isClaudeWeeklyExhausted) {
            claude5hDesc = "Weekly cap reached — rolling 5-hour limit is locked until weekly reset.";
          } else if (isClaude5hExhausted) {
            claude5hDesc = "You have hit your 5-hour limit, it will refresh in " + formatResetTime(claude5hResetSec, claudeQ.resetTime) + ".";
          } else if (claude5hPct < 100) {
            claude5hDesc = "Rolling 5-hour window: " + claude5hPct.toFixed(1) + "% capacity available (" + (claudeQ.usedTokens || 0).toLocaleString() + " tokens used).";
          } else {
            claude5hDesc = "100% capacity available. Ready for complex coding & reasoning.";
          }
        }

        var claudeWeeklyDesc = claudeQ.weeklyDescription || "";
        if (!claudeWeeklyDesc) {
          if (isClaudeWeeklyExhausted) {
            claudeWeeklyDesc = "Weekly cap reached! Account locked until " + formatResetTime(claudeWeeklyResetSec, claudeQ.weeklyResetTime || claudeQ.resetTime) + ". Automatic failover active.";
          } else if (isClaude5hExhausted) {
            claudeWeeklyDesc = "5-hour limit active; weekly limit remains healthy. Next cycle in " + formatResetTime(claude5hResetSec, claudeQ.resetTime) + ".";
          } else if (claudeWeeklyPct < 100) {
            claudeWeeklyDesc = "Weekly window healthy. " + (a.tokens7d || 0).toLocaleString() + " tokens processed across " + (a.requests7d || 0) + " requests this week.";
          } else {
            claudeWeeklyDesc = "100% weekly capacity available. Active and uncapped for current period.";
          }
        }

        // Gemini Limits
        var isGeminiWeeklyExhausted = (typeof geminiQ.weeklyPercentage === "number" && geminiQ.weeklyPercentage <= 0) || geminiQ.resetSeconds > 86400 || ((geminiQ.weeklyResetSeconds || 0) > 86400 && typeof geminiQ.weeklyPercentage === "number" && geminiQ.weeklyPercentage <= 0);
        var isGemini5hExhausted = ((geminiQ.remainingPercentage <= 0 || !geminiQ.remainingPercentage) && geminiQ.resetSeconds > 0 && geminiQ.resetSeconds <= 86400);
        var gemini5hResetSec = (geminiQ.resetSeconds > 0 && geminiQ.resetSeconds <= 86400) ? geminiQ.resetSeconds : 0;
        var geminiWeeklyResetSec = (geminiQ.weeklyResetSeconds && geminiQ.weeklyResetSeconds > 0) ? geminiQ.weeklyResetSeconds : (isGeminiWeeklyExhausted ? geminiQ.resetSeconds : globalWeeklyResetSec);

        var gemini5hPct = (isGemini5hExhausted || isGeminiWeeklyExhausted) ? 0 : (typeof geminiQ.remainingPercentage === "number" ? geminiQ.remainingPercentage : 100);
        var geminiWeeklyPct = (typeof geminiQ.weeklyPercentage === "number") ? geminiQ.weeklyPercentage : (isGeminiWeeklyExhausted ? 0 : 100);

        var gemini5hDesc = geminiQ.description || "";
        if (!gemini5hDesc) {
          if (isGeminiWeeklyExhausted) {
            gemini5hDesc = "Weekly limit reached — Gemini rolling limit is locked until weekly reset.";
          } else if (isGemini5hExhausted) {
            gemini5hDesc = "You have hit your 5-hour limit, it will refresh in " + formatResetTime(gemini5hResetSec, geminiQ.resetTime) + ".";
          } else if (gemini5hPct < 100) {
            gemini5hDesc = "Rolling 5-hour window: " + gemini5hPct.toFixed(1) + "% capacity available (" + (geminiQ.usedTokens || 0).toLocaleString() + " tokens used).";
          } else {
            gemini5hDesc = "100% capacity available. Ready for high-throughput generation.";
          }
        }

        var geminiWeeklyDesc = geminiQ.weeklyDescription || "";
        if (!geminiWeeklyDesc) {
          if (isGeminiWeeklyExhausted) {
            geminiWeeklyDesc = "Weekly cap reached! Account locked until " + formatResetTime(geminiWeeklyResetSec, geminiQ.weeklyResetTime || geminiQ.resetTime) + ". Automatic failover active.";
          } else if (isGemini5hExhausted) {
            geminiWeeklyDesc = "5-hour limit active; weekly limit remains healthy. Next cycle in " + formatResetTime(gemini5hResetSec, geminiQ.resetTime) + ".";
          } else {
            geminiWeeklyDesc = "Weekly window healthy. 1,000,000 token context window available.";
          }
        }

        var isAccountExhausted = isClaudeWeeklyExhausted || isGeminiWeeklyExhausted || isClaude5hExhausted || isGemini5hExhausted || isCooldown;

        var statusBadge = '<span class="badge badge-celadon">🟢 Active (Ready)</span>';
        if (isClaudeWeeklyExhausted || isGeminiWeeklyExhausted) {
          statusBadge = '<span class="badge badge-rose" style="border: 1px solid #f43f5e; box-shadow: 0 0 8px rgba(244,63,94,0.4);">⛔ Weekly Capped</span>';
        } else if (isCooldown || isClaude5hExhausted || isGemini5hExhausted) {
          statusBadge = '<span class="badge badge-amber" style="border: 1px solid #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.3);">⏳ Rate Limited (5h)</span>';
        }

        var cardStyle = isAccountExhausted
          ? 'background: rgba(22, 14, 19, 0.85); border: 2px solid #f43f5e; border-top: 2px solid #fb7185; box-shadow: 0 0 20px rgba(244, 63, 94, 0.25), inset 0 0 15px rgba(244, 63, 94, 0.06); border-radius: 14px; padding: 18px; margin-bottom: 14px; transition: all 0.3s ease;'
          : 'background: rgba(13, 17, 24, 0.7); border: 1px solid var(--card-border); border-top: 1px solid var(--card-border-highlight); border-radius: 14px; padding: 18px; margin-bottom: 14px; transition: all 0.3s ease;';

        var avatarStyle = isAccountExhausted
          ? 'width:36px; height:36px; border-radius:10px; background: rgba(244, 63, 94, 0.15); border: 1.5px solid rgba(244, 63, 94, 0.6); display:flex; align-items:center; justify-content:center; font-size:18px;'
          : 'width:36px; height:36px; border-radius:10px; background: rgba(45,212,191,0.08); border: 1px solid var(--celadon-border); display:flex; align-items:center; justify-content:center; font-size:18px;';

        return [
          '<div style="' + cardStyle + '">',
            '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom: 14px;">',
              '<div style="display:flex; align-items:center; gap:12px;">',
                '<div style="' + avatarStyle + '">',
                  (isClaudeWeeklyExhausted || isGeminiWeeklyExhausted ? "⛔" : (isCooldown || isClaude5hExhausted || isGemini5hExhausted ? "⏳" : "🟢")),
                '</div>',
                '<div>',
                  '<div style="font-weight:700; font-size:14px; color:var(--slate-50);">' + escapeHtml(a.email) + '</div>',
                  '<div style="font-size:11px; color:var(--slate-400);">Project: <span style="font-family:JetBrains Mono,monospace; color:var(--celadon);">' + escapeHtml(a.projectId || "(auto-discovery)") + '</span></div>',
                '</div>',
              '</div>',

              '<div style="display:flex; align-items:center; gap:8px;">',
                statusBadge,
                '<button class="btn btn-danger" style="padding:5px 12px; font-size:12px;" data-email="' + escapeHtml(a.email) + '" onclick="deleteAccount(this.dataset.email)">🗑️ Remove</button>',
              '</div>',
            '</div>',

            '<!-- 4 QUOTA METERS: GEMINI & CLAUDE (5H AND WEEKLY) -->',
            '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 12px;">',

              '<!-- GEMINI MODELS CARD -->',
              '<div style="background: rgba(14, 18, 24, 0.7); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px;">',
                '<div style="font-size: 13px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">',
                  '<div style="display:flex; align-items:center; gap:6px;">',
                    '<span>Gemini Models</span>',
                    '<span style="font-size: 11px; color: var(--slate-400); cursor: help;" title="Google AI models quota">ⓘ</span>',
                  '</div>',
                  '<span class="badge badge-slate" style="font-size:10px; padding:2px 8px; border-color:rgba(56,189,248,0.3); color:#38bdf8 !important;">' + escapeHtml(lastGoogleModel) + '</span>',
                '</div>',
                renderQuotaRow("Weekly Limit Remaining", geminiWeeklyPct, geminiWeeklyDesc, geminiWeeklyResetSec, isGeminiWeeklyExhausted, { type: "weekly", requests: a.requests7d || 0, tokens: a.tokens7d || 0, maxTokens: geminiQ.maxTokens || 1048576 }, geminiQ.weeklyResetTime || (isGeminiWeeklyExhausted ? geminiQ.resetTime : undefined)),
                renderQuotaRow("Five Hour Limit Remaining", gemini5hPct, gemini5hDesc, gemini5hResetSec, isGemini5hExhausted, { type: "5h", maxTokens: geminiQ.maxTokens || 1048576, remainingTokens: isGemini5hExhausted ? 0 : (geminiQ.remainingTokens ?? 1048576), usedTokens: isGemini5hExhausted ? (geminiQ.maxTokens || 1048576) : (geminiQ.usedTokens || 0) }, geminiQ.resetTime),
              '</div>',

              '<!-- CLAUDE AND GPT MODELS CARD -->',
              '<div style="background: rgba(14, 18, 24, 0.7); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px;">',
                '<div style="font-size: 13px; font-weight: 700; color: #ffffff; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">',
                  '<div style="display:flex; align-items:center; gap:6px;">',
                    '<span>Claude and GPT models</span>',
                    '<span style="font-size: 11px; color: var(--slate-400); cursor: help;" title="Anthropic Claude & GPT models quota">ⓘ</span>',
                  '</div>',
                  '<span class="badge badge-slate" style="font-size:10px; padding:2px 8px; border-color:rgba(42,245,39,0.3); color:#2AF527 !important;">' + escapeHtml(lastAnthropicModel) + '</span>',
                '</div>',
                renderQuotaRow("Weekly Limit Remaining", claudeWeeklyPct, claudeWeeklyDesc, claudeWeeklyResetSec, isClaudeWeeklyExhausted, { type: "weekly", requests: a.requests7d || 0, tokens: a.tokens7d || 0, maxTokens: claudeQ.maxTokens || 250000 }, claudeQ.weeklyResetTime || (isClaudeWeeklyExhausted ? claudeQ.resetTime : undefined)),
                renderQuotaRow("Five Hour Limit Remaining", claude5hPct, claude5hDesc, claude5hResetSec, isClaude5hExhausted, { type: "5h", maxTokens: claudeQ.maxTokens || 250000, remainingTokens: (isClaude5hExhausted || isClaudeWeeklyExhausted) ? 0 : (claudeQ.remainingTokens ?? 250000), usedTokens: (isClaude5hExhausted || isClaudeWeeklyExhausted) ? (claudeQ.maxTokens || 250000) : (claudeQ.usedTokens || 0) }, claudeQ.resetTime),
              '</div>',

            '</div>',

            '<!-- TELEMETRY FOOTER -->',
            '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:11px; color:var(--slate-400); padding:2px 4px;">',
              '<span>Live CloudCode v1internal API Sync</span>',
              '<span>Gateway traffic handled: <strong>' + r5h + ' req</strong> (' + t5h + ' tok) in 5h | <strong>' + r7d + ' req</strong> (' + t7d + ' tok) in 7d</span>',
            '</div>',
          '</div>'
        ].join("");
      }).join("");
    }

    function renderKeys(keys) {
      const tbody = document.getElementById("keysTableBody");
      if (!keys || keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--slate-500); padding:20px;">No API keys found. Click "+ Create Key" to generate one.</td></tr>';
        return;
      }
      tbody.innerHTML = keys.map(k => {
        const createdDate = new Date(k.createdAt).toLocaleDateString();
        const lastUsedDate = k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never";
        const maskedKey = k.key.substring(0, 10) + "..." + k.key.substring(k.key.length - 4);
        return [
          '<tr>',
            '<td><strong style="color:#fff;">' + escapeHtml(k.name) + '</strong></td>',
            '<td>',
              '<span style="font-family:JetBrains Mono,monospace; color:var(--celadon); font-size:12px;">' + maskedKey + '</span>',
              ' <button class="btn btn-ghost" style="padding:2px 6px; font-size:10px;" data-key="' + escapeHtml(k.key) + '" onclick="copyToClipboard(this.dataset.key)">Copy</button>',
            '</td>',
            '<td><span class="badge badge-slate">' + escapeHtml(k.role || "user") + '</span></td>',
            '<td style="color:var(--slate-400); font-size:12px;">' + createdDate + '</td>',
            '<td style="color:var(--slate-400); font-size:12px;">' + lastUsedDate + '</td>',
            '<td><button class="btn btn-danger" style="padding:4px 10px; font-size:11px;" data-id="' + escapeHtml(k.id) + '" onclick="revokeKey(this.dataset.id)">Revoke</button></td>',
          '</tr>'
        ].join("");
      }).join("");
    }

    window.syncAllQuotas = async function() {
      const btn = event?.target;
      if (btn) btn.textContent = "⏳ Syncing...";
      try {
        const res = await fetch("/api/admin/accounts/refresh-quota", {
          method: "POST",
          headers: { "x-admin-password": adminToken }
        });
        const d = await res.json();
        if (d.accounts) {
          renderAccounts(d.accounts);
        } else {
          loadData();
        }
      } catch (err) {
        console.error("Quota sync error:", err);
      } finally {
        if (btn) btn.textContent = "🔄 Sync Quotas";
      }
    };

    // Modal Handlers
    window.openAccountModal = async function() {
      document.getElementById("accountModal").style.display = "flex";
      try {
        const res = await fetch("/api/admin/oauth-url", { headers: { "x-admin-password": adminToken } });
        const d = await res.json();
        if (d.url) {
          document.getElementById("oauthLinkBtn").href = d.url;
        }
      } catch (err) {
        console.error("Failed to load OAuth URL:", err);
      }
    };

    window.closeAccountModal = function() {
      document.getElementById("accountModal").style.display = "none";
      document.getElementById("authCodeInput").value = "";
    };

    window.submitAuthCode = async function() {
      const code = document.getElementById("authCodeInput").value.trim();
      if (!code) { alert("Please enter the authorization code"); return; }
      try {
        const res = await fetch("/api/admin/accounts/oauth-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
          body: JSON.stringify({ code })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed to connect account");
        alert("Account connected successfully: " + (d.account?.email || "OK"));
        closeAccountModal();
        refreshAll();
      } catch (err) {
        alert("Error: " + err.message);
      }
    };

    window.deleteAccount = async function(email) {
      if (!confirm("Are you sure you want to remove account: " + email + "?")) return;
      try {
        const res = await fetch("/api/admin/accounts/" + encodeURIComponent(email), {
          method: "DELETE",
          headers: { "x-admin-password": adminToken }
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed to delete account");
        refreshAll();
      } catch (err) {
        alert(err.message);
      }
    };

    window.openKeyModal = function() {
      document.getElementById("keyModal").style.display = "flex";
    };

    window.closeKeyModal = function() {
      document.getElementById("keyModal").style.display = "none";
      document.getElementById("keyNameInput").value = "";
    };

    window.submitCreateKey = async function() {
      const name = document.getElementById("keyNameInput").value.trim();
      if (!name) { alert("Please enter a key name"); return; }
      try {
        const res = await fetch("/api/admin/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": adminToken },
          body: JSON.stringify({ name })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed to create key");
        alert("New API Key created successfully:\\n\\n" + d.key.key + "\\n\\nStore this key safely!");
        closeKeyModal();
        refreshAll();
      } catch (err) {
        alert("Error: " + err.message);
      }
    };

    window.revokeKey = async function(id) {
      if (!confirm("Are you sure you want to revoke this API key?")) return;
      try {
        const res = await fetch("/api/admin/keys/" + encodeURIComponent(id), {
          method: "DELETE",
          headers: { "x-admin-password": adminToken }
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed to revoke key");
        refreshAll();
      } catch (err) {
        alert(err.message);
      }
    };

    window.copyToClipboard = function(text) {
      navigator.clipboard.writeText(text).then(function() {
        alert("Copied to clipboard: " + text);
      }).catch(function(err) {
        prompt("Copy API Key manually:", text);
      });
    };

    window.copyCursorConfig = function() {
      const code = document.getElementById("cursorConfigPreview").textContent;
      navigator.clipboard.writeText(code).then(function() {
        alert("Cursor configuration JSON copied to clipboard!");
      }).catch(function() {
        prompt("Copy Cursor Config:", code);
      });
    };

    window.exportCsv = function() {
      if (!cachedStats || !cachedStats.recentLogs || cachedStats.recentLogs.length === 0) {
        alert("No request logs available to export");
        return;
      }
      let csv = "Timestamp,Date,Model,Account,KeyName,PromptTokens,CompletionTokens,TotalTokens,LatencyMs\\n";
      cachedStats.recentLogs.forEach(r => {
        csv += [
          r.timestamp,
          '"' + new Date(r.timestamp).toISOString() + '"',
          '"' + (r.model || "") + '"',
          '"' + (r.accountEmail || "") + '"',
          '"' + (r.keyName || "") + '"',
          r.promptTokens || 0,
          r.completionTokens || 0,
          r.totalTokens || 0,
          r.latencyMs || 0
        ].join(",") + "\\n";
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "antigravity_logs_" + currentRange + ".csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

        // Matrix Code Rain Animation
    (function initMatrix() {
      var canvas = document.getElementById("matrixCanvas");
      if (!canvas) return;
      var ctx = canvas.getContext("2d");
      var w = canvas.width = window.innerWidth;
      var h = canvas.height = window.innerHeight;
      var chars = "0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜXYZ";
      var fontSize = 13;
      var cols = Math.floor(w / fontSize);
      var ypos = Array(cols).fill(0);

      function draw() {
        ctx.fillStyle = "rgba(14, 18, 23, 0.08)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#2AF527";
        ctx.font = fontSize + "px 'JetBrains Mono', monospace";
        for (var i = 0; i < ypos.length; i++) {
          var char = chars[Math.floor(Math.random() * chars.length)];
          var x = i * fontSize;
          var y = ypos[i] * fontSize;
          ctx.fillText(char, x, y);
          if (y > 100 + Math.random() * 10000) ypos[i] = 0;
          else ypos[i]++;
        }
      }
      setInterval(draw, 45);
      window.addEventListener("resize", function() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        cols = Math.floor(w / fontSize);
        ypos = Array(cols).fill(0);
      });
    })();

    var countdownSec = 20;
    function updateCountdown() {
      countdownSec--;
      var el = document.getElementById("refreshTimer");
      if (el) el.textContent = countdownSec + "s";
      if (countdownSec <= 0) {
        countdownSec = 20;
        refreshAll();
      }
    }

    window.refreshAll = function() {
      countdownSec = 20;
      var el = document.getElementById("refreshTimer");
      if (el) el.textContent = "20s";
      loadStats();
      loadData();
    };

    refreshAll();
    setInterval(updateCountdown, 1000);
  })();
</script>
</body>
</html>`;
}
