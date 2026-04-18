"use client";

/**
 * GoogleDrivePicker — bottone che apre il Google Picker,
 * l'utente sceglie uno o più file da Drive, il componente scarica i bytes
 * via Drive API (scope drive.readonly) e restituisce File[] nativi al caller.
 *
 * Env vars richieste (tutte public, nessun segreto lato client):
 *  - NEXT_PUBLIC_GOOGLE_CLIENT_ID
 *  - NEXT_PUBLIC_GOOGLE_API_KEY
 *  - NEXT_PUBLIC_GOOGLE_APP_ID (il numero del progetto su Google Cloud)
 *
 * Setup Google Cloud (una tantum):
 *  1. https://console.cloud.google.com/ → crea progetto
 *  2. "APIs & Services" → abilita "Google Picker API" e "Google Drive API"
 *  3. "APIs & Services" → "Credentials":
 *      - crea "API key" (restringi a Picker API + Drive API)
 *      - crea "OAuth client ID" tipo "Web application", aggiungi l'origin
 *        https://punxfilm-app-production.up.railway.app e http://localhost:3000
 *  4. "APIs & Services" → "OAuth consent screen": tipo External, aggiungi
 *     scope https://www.googleapis.com/auth/drive.readonly, aggiungi l'email
 *     simone.rossi121@gmail.com come test user (finché l'app è "Testing").
 */

import { useState, useRef, useCallback, useEffect } from "react";

// Tipi minimi — le API Google non hanno types ufficiali stabili
type TokenClient = {
  callback: (resp: { access_token?: string; error?: string }) => void;
  requestAccessToken: (opts?: { prompt?: string }) => void;
};
type PickerDoc = { id: string; name: string; mimeType: string; sizeBytes?: string };
type PickerResp = { action: string; docs?: PickerDoc[] };

declare global {
  interface Window {
    gapi?: {
      load: (lib: string, cb: () => void) => void;
    };
    google?: {
      accounts?: {
        oauth2: {
          initTokenClient: (opts: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }) => TokenClient;
        };
      };
      picker?: {
        PickerBuilder: new () => PickerBuilder;
        DocsView: new (viewId?: string) => DocsView;
        ViewId: { DOCS: string; PDFS: string; SPREADSHEETS: string; FOLDERS: string };
        Feature: { MULTISELECT_ENABLED: string; NAV_HIDDEN: string };
        Action: { PICKED: string; CANCEL: string; LOADED: string };
      };
    };
  }
}
interface DocsView {
  setMimeTypes: (mt: string) => DocsView;
  setIncludeFolders: (b: boolean) => DocsView;
  setSelectFolderEnabled: (b: boolean) => DocsView;
}
interface PickerBuilder {
  addView: (v: DocsView) => PickerBuilder;
  enableFeature: (f: string) => PickerBuilder;
  setOAuthToken: (t: string) => PickerBuilder;
  setDeveloperKey: (k: string) => PickerBuilder;
  setAppId: (id: string) => PickerBuilder;
  setCallback: (cb: (resp: PickerResp) => void) => PickerBuilder;
  setTitle: (t: string) => PickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}

const SCOPES = "https://www.googleapis.com/auth/drive.readonly";
const PICKER_API = "https://apis.google.com/js/api.js";
const GIS_URL = "https://accounts.google.com/gsi/client";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export interface GoogleDrivePickerProps {
  /** MIME types ammessi, separati da virgola (es. "application/pdf" o "text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") */
  mimeTypes: string;
  multiSelect?: boolean;
  buttonLabel?: string;
  buttonClassName?: string;
  onFilesPicked: (files: File[]) => void;
  onError?: (msg: string) => void;
}

