"use client";

import type Phaser from "phaser";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { createPixelAvatar } from "@/app/lib/avatar";
import {
  DEFAULT_AVATAR,
  DEFAULT_SETTINGS,
  INITIAL_STATS,
  type AvatarProfile,
  type GameCommand,
  type GameStats,
  type Settings,
} from "@/game/types";

const SAVE_KEY = "office-run-save-v1";

type RecentRun = {
  score: number;
  quarter: number;
  fiscalYear: number;
  tasksAvoided: number;
};

type SaveData = {
  best: number;
  avatar: AvatarProfile;
  settings: Settings;
  recentRuns: RecentRun[];
};

function safeSave(data: SaveData) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage is an enhancement; the run remains fully playable without it.
  }
}

function formatScore(score: number) {
  return Math.max(0, Math.floor(score)).toString().padStart(6, "0");
}

function SanityMeter({ sanity, hardcore }: { sanity: number; hardcore: boolean }) {
  const count = hardcore ? 1 : 3;
  return (
    <div className="sanityMeter" aria-label={`${sanity} sanity point${sanity === 1 ? "" : "s"} remaining`}>
      {Array.from({ length: count }, (_, index) => (
        <span className={index < sanity ? "sanity active" : "sanity"} key={index} aria-hidden="true">
          {index < sanity ? "♥" : "×"}
        </span>
      ))}
    </div>
  );
}

