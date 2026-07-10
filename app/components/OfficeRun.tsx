"use client";

import type Phaser from "phaser";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { LEVELS } from "@/game/config";
import {
  DEFAULT_SETTINGS,
  INITIAL_STATS,
  type GameCommand,
  type GameStats,
  type Settings,
} from "@/game/types";

const SAVE_KEY = "office-run-save-v2";

type RecentRun = {
  score: number;
  level: number;
  tasksAvoided: number;
  cleared: boolean;
};

type SaveData = {
  best: number;
  unlockedLevel: number;
  settings: Settings;
  recentRuns: RecentRun[];
};

function safeSave(data: SaveData) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage is an enhancement; the campaign remains playable without it.
  }
}

function formatScore(score: number) {
  return Math.max(0, Math.floor(score)).toString().padStart(6, "0");
}

function SocialBattery({ value }: { value: number }) {
  const status = value > 66 ? "charged" : value > 33 ? "drained" : "critical";
  return (
    <div className="batteryWrap" aria-label={`Social Battery ${value} percent`}>
      <div className="batteryShell">
        <i className={`batteryFill ${status}`} style={{ width: `${value}%` }} />
      </div>
      <strong>{value}%</strong>
    </div>
  );
}

export default function OfficeRun() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const lastScreenRef = useRef(INITIAL_STATS.screen);
  const bestRef = useRef(INITIAL_STATS.best);
  const unlockedRef = useRef(INITIAL_STATS.unlockedLevel);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const recentRef = useRef<RecentRun[]>([]);

  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(1);

  const send = useCallback((command: GameCommand) => {
    gameRef.current?.events.emit("office-command", command);
  }, []);

  const persist = useCallback((recent = recentRef.current) => {
    safeSave({
      best: bestRef.current,
      unlockedLevel: unlockedRef.current,
      settings: settingsRef.current,
      recentRuns: recent,
    });
  }, []);

  const handleStats = useCallback((nextStats: GameStats) => {
    bestRef.current = Math.max(bestRef.current, nextStats.best);
    unlockedRef.current = Math.max(unlockedRef.current, nextStats.unlockedLevel);
    setStats(nextStats);

    const terminal = ["gameover", "levelcomplete", "gamecomplete"].includes(nextStats.screen);
    const wasTerminal = ["gameover", "levelcomplete", "gamecomplete"].includes(lastScreenRef.current);
    if (terminal && !wasTerminal) {
      const run: RecentRun = {
        score: nextStats.score,
        level: nextStats.level,
        tasksAvoided: nextStats.tasksAvoided,
        cleared: nextStats.screen !== "gameover",
      };
      const nextRecent = [run, ...recentRef.current].slice(0, 3);
      recentRef.current = nextRecent;
      setRecentRuns(nextRecent);
      safeSave({
        best: bestRef.current,
        unlockedLevel: unlockedRef.current,
        settings: settingsRef.current,
        recentRuns: nextRecent,
      });
      if (nextStats.screen === "levelcomplete") setSelectedLevel(Math.min(LEVELS.length, nextStats.level + 1));
      if (nextStats.screen === "gamecomplete") setSelectedLevel(LEVELS.length);
    }
    lastScreenRef.current = nextStats.screen;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let createdGame: Phaser.Game | null = null;
    if (!mountRef.current) return;

    void import("@/game/createOfficeRunGame").then(({ createOfficeRunGame }) => {
      if (cancelled || !mountRef.current) return;
      createdGame = createOfficeRunGame(mountRef.current, { onStats: handleStats });
      gameRef.current = createdGame;
      setReady(true);
    });

    return () => {
      cancelled = true;
      createdGame?.destroy(true);
      gameRef.current = null;
    };
  }, [handleStats]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const value = window.localStorage.getItem(SAVE_KEY);
        if (!value) return;
        const saved = JSON.parse(value) as Partial<SaveData>;
        if (typeof saved.best === "number") bestRef.current = Math.max(0, saved.best);
        if (typeof saved.unlockedLevel === "number") unlockedRef.current = Math.max(1, Math.min(LEVELS.length, saved.unlockedLevel));
        if (saved.settings) setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
        if (Array.isArray(saved.recentRuns)) {
          const recent = saved.recentRuns.slice(0, 3);
          recentRef.current = recent;
          setRecentRuns(recent);
        }
        setStats((current) => ({ ...current, best: bestRef.current, unlockedLevel: unlockedRef.current }));
      } catch {
        window.localStorage.removeItem(SAVE_KEY);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    send({ type: "settings", settings });
    if (ready) persist();
  }, [persist, ready, send, settings]);

  useEffect(() => {
    if (!ready) return;
    send({ type: "hydrate-progress", best: bestRef.current, unlockedLevel: unlockedRef.current });
  }, [ready, send]);

  useEffect(() => {
    const stopGameScroll = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", stopGameScroll, { capture: true, passive: false });
    return () => window.removeEventListener("keydown", stopGameScroll, true);
  }, []);

  useEffect(() => {
    recentRef.current = recentRuns;
  }, [recentRuns]);

  const updateSetting = <Key extends keyof Settings>(key: Key, value: Settings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const startSelectedLevel = () => send({ type: "start", level: selectedLevel });
  const isMenu = stats.screen === "menu";
  const isPlaying = stats.screen === "playing" || stats.screen === "paused";
  const isGameOver = stats.screen === "gameover";
  const isLevelComplete = stats.screen === "levelcomplete";
  const isGameComplete = stats.screen === "gamecomplete";
  const hardcoreUnlocked = stats.best >= 2500;

  return (
    <main className={`officeRun ${settings.reducedMotion ? "reduceMotion" : ""}`}>
      <div className="ambientGrid" aria-hidden="true" />
      <header className="siteHeader">
        <a className="brand" href="#game" aria-label="Office Run home"><span className="brandMark">OR</span><span>OFFICE RUN</span></a>
        <div className="marquee" aria-hidden="true">ESCAPE TASKS <b>•</b> DODGE SYNERGY <b>•</b> PROTECT YOUR SOCIAL BATTERY</div>
        <div className="headerActions" aria-label="Game settings">
          <button className="iconButton" type="button" aria-pressed={!settings.music} aria-label={`${settings.music ? "Mute" : "Unmute"} music`} onClick={() => updateSetting("music", !settings.music)}>{settings.music ? "♫" : "♫×"}</button>
          <button className="iconButton" type="button" aria-pressed={!settings.sfx} aria-label={`${settings.sfx ? "Mute" : "Unmute"} sound effects`} onClick={() => updateSetting("sfx", !settings.sfx)}>{settings.sfx ? "SFX" : "SFX×"}</button>
          <button className="iconButton" type="button" aria-pressed={settings.reducedMotion} aria-label="Toggle reduced motion" onClick={() => updateSetting("reducedMotion", !settings.reducedMotion)}>RM</button>
        </div>
      </header>

      <section className="gameSection" id="game" aria-label="Office Run game">
        <div className="titleBlock">
          <p className="eyebrow">A FIVE-LEVEL CORPORATE ESCAPE</p>
          <h1>OFFICE <span>RUN</span></h1>
          <p className="tagline">Run with Joi. Protect your Social Battery. Escape the org chart.</p>
        </div>

        <div className="gameMachine">
          <div className="machineTop"><span>PROPERTY OF PEOPLE OPS</span><span className="statusLamp"><i /> SYSTEM {ready ? "ONLINE" : "BOOTING"}</span></div>
          <div className="stage" aria-busy={!ready}>
            <div className="gameMount" ref={mountRef} aria-hidden="true" />
            <div className="scanlines" aria-hidden="true" />

            {isPlaying && (
              <div className="hud" aria-label="Current level statistics">
                <div className="hudGroup"><span className="hudLabel">SCORE</span><strong>{formatScore(stats.score)}</strong><span className="hudMini">BEST {formatScore(stats.best)}</span></div>
                <div className="hudLevel">
                  <span>LEVEL {stats.level}/5 · {stats.levelName}</span>
                  <div className="levelTrack"><i style={{ width: `${stats.levelProgress * 100}%` }} /></div>
                  <small>{stats.bestieActive ? "BESTIE BOB: ON DUTY" : `${stats.coffees} COFFEES CAUGHT`}</small>
                  {stats.bossActive && <b className="bossAlert">ALL-HANDS!</b>}
                </div>
                <div className="hudGroup alignRight"><span className="hudLabel">SOCIAL BATTERY</span><SocialBattery value={stats.socialBattery} /><span className="hudMini">STREAK {stats.streak} · {stats.multiplier}×</span></div>
              </div>
            )}

            {isMenu && (
              <div className="screenOverlay menuOverlay">
                <div className="menuCopy">
                  <p className="overlayKicker">MONDAY · 08:59 AM</p>
                  <h2>JOI&apos;S CALENDAR<br /><span>CHOSE VIOLENCE.</span></h2>
                  <p>Jump meetings, duck invites, steal the hard-to-reach coffee, and never—under any circumstances—circle back.</p>
                  <div className="levelPicker" aria-label="Choose a level">
                    {LEVELS.map((level) => {
                      const locked = level.id > stats.unlockedLevel;
                      return (
                        <button key={level.id} type="button" disabled={locked} aria-pressed={selectedLevel === level.id} onClick={() => setSelectedLevel(level.id)}>
                          <b>{locked ? "🔒" : level.id}</b><span>{level.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button className="pixelButton primary" type="button" onClick={startSelectedLevel}><span>▶</span> START LEVEL {selectedLevel}</button>
                  <p className="keyHint"><kbd>SPACE</kbd> JUMP · <kbd>↓</kbd> DUCK · <kbd>E</kbd> POWER</p>
                </div>

                <aside className="joiCard" aria-label="Joi employee file">
                  <div className="folderTab">EMPLOYEE FILE</div>
                  <div className="joiPreview"><Image src="/assets/joi/joi-idle.png" alt="Joi, the Office Run protagonist" width={192} height={208} priority unoptimized /></div>
                  <div className="avatarMeta"><span>JOI</span><strong>ORG-CHART ESCAPE ARTIST</strong></div>
                  <div className="bestieBrief"><b>BESTIE BOB</b><span>Catches one corporate catastrophe for Joi, then heroically gets pulled into the meeting.</span></div>
                </aside>
              </div>
            )}

            {stats.screen === "paused" && (
              <div className="screenOverlay pauseOverlay"><p className="overlayKicker">STRATEGIC THINKING BREAK</p><h2>PAUSED</h2><button className="pixelButton primary" type="button" onClick={() => send({ type: "pause" })}>RESUME THE GRIND</button></div>
            )}

            {isGameOver && (
              <div className="screenOverlay reviewOverlay">
                <div className="reviewStamp">BATTERY<br />DEPLETED</div>
                <p className="overlayKicker">LEVEL {stats.level}: {stats.levelName}</p>
                <h2>{stats.newBest ? "NEW PERSONAL BEST" : "RUN TERMINATED"}</h2>
                <blockquote>“{stats.review}”</blockquote>
                <div className="reviewStats">
                  <span><small>SCORE</small><strong>{formatScore(stats.score)}</strong></span><span><small>TASKS DODGED</small><strong>{stats.tasksAvoided}</strong></span><span><small>COFFEES</small><strong>{stats.coffees}</strong></span><span><small>PROGRESS</small><strong>{Math.round(stats.levelProgress * 100)}%</strong></span>
                </div>
                <div className="overlayActions"><button className="pixelButton primary" type="button" onClick={() => send({ type: "start", level: stats.level })}>↻ RETRY LEVEL</button><button className="pixelButton secondary" type="button" onClick={() => send({ type: "menu" })}>LEVEL SELECT</button></div>
              </div>
            )}

            {isLevelComplete && (
              <div className="screenOverlay reviewOverlay successOverlay">
                <div className="reviewStamp approved">LEVEL<br />CLEARED</div>
                <p className="overlayKicker">OUTLOOK STATUS: DECLINED</p>
                <h2>LEVEL {stats.level} COMPLETE</h2><blockquote>“{stats.review}”</blockquote>
                <div className="reviewStats"><span><small>SCORE</small><strong>{formatScore(stats.score)}</strong></span><span><small>TASKS DODGED</small><strong>{stats.tasksAvoided}</strong></span><span><small>COFFEES</small><strong>{stats.coffees}</strong></span><span><small>BATTERY LEFT</small><strong>{stats.socialBattery}%</strong></span></div>
                <div className="overlayActions"><button className="pixelButton primary" type="button" onClick={() => send({ type: "start", level: stats.level + 1 })}>NEXT: LEVEL {stats.level + 1} →</button><button className="pixelButton secondary" type="button" onClick={() => send({ type: "menu" })}>LEVEL SELECT</button></div>
              </div>
            )}

            {isGameComplete && (
              <div className="screenOverlay reviewOverlay successOverlay finalOverlay">
                <div className="reviewStamp approved">OUT OF<br />OFFICE</div><p className="overlayKicker">CAMPAIGN COMPLETE</p><h2>JOI ESCAPED THE ORG CHART</h2><blockquote>“{stats.review}”</blockquote>
                <div className="reviewStats"><span><small>FINAL SCORE</small><strong>{formatScore(stats.score)}</strong></span><span><small>TASKS DODGED</small><strong>{stats.tasksAvoided}</strong></span><span><small>COFFEES</small><strong>{stats.coffees}</strong></span><span><small>STATUS</small><strong>FREE</strong></span></div>
                <div className="overlayActions"><button className="pixelButton primary" type="button" onClick={() => send({ type: "start", level: 5 })}>↻ RUN THE FINALE</button><button className="pixelButton secondary" type="button" onClick={() => send({ type: "menu" })}>LEVEL SELECT</button></div>
              </div>
            )}
          </div>

          <div className="controlDeck">
            <div className="touchCluster">
              <button className="arcadeButton jumpButton" type="button" onPointerDown={(event) => { event.preventDefault(); send({ type: "jump" }); }} onPointerUp={() => send({ type: "jump-release" })} onPointerCancel={() => send({ type: "jump-release" })} aria-label="Jump or double-jump"><span>↑</span> JUMP</button>
              <button className="arcadeButton duckButton" type="button" onPointerDown={(event) => { event.preventDefault(); send({ type: "duck", active: true }); }} onPointerUp={() => send({ type: "duck", active: false })} onPointerCancel={() => send({ type: "duck", active: false })} onPointerLeave={() => send({ type: "duck", active: false })} aria-label="Hold to duck or slide"><span>↓</span> DUCK</button>
            </div>
            <div className="powerConsole"><span className="consoleLabel">HELD ASSET</span><button className={`powerButton ${stats.powerUp ? "loaded" : ""}`} type="button" disabled={!stats.powerUp || stats.screen !== "playing"} onClick={() => send({ type: "use-powerup" })}>{stats.powerUp ? stats.powerUp.toUpperCase() : "EMPTY"}{stats.powerRemaining > 0 && <small>{stats.powerRemaining}s ACTIVE</small>}</button></div>
            <div className="systemControls">
              <button className="deckButton" type="button" onClick={() => send({ type: "pause" })} disabled={!isPlaying}>{stats.screen === "paused" ? "RESUME" : "PAUSE"}</button>
              <button className="deckButton" type="button" disabled={!hardcoreUnlocked || isPlaying} aria-pressed={settings.hardcore} onClick={() => updateSetting("hardcore", !settings.hardcore)} title={hardcoreUnlocked ? "Toggle one-hit mode" : "Reach 2,500 points to unlock"}>{hardcoreUnlocked ? `1-HIT ${settings.hardcore ? "ON" : "OFF"}` : "1-HIT 🔒"}</button>
            </div>
          </div>
        </div>

        <div className="belowMachine">
          <div className="howToCard"><span className="sectionNumber">01</span><div><strong>JUMP THE AGENDA</strong><p>Space / W / ↑. Tap twice for a deeply non-compliant double-jump.</p></div></div>
          <div className="howToCard"><span className="sectionNumber">02</span><div><strong>CHASE THE COFFEE</strong><p>Frequent, valuable, and placed at heights Legal described as “inadvisable.” Restores 34% battery.</p></div></div>
          <div className="howToCard"><span className="sectionNumber">03</span><div><strong>FIND BESTIE BOB</strong><p>Collect Bob and he runs beside Joi until he sacrifices himself to absorb one collision.</p></div></div>
        </div>

        {recentRuns.length > 0 && (
          <section className="recentSection" aria-labelledby="recent-heading"><div><p className="eyebrow">LOCAL RECORDS</p><h2 id="recent-heading">PREVIOUS ESCAPE ATTEMPTS</h2></div><ol>{recentRuns.map((run, index) => <li key={`${run.score}-${index}`}><span>#{index + 1}</span><strong>{formatScore(run.score)}</strong><small>LEVEL {run.level} · {run.cleared ? "CLEARED" : "BATTERY EMPTY"} · {run.tasksAvoided} tasks dodged</small></li>)}</ol></section>
        )}
      </section>

      <footer className="siteFooter"><p>OFFICE RUN <span>© THE VERY FINITE WORKDAY</span></p><p>CC0 office art by <a href="https://opengameart.org/content/office-8x8-tileset" target="_blank" rel="noreferrer">Danielfib</a>{" · "}CC0 audio by <a href="https://kenney.nl/assets/ui-audio" target="_blank" rel="noreferrer">Kenney</a></p></footer>

      <p className="visuallyHidden" aria-live="polite">
        {stats.screen === "playing" ? `Level ${stats.level}. Score ${stats.score}. Social Battery ${stats.socialBattery} percent.` : stats.screen === "gameover" ? `Run over. Final score ${stats.score}. ${stats.review}` : stats.screen === "levelcomplete" ? `Level ${stats.level} complete.` : stats.screen === "gamecomplete" ? "Campaign complete. Joi escaped the org chart." : stats.screen === "paused" ? "Game paused." : "Office Run level menu."}
      </p>
    </main>
  );
}
