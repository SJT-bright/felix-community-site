import { useEffect, useRef, useState } from "react";
import { copyContact } from "../lib/copy-contact.js";
import { mountSmoothDisclosure } from "../lib/smooth-disclosure.js";
import { COMMUNITY_NAME, COMMUNITY_CONTACT as CONTACT, communityTopics } from "../data/community.js";
import profilePortrait from "../assets/profile-felix-cat-background.jpg";
import "./LabPage.css";

const resultLinks = [
  {
    number: "01",
    title: "站点与交互",
    description: "打开网站与 GitHub 项目，看看想法如何变成可用的功能。",
    href: "/?intro=skip#project-showcase",
    badge: "网站 / 开发项目",
  },
  {
    number: "02",
    title: "视觉实验",
    description: "看看 AI 场景里的构图、光线与配色，寻找自己的视觉灵感。",
    href: "/?intro=skip#image-archive",
    badge: "AI 场景 / 视觉创作",
  },
  {
    number: "03",
    title: "星空影像馆",
    description: "走进 360° 星空，拖动探索写真、人物海报与封面作品。",
    href: "/portfolio/index.html",
    badge: "写真 / 海报 / 封面",
  },
];

export default function LabPage() {
  const [copyState, setCopyState] = useState("idle");
  const operationRef = useRef(0);
  const timerRef = useRef(null);
  const topicsRef = useRef(null);

  useEffect(() => {
    const cleanups = [...topicsRef.current.querySelectorAll('details')].map(mountSmoothDisclosure);
    return () => cleanups.forEach(cleanup => cleanup());
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${COMMUNITY_NAME} · Felix`;
    return () => {
      document.title = previousTitle;
      operationRef.current += 1;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (copyState === "copying") return;
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setCopyState("copying");
    const copied = await copyContact(CONTACT);
    if (operationRef.current !== operation) return;
    setCopyState(copied ? "success" : "error");
    if (copied) {
      timerRef.current = window.setTimeout(() => {
        if (operationRef.current === operation) setCopyState("idle");
      }, 4000);
    }
  };

  const copyStatus = copyState === "success"
    ? "已复制微信号，打开微信添加好友，备注「CUPK + AI 交流群」。"
    : copyState === "error"
      ? "无法自动复制，请手动复制上方账号。"
      : "";

  return (
    <main className="lab-page" data-lab-page lang="zh-CN">
      <a className="lab-page__home" href="/?intro=skip">← 返回 Felix 首页</a>
      <section className="lab-hero" aria-labelledby="lab-title">
        <div className="lab-hero__content">
          <div className="lab-hero__heading">
            <p className="lab-page__kicker">{COMMUNITY_NAME}</p>
            <h1 id="lab-title" aria-label="和同频的人，把 AI 想法做成作品。">
              <span className="lab-title__visual" aria-hidden="true">
                <span data-lab-title-line>和同频的人，</span>
                <span data-lab-title-line>把 AI 想法</span>
                <span data-lab-title-line>做成作品。</span>
              </span>
            </h1>
          </div>
          <div className="lab-hero__intro">
            <p>面向 CUPK 校园同学的 AI 学习与共创社群。刚入门，我们从选工具、写提示词开始；已经在做项目，就带着作品和问题来，一起拆解、改进，也寻找合拍的伙伴。</p>
            <nav className="lab-hero__actions" aria-label="社群页面入口">
              <a className="lab-button lab-button--primary" href="#lab-contact">添加微信 · 加入交流群</a>
              <a className="lab-button" href="#lab-topics">看看六个交流方向 ↓</a>
            </nav>
            <p className="lab-hero__note">从一张图、一条视频，到一个真正能用的小工具。</p>
          </div>
        </div>

        <aside className="lab-hero__aside" aria-labelledby="lab-host-title">
          <img className="lab-host__portrait" src={profilePortrait} width="940" height="940" alt="Felix 与猫对望的个人肖像" decoding="async" />
          <div className="lab-host__copy">
            <p className="lab-host__label">群主 · 也是一起做作品的伙伴</p>
            <h2 id="lab-host-title">司钧霆 <span lang="en">Felix</span></h2>
            <p className="lab-host__traits">06 年 · INFP · ♐ 射手座 · 经济独立</p>
            <ul className="lab-host__experience">
              <li>深圳稻谷 AI 公司签约创作者</li>
              <li>美团 AI 原生社区「觅游」校园大使</li>
              <li>AI 编程 2 个月累计净利润 <strong>1.5 万+</strong></li>
            </ul>
            <p className="lab-host__note">分享做短剧、设计、写代码和带团队时的真实尝试，也聊聊那些踩过的坑。</p>
          </div>
        </aside>
      </section>

      <section className="lab-exchange" aria-labelledby="lab-exchange-title">
        <header className="lab-section-heading">
          <h2 id="lab-exchange-title">不必等到“很会了”，才来交流。</h2>
          <p>工具会更新，但拆解问题、检查结果、完成作品的能力，可以一起慢慢积累。</p>
        </header>
        <div className="lab-exchange__columns">
          <div>
            <p className="lab-exchange__meta">刚开始接触 AI</p>
            <h3>从一个小问题开始。</h3>
            <p>不知道选什么工具，或者生成结果总差一点？带上一张截图、一个参考或一句想法，交流怎么描述需求、调整提示词、修改结果。</p>
          </div>
          <div>
            <p className="lab-exchange__meta">想把工具用得更深入</p>
            <h3>带着正在做的作品来。</h3>
            <p>分享你在视频、图片、网站、小程序或 Agent 上的尝试，拆解项目中的卡点，也可以围绕共同感兴趣的方向寻找伙伴。</p>
          </div>
        </div>
      </section>

      <section className="lab-topics" id="lab-topics" tabIndex={-1} aria-labelledby="lab-topics-title">
        <header className="lab-section-heading">
          <h2 id="lab-topics-title">六个方向，从实践里展开。</h2>
          <p>选一个感兴趣的方向，看看我做过的项目，也找找我们可以一起聊的问题。</p>
        </header>
        <div className="lab-topics__list" ref={topicsRef}>
          {communityTopics.map((topic) => (
            <details className="lab-topic" key={topic.id} data-community-topic={topic.id}>
              <summary>
                <span className="lab-topic__heading">
                  <strong>{topic.title}</strong>
                  <span className="lab-topic__toggle"><span className="lab-topic__expand">看看相关实践</span><span className="lab-topic__collapse">收起详情</span><span className="lab-topic__plus" aria-hidden="true">+</span></span>
                </span>
                <span className="lab-topic__description">{topic.description}</span>
              </summary>
              <div className="lab-topic__panel" data-reveal-managed>
                <div className="lab-topic__body">
                  <div><h3>我做过的项目</h3><p>{topic.practice}</p>{topic.detail && <p>{topic.detail}</p>}</div>
                  <div><h3>可以从这里聊起</h3><p>{topic.takeaway}</p></div>
                </div>
              </div>
            </details>
          ))}
        </div>
        <p className="lab-topics__note">以方法分享、案例拆解、问题讨论和作品共创为主，具体分享安排以群内通知为准。</p>
      </section>

      <section className="lab-results" id="lab-results" tabIndex={-1} aria-labelledby="lab-results-title">
        <header className="lab-section-heading">
          <h2 id="lab-results-title">先看看作品，再聊怎么做。</h2>
          <p>看看画面和功能，再聊背后的思路、工具与制作过程。</p>
        </header>
        <div className="lab-results__list">
          {resultLinks.map((item) => (
            <a className="lab-result" href={item.href} key={item.number} data-lab-result>
              <span className="lab-result__number" aria-hidden="true">{item.number}</span>
              <span className="lab-result__copy">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
                <span className="lab-result__badge">{item.badge}</span>
              </span>
              <span className="lab-result__arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="lab-contact" id="lab-contact" tabIndex={-1} aria-labelledby="lab-contact-title">
        <p className="lab-page__kicker">{COMMUNITY_NAME}</p>
        <h2 id="lab-contact-title">带上你的想法，我们群里聊。</h2>
        <p className="lab-contact__hint">添加我的微信，备注「CUPK + AI 交流群」，我会邀请你入群。也可以先聊聊：你想做什么，或正卡在哪一步？</p>
        <div className="lab-contact__row">
          <p className="lab-contact__account" aria-label={`微信号 ${CONTACT}`}>{CONTACT}</p>
          <button className="lab-contact__copy" type="button" onClick={handleCopy} aria-disabled={copyState === "copying"} data-copy-contact>
            {copyState === "success" ? "已复制" : copyState === "copying" ? "复制中…" : "复制微信号"}
          </button>
        </div>
        <p className="lab-contact__status" data-copy-status role="status" aria-live="polite">{copyStatus}</p>
        <div className="lab-contact__subscription">
          <h3>第三方 AI 工具订阅协助</h3>
          <p>有想订阅的 AI 工具，也可以直接问我。先聊清用途，再确认合适的方案和价格。</p>
        </div>
        <p className="lab-contact__disclaimer">由 Felix 自主发起，非学校、美团或签约公司的官方社群。</p>
        <div className="lab-contact__buttons"><a className="lab-button" href="#lab-results">再看看作品 ↑</a></div>
      </section>
    </main>
  );
}