export default function OfficeRun() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastScreenRef = useRef(INITIAL_STATS.screen);
  const bestRef = useRef(INITIAL_STATS.best);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const avatarRef = useRef<AvatarProfile>(DEFAULT_AVATAR);
  const recentRef = useRef<RecentRun[]>([]);

  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [avatar, setAvatar] = useState<AvatarProfile>(DEFAULT_AVATAR);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [avatarError, setAvatarError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);

  const send = useCallback((command: GameCommand) => {
    gameRef.current?.events.emit("office-command", command);
  }, []);

  const handleStats = useCallback((nextStats: GameStats) => {
    bestRef.current = Math.max(bestRef.current, nextStats.best);
    setStats(nextStats);
    if (nextStats.screen === "gameover" && lastScreenRef.current !== "gameover") {
      const run: RecentRun = {
        score: nextStats.score,
        quarter: nextStats.quarter,
        fiscalYear: nextStats.fiscalYear,
        tasksAvoided: nextStats.tasksAvoided,
      };
      const nextRecent = [run, ...recentRef.current].slice(0, 3);
      recentRef.current = nextRecent;
      setRecentRuns(nextRecent);
      safeSave({
        best: nextStats.best,
        avatar: avatarRef.current,
        settings: settingsRef.current,
        recentRuns: nextRecent,
      });
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
    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const value = window.localStorage.getItem(SAVE_KEY);
        if (!value) return;
        const saved = JSON.parse(value) as Partial<SaveData>;
        if (typeof saved.best === "number") {
          bestRef.current = Math.max(bestRef.current, saved.best);
          setStats((current) => ({ ...current, best: Math.max(current.best, saved.best ?? 0) }));
        }
        if (saved.settings) setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
        if (saved.avatar) setAvatar({ ...DEFAULT_AVATAR, ...saved.avatar });
        if (Array.isArray(saved.recentRuns)) setRecentRuns(saved.recentRuns.slice(0, 3));
      } catch {
        window.localStorage.removeItem(SAVE_KEY);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    send({ type: "settings", settings });
    if (ready) {
      safeSave({ best: bestRef.current, avatar: avatarRef.current, settings, recentRuns: recentRef.current });
    }
  }, [ready, send, settings]);

  useEffect(() => {
    avatarRef.current = avatar;
    send({ type: "avatar", avatar });
    if (ready) {
      safeSave({ best: bestRef.current, avatar, settings: settingsRef.current, recentRuns: recentRef.current });
    }
  }, [avatar, ready, send]);

  useEffect(() => {
    recentRef.current = recentRuns;
  }, [recentRuns]);

  useEffect(() => {
    if (ready) send({ type: "hydrate-best", best: stats.best });
  }, [ready, send, stats.best]);

  const updateSetting = <Key extends keyof Settings>(key: Key, value: Settings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const chooseAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError("");
    try {
      const nextAvatar = await createPixelAvatar(file);
      setAvatar(nextAvatar);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "That photo could not be processed.");
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const resetAvatar = () => {
    setAvatar(DEFAULT_AVATAR);
    setAvatarError("");
  };

  const isMenu = stats.screen === "menu";
  const isPlaying = stats.screen === "playing" || stats.screen === "paused";
  const isGameOver = stats.screen === "gameover";
  const hardcoreUnlocked = stats.best >= 2500;

  return (
    <main className={`officeRun ${settings.reducedMotion ? "reduceMotion" : ""}`}>
      <div className="ambientGrid" aria-hidden="true" />
      <header className="siteHeader">
        <a className="brand" href="#game" aria-label="Office Run home">
          <span className="brandMark">OR</span>
          <span>OFFICE RUN</span>
        </a>
        <div className="marquee" aria-hidden="true">
          ESCAPE TASKS <b>•</b> DODGE SYNERGY <b>•</b> KEEP YOUR SANITY
        </div>
        <div className="headerActions" aria-label="Game settings">
          <button
            className="iconButton"
            type="button"
            aria-pressed={!settings.music}
            aria-label={`${settings.music ? "Mute" : "Unmute"} music`}
            onClick={() => updateSetting("music", !settings.music)}
          >
            {settings.music ? "♫" : "♫×"}
          </button>
          <button
            className="iconButton"
            type="button"
            aria-pressed={!settings.sfx}
            aria-label={`${settings.sfx ? "Mute" : "Unmute"} sound effects`}
            onClick={() => updateSetting("sfx", !settings.sfx)}
          >
            {settings.sfx ? "SFX" : "SFX×"}
          </button>
          <button
            className="iconButton"
            type="button"
            aria-pressed={settings.reducedMotion}
            aria-label="Toggle reduced motion"
            onClick={() => updateSetting("reducedMotion", !settings.reducedMotion)}
          >
            RM
          </button>
        </div>
      </header>

      <section className="gameSection" id="game" aria-label="Office Run game">
        <div className="titleBlock">
          <p className="eyebrow">A CORPORATE ESCAPE SIMULATOR</p>
          <h1>OFFICE <span>RUN</span></h1>
          <p className="tagline">Escape the 9-to-5. Keep your sanity.</p>
        </div>

        <div className="gameMachine">
          <div className="machineTop">
            <span>PROPERTY OF PEOPLE OPS</span>
            <span className="statusLamp"><i /> SYSTEM {ready ? "ONLINE" : "BOOTING"}</span>
          </div>

          <div className="stage" aria-busy={!ready}>
            <div className="gameMount" ref={mountRef} aria-hidden="true" />
            <div className="scanlines" aria-hidden="true" />

            {isPlaying && (
              <div className="hud" aria-label="Current run statistics">
                <div className="hudGroup">
                  <span className="hudLabel">SCORE</span>
                  <strong>{formatScore(stats.score)}</strong>
                  <span className="hudMini">BEST {formatScore(stats.best)}</span>
                </div>
                <div className="hudQuarter">
                  <span>FY{stats.fiscalYear} / Q{stats.quarter}</span>
                  {stats.bossActive && <b className="bossAlert">ALL-HANDS!</b>}
                </div>
                <div className="hudGroup alignRight">
                  <span className="hudLabel">SANITY</span>
                  <SanityMeter sanity={stats.sanity} hardcore={settings.hardcore} />
                  <span className="hudMini">STREAK {stats.streak} · {stats.multiplier}×</span>
                </div>
              </div>
            )}

            {isMenu && (
              <div className="screenOverlay menuOverlay">
                <div className="menuCopy">
                  <p className="overlayKicker">MONDAY · 08:59 AM</p>
                  <h2>YOUR CALENDAR<br /><span>CHOSE VIOLENCE.</span></h2>
                  <p>
                    Run as Chip Deadline. Jump meetings, duck invites, and never—under any circumstances—circle back.
                  </p>
                  <button className="pixelButton primary" type="button" onClick={() => send({ type: "start" })}>
                    <span>▶</span> RUN FROM RESPONSIBILITY
                  </button>
                  <p className="keyHint"><kbd>SPACE</kbd> JUMP · <kbd>↓</kbd> DUCK · <kbd>E</kbd> POWER</p>
                </div>

                <aside className="avatarCard" aria-label="Runner avatar">
                  <div className="folderTab">EMPLOYEE FILE</div>
                  <div className="avatarPreview" style={{ "--avatar-accent": avatar.accent } as React.CSSProperties}>
                    {avatar.dataUrl ? (
                      <Image src={avatar.dataUrl} alt="Your generated pixel avatar" width={72} height={72} unoptimized />
                    ) : (
                      <div className="chipFace" aria-label="Default Chip Deadline avatar"><i /><b /></div>
                    )}
                  </div>
                  <div className="avatarMeta">
                    <span>{avatar.custom ? "CUSTOM RUNNER" : "CHIP DEADLINE"}</span>
                    <strong>{avatar.title}</strong>
                  </div>
                  <input
                    className="visuallyHidden"
                    ref={fileRef}
                    id="avatar-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => void chooseAvatar(event.target.files?.[0])}
                  />
                  <label className="pixelButton secondary small" htmlFor="avatar-photo" aria-disabled={avatarBusy}>
                    {avatarBusy ? "PIXELATING..." : "UPLOAD YOUR PHOTO"}
                  </label>
                  {avatar.custom && (
                    <button className="textButton" type="button" onClick={resetAvatar}>RESET TO CHIP</button>
                  )}
                  <p className="privacyNote">ON-DEVICE ONLY<br />YOUR PHOTO NEVER LEAVES THIS BROWSER.</p>
                  {avatarError && <p className="avatarError" role="alert">{avatarError}</p>}
                </aside>
              </div>
            )}

            {stats.screen === "paused" && (
              <div className="screenOverlay pauseOverlay">
                <p className="overlayKicker">STRATEGIC THINKING BREAK</p>
                <h2>PAUSED</h2>
                <button className="pixelButton primary" type="button" onClick={() => send({ type: "pause" })}>
                  RESUME THE GRIND
                </button>
              </div>
            )}

            {isGameOver && (
              <div className="screenOverlay reviewOverlay">
                <div className="reviewStamp">PERFORMANCE<br />REVIEW</div>
                <p className="overlayKicker">STATUS: LOGGED OFF INVOLUNTARILY</p>
                <h2>{stats.newBest ? "NEW PERSONAL BEST" : "RUN TERMINATED"}</h2>
                <blockquote>“{stats.review}”</blockquote>
                <div className="reviewStats">
                  <span><small>SCORE</small><strong>{formatScore(stats.score)}</strong></span>
                  <span><small>TASKS DODGED</small><strong>{stats.tasksAvoided}</strong></span>
                  <span><small>DISTANCE</small><strong>{stats.distance}m</strong></span>
                  <span><small>EXIT POINT</small><strong>FY{stats.fiscalYear} Q{stats.quarter}</strong></span>
                </div>
                <button className="pixelButton primary" type="button" onClick={() => send({ type: "start" })}>
                  ↻ TRY ANOTHER QUARTER
                </button>
              </div>
            )}
          </div>

          <div className="controlDeck">
            <div className="touchCluster">
              <button
                className="arcadeButton jumpButton"
                type="button"
                onPointerDown={(event) => { event.preventDefault(); send({ type: "jump" }); }}
                onPointerUp={() => send({ type: "jump-release" })}
                onPointerCancel={() => send({ type: "jump-release" })}
                aria-label="Jump or double-jump"
              >
                <span>↑</span> JUMP
              </button>
              <button
                className="arcadeButton duckButton"
                type="button"
                onPointerDown={(event) => { event.preventDefault(); send({ type: "duck", active: true }); }}
                onPointerUp={() => send({ type: "duck", active: false })}
                onPointerCancel={() => send({ type: "duck", active: false })}
                onPointerLeave={() => send({ type: "duck", active: false })}
                aria-label="Hold to duck or slide"
              >
                <span>↓</span> DUCK
              </button>
            </div>

            <div className="powerConsole">
              <span className="consoleLabel">HELD ASSET</span>
              <button
                className={`powerButton ${stats.powerUp ? "loaded" : ""}`}
                type="button"
                disabled={!stats.powerUp || stats.screen !== "playing"}
                onClick={() => send({ type: "use-powerup" })}
              >
                {stats.powerUp ? stats.powerUp.toUpperCase() : "EMPTY"}
                {stats.powerRemaining > 0 && <small>{stats.powerRemaining}s ACTIVE</small>}
              </button>
            </div>

            <div className="systemControls">
              <button className="deckButton" type="button" onClick={() => send({ type: "pause" })} disabled={!isPlaying}>
                {stats.screen === "paused" ? "RESUME" : "PAUSE"}
              </button>
              <button
                className="deckButton"
                type="button"
                disabled={!hardcoreUnlocked || stats.screen === "playing"}
                aria-pressed={settings.hardcore}
                onClick={() => updateSetting("hardcore", !settings.hardcore)}
                title={hardcoreUnlocked ? "Toggle one-hit mode" : "Reach 2,500 points to unlock"}
              >
                {hardcoreUnlocked ? `1-HIT ${settings.hardcore ? "ON" : "OFF"}` : "1-HIT 🔒"}
              </button>
            </div>
          </div>
        </div>

        <div className="belowMachine">
          <div className="howToCard">
            <span className="sectionNumber">01</span>
            <div><strong>JUMP THE AGENDA</strong><p>Space / W / ↑. Tap twice for a deeply non-compliant double-jump.</p></div>
          </div>
          <div className="howToCard">
            <span className="sectionNumber">02</span>
            <div><strong>DUCK THE INVITE</strong><p>S / ↓. Hold to shrink your hitbox and your professional visibility.</p></div>
          </div>
          <div className="howToCard">
            <span className="sectionNumber">03</span>
            <div><strong>USE YOUR BENEFITS</strong><p>Collect PTO, headphones, Inbox Zero, coffee, and the mythical WFH approval.</p></div>
          </div>
        </div>

        {recentRuns.length > 0 && (
          <section className="recentSection" aria-labelledby="recent-heading">
            <div>
              <p className="eyebrow">LOCAL RECORDS</p>
              <h2 id="recent-heading">PREVIOUS ESCAPE ATTEMPTS</h2>
            </div>
            <ol>
              {recentRuns.map((run, index) => (
                <li key={`${run.score}-${index}`}>
                  <span>#{index + 1}</span>
                  <strong>{formatScore(run.score)}</strong>
                  <small>FY{run.fiscalYear} Q{run.quarter} · {run.tasksAvoided} tasks dodged</small>
                </li>
              ))}
            </ol>
          </section>
        )}
      </section>

      <footer className="siteFooter">
        <p>OFFICE RUN <span>© THE ENDLESS WORKDAY</span></p>
        <p>
          CC0 office art by <a href="https://opengameart.org/content/office-8x8-tileset" target="_blank" rel="noreferrer">Danielfib</a>
          {" · "}CC0 audio by <a href="https://kenney.nl/assets/ui-audio" target="_blank" rel="noreferrer">Kenney</a>
        </p>
      </footer>

      <p className="visuallyHidden" aria-live="polite">
        {stats.screen === "playing"
          ? `Score ${stats.score}. ${stats.sanity} sanity remaining. Fiscal year ${stats.fiscalYear}, quarter ${stats.quarter}.`
          : stats.screen === "gameover"
            ? `Run over. Final score ${stats.score}. ${stats.review}`
            : stats.screen === "paused" ? "Game paused." : "Office Run menu."}
      </p>
    </main>
  );
}