export function GoogleDrivePicker({
  mimeTypes,
  multiSelect = true,
  buttonLabel = "Importa da Google Drive",
  buttonClassName = "btn",
  onFilesPicked,
  onError,
}: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);
  const [scriptsReady, setScriptsReady] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const tokenClientRef = useRef<TokenClient | null>(null);

  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;
  const configured = Boolean(CLIENT_ID && API_KEY && APP_ID);

  // Precarica gli script al mount: senza await nel click handler il browser
  // preserva la user-gesture e non blocca il popup OAuth.
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadScript(PICKER_API), loadScript(GIS_URL)]);
        await new Promise<void>((resolve) => {
          if (!window.gapi) return resolve();
          window.gapi.load("picker", () => resolve());
        });
        if (!cancelled) setScriptsReady(true);
      } catch (e) {
        if (!cancelled) {
          onError?.(e instanceof Error ? e.message : "Errore caricamento Google API");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, onError]);

  const downloadDriveFile = useCallback(
    async (doc: PickerDoc, token: string): Promise<File> => {
      const isGoogleNative = doc.mimeType.startsWith("application/vnd.google-apps.");
      let url: string;
      let finalName = doc.name;
      let finalMime = doc.mimeType;

      if (isGoogleNative) {
        // Mappa formato Google → formato export
        const exportMap: Record<string, { mime: string; ext: string }> = {
          "application/vnd.google-apps.document": {
            mime: "application/pdf",
            ext: ".pdf",
          },
          "application/vnd.google-apps.spreadsheet": {
            mime: "text/csv",
            ext: ".csv",
          },
          "application/vnd.google-apps.presentation": {
            mime: "application/pdf",
            ext: ".pdf",
          },
        };
        const target = exportMap[doc.mimeType];
        if (!target) {
          throw new Error(
            `Formato Google non supportato: ${doc.mimeType}. Esporta manualmente in PDF/CSV.`
          );
        }
        url = `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=${encodeURIComponent(target.mime)}`;
        finalMime = target.mime;
        if (!finalName.toLowerCase().endsWith(target.ext)) {
          finalName += target.ext;
        }
      } else {
        url = `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Drive download failed (${res.status}): ${body.slice(0, 200) || res.statusText}`
        );
      }
      const blob = await res.blob();
      return new File([blob], finalName, { type: finalMime });
    },
    []
  );

  const openPicker = useCallback(
    (token: string) => {
      const g = window.google;
      if (!g?.picker) {
        onError?.("Google Picker non caricato");
        setLoading(false);
        return;
      }
      // Niente setMimeTypes: mostriamo tutti i file + cartelle navigabili.
      // La validazione del tipo avviene dopo nel parser.
      const view = new g.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);
      const builder = new g.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY!)
        .setAppId(APP_ID!)
        .setTitle("Scegli file da Google Drive")
        .setCallback(async (resp: PickerResp) => {
          if (resp.action === g.picker!.Action.PICKED && resp.docs?.length) {
            try {
              const files = await Promise.all(
                resp.docs.map((d) => downloadDriveFile(d, token))
              );
              onFilesPicked(files);
            } catch (e) {
              onError?.(e instanceof Error ? e.message : "Errore download file");
            }
          }
          if (resp.action === g.picker!.Action.PICKED || resp.action === g.picker!.Action.CANCEL) {
            setLoading(false);
          }
        });
      if (multiSelect) builder.enableFeature(g.picker.Feature.MULTISELECT_ENABLED);
      builder.build().setVisible(true);
    },
    [API_KEY, APP_ID, mimeTypes, multiSelect, onFilesPicked, onError, downloadDriveFile]
  );

  const handleClick = useCallback(() => {
    if (!configured) {
      onError?.(
        "Google Drive non configurato. Mancano le env vars NEXT_PUBLIC_GOOGLE_CLIENT_ID, NEXT_PUBLIC_GOOGLE_API_KEY, NEXT_PUBLIC_GOOGLE_APP_ID."
      );
      return;
    }
    if (!scriptsReady || !window.google?.accounts?.oauth2) {
      onError?.("Google API non ancora caricate, riprova tra un istante.");
      return;
    }
    setLoading(true);
    try {
      if (!tokenClientRef.current) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID!,
          scope: SCOPES,
          callback: (resp) => {
            if (resp.error || !resp.access_token) {
              onError?.(`OAuth error: ${resp.error ?? "no token"}`);
              setLoading(false);
              return;
            }
            tokenRef.current = resp.access_token;
            openPicker(resp.access_token);
          },
        });
      }
      // Chiamata sincrona dentro l'handler click → popup OAuth non viene bloccato
      tokenClientRef.current.requestAccessToken({
        prompt: tokenRef.current ? "" : "consent",
      });
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Errore apertura Google Drive");
      setLoading(false);
    }
  }, [CLIENT_ID, configured, scriptsReady, onError, openPicker]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || !configured}
      className={buttonClassName}
      title={configured ? undefined : "Google Drive non configurato (env vars mancanti)"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7.71 3.52L1.15 15l3.16 5.48L10.87 9l-3.16-5.48zm8.58 0h-7.5l6.56 11.37h7.5L16.29 3.52zM15.04 15H5.26l-3.05 5.28h19.5L18.66 15h-3.62z" />
      </svg>
      <span style={{ marginLeft: 6 }}>
        {loading ? "Caricamento…" : buttonLabel}
      </span>
    </button>
  );
}
