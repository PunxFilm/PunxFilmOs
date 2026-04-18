"use client";

import { Icon } from "@/components/icon";
import { useShell } from "@/components/shell-context";

export function AiPanel() {
  const { aiOn, setAiOn } = useShell();
  if (!aiOn) return null;

  return (
    <div className="ai-panel">
      <div className="ai-head">
        <span className="ai-pill">PunxBrain</span>
        <span className="tiny" style={{ marginLeft: "auto" }}>
          Claude Sonnet 4
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setAiOn(false)}
          aria-label="Chiudi"
        >
          <Icon name="close" size={12} />
        </button>
      </div>
      <div className="ai-body">
        <div className="ai-msg">
          <div className="ai-label">
            <Icon name="spark" size={10} />
            suggerimento contestuale
          </div>
          Hai deadline nei prossimi 7 giorni. Vuoi che prepari le bozze delle
          iscrizioni e precompili i moduli FilmFreeway?
          <div className="row gap-2" style={{ marginTop: 8 }}>
            <button type="button" className="btn sm">
              Sì, procedi
            </button>
            <button type="button" className="btn sm ghost">
              No grazie
            </button>
          </div>
        </div>
        <div className="ai-msg">
          <div className="ai-label">
            <Icon name="spark" size={10} />
            analisi pattern
          </div>
          Il tuo profilo di submission suggerisce di puntare su festival con
          tema &laquo;design&raquo; più che pura animazione per i prossimi
          cicli.
        </div>
        <div className="ai-msg">
          <div className="ai-label">
            <Icon name="trophy" size={10} />
            opportunità
          </div>
          Posso generarti una lista di buyer internazionali per i film che
          hanno vinto premi recenti.
          <div className="row gap-2" style={{ marginTop: 8 }}>
            <button type="button" className="btn sm">
              Genera lista
            </button>
          </div>
        </div>
      </div>
      <div className="ai-foot">
        <textarea
          className="ai-input"
          rows={2}
          placeholder="Chiedi a PunxBrain…"
        />
        <div className="row gap-2" style={{ marginTop: 8 }}>
          <span className="chip tiny">Analizza film</span>
          <span className="chip tiny">Rank festival</span>
          <button
            type="button"
            className="btn sm accent"
            style={{ marginLeft: "auto" }}
          >
            Invia
          </button>
        </div>
      </div>
    </div>
  );
}
