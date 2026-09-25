import profilePortrait from "../assets/profile-felix-cat-background.jpg";

const profileProofs = [
  ["影像创作", "签约深圳稻谷 AI，参与短剧重制与人物、场景资产制作。"],
  ["独立交付", "网站、小程序与视觉设计项目，从需求沟通推进到修改与交付。"],
  ["Agent 实践", "搭建人物资产生成 Agent，开展 OpenClaw 企业线下部署与调试。"],
  ["团队协作", "带领 50 人项目组，7 天累计成交 6,000 元，整理可复用的交付 SOP。"],
];

export default function ProfileLanding() {
  return (
    <div className="profile-landing" data-profile-landing lang="zh-CN">
      <figure className="profile-landing__portrait" data-profile-portrait>
        <img
          src={profilePortrait}
          alt="Felix 与猫对望的黑白肖像，作为个人介绍背景"
          width="940"
          height="940"
          loading="eager"
          decoding="async"
        />
        <figcaption>司钧霆 · FELIX</figcaption>
      </figure>

      <div className="profile-landing__masthead">
        <p>司钧霆 · FELIX</p>
        <p>SJTbright-future</p>
      </div>

      <div className="profile-landing__layout">
        <div className="profile-landing__copy">
          <p className="profile-landing__eyebrow" data-profile-reveal style={{ "--profile-delay": "80ms" }}>AIGC &amp; CREATIVE DEVELOPMENT</p>
          <h1 id="profile-title" data-profile-reveal style={{ "--profile-delay": "160ms" }}>司钧霆 Felix。</h1>
          <p className="profile-landing__role" data-profile-reveal style={{ "--profile-delay": "240ms" }}>AIGC 创作者 · 独立开发者</p>
          <ul className="profile-landing__traits" aria-label="个人标签" data-profile-reveal style={{ "--profile-delay": "300ms" }}>
            <li lang="en">INFP</li>
            <li>经济独立</li>
          </ul>
          <p className="profile-landing__intro" data-profile-reveal style={{ "--profile-delay": "360ms" }}>
            我用 AI 做影像，也做真正能用的产品。参与短剧制作与人物资产开发，独立完成视觉设计、网站及小程序项目，关注从创意、实现到交付的完整过程。
          </p>
          <p className="profile-landing__disciplines" data-profile-reveal style={{ "--profile-delay": "420ms" }}>
            AI 视频制作 / AIGC 视觉设计 / 网站与小程序 / Agent 工作流
          </p>

          <dl className="profile-landing__proofs" aria-label="Felix 个人经历" data-profile-reveal style={{ "--profile-delay": "480ms" }}>
            {profileProofs.map(([label, detail]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>

          <p className="profile-landing__disclaimer" data-profile-reveal style={{ "--profile-delay": "560ms" }}>
            下方分别呈现个人实践、视觉审美参考、开发项目与影像作品，各自标明展示性质。
          </p>
        </div>

      </div>

      <div className="profile-landing__footer">
        <p className="profile-landing__cue" lang="en">SCROLL TO EXPLORE</p>
        <a className="profile-landing__replay" href="#project-showcase" aria-label="查看项目作品">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 10a8 8 0 1 1 .5 6M4 4v6h6" />
          </svg>
          查看项目作品
        </a>
      </div>
    </div>
  );
}
