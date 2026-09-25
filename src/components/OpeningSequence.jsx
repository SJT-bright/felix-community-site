import { useEffect, useRef, useState } from "react";
import "../styles/opening-sequence.css";

const seenKey = "felix-community-intro-seen-v2";
function shouldPlay() {
  const mode = new URLSearchParams(location.search).get("intro");
  if (mode === "play") return true;
  if (mode === "skip" || location.hash || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (performance.getEntriesByType("navigation")[0]?.type === "back_forward") return false;
  try { return !sessionStorage.getItem(seenKey); } catch { return true; }
}

export default function OpeningSequence({ children }) {
  const [playing, setPlaying] = useState(shouldPlay);
  const [leaving, setLeaving] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const video = useRef(null);
  const start = () => {
    if (failed) { finish(); return; }
    video.current?.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  };
  const finish = () => {
    try { sessionStorage.setItem(seenKey, "1"); } catch { /* Storage is optional. */ }
    setLeaving(true);
  };
  useEffect(() => {
    const componentUrl = "/felix-opening/opening.js";
    import(/* @vite-ignore */ componentUrl).catch(error => console.error("Opening component unavailable", error));
  }, []);
  useEffect(() => {
    if (!playing) return;
    document.body.classList.add("career-intro-active");
    video.current?.play().catch(() => setBlocked(true));
    return () => { document.body.classList.remove("career-intro-active"); };
  }, [playing]);
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setPlaying(false), 800);
    return () => clearTimeout(timer);
  }, [leaving]);
  return <>
    <div inert={playing ? true : undefined} className="opening-content">
      <header className="community-masthead">
        <a className="community-brand" href="#opening"><span>Felix<small>⁎</small></span><span className="community-brand-caption">司钧霆<br />AI LEARNING & CO-CREATION</span></a>
        <nav aria-label="全站导航"><a href="#project-showcase">项目作品</a><a href="#portfolio-gallery">星空影像馆</a><a href="#community-contact">联系</a><a href="/lab">AI 共创社群 ↗</a></nav>
      </header>
      <felix-opening id="opening" data-integrated="true" data-home="#image-archive" data-projects="#project-showcase" data-archive="#portfolio-gallery" data-contact="#community-contact" />
      <div className="opening-star-bridge" aria-hidden="true"><span /><span /><span /></div>
      {children}
    </div>
    {playing && <section className={`career-intro${leaving ? " is-leaving" : ""}`} aria-label="黑洞开场视频" tabIndex={0} onClick={start} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); start(); } if (event.key === "Escape") finish(); }}>
      <video ref={video} autoPlay muted={false} playsInline preload="auto" poster="/intro/wormhole-home-poster.jpg" onEnded={finish} onError={() => { setFailed(true); setBlocked(true); }}>
        <source src="/intro/wormhole-home-with-audio.mp4" type="video/mp4" onError={() => { setFailed(true); setBlocked(true); }} />
      </video>
      {blocked && <p className="intro-center-hint" role="status">{failed ? "视频暂不可用 · 点击画面进入首页" : "点击画面，开启有声序章"}</p>}
    </section>}
  </>;
}
