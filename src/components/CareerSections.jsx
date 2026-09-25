import { useState } from "react";
import { career } from "../data/career.js";

export function CareerExperience(){
  return <section className="career-section" id="experience" aria-labelledby="experience-title">
    <header><p className="career-kicker">Experience & Practice</p><h2 id="experience-title">从创意到交付的实践</h2><p className="career-lead">影像、设计与开发，是我把想法落到具体作品里的三种方式。</p></header>
    <div className="career-experiences">{career.experiences.map(item=><article key={item.title}>
      <div><p className="career-role">{item.role}</p><h3>{item.title}</h3></div>
      <div><p>{item.body}</p><ul aria-label="实践技能">{item.tags.map(tag=><li key={tag}>{tag}</li>)}</ul></div>
    </article>)}</div>
  </section>;
}
export function CareerContact(){
  const [status,setStatus]=useState("");
  const copy=async()=>{try{await navigator.clipboard.writeText(career.contact);setStatus("微信号已复制");}catch{setStatus("请手动复制下方微信号");}};
  return <footer className="career-section career-contact" id="career-contact" aria-labelledby="contact-title">
    <p className="career-kicker">Contact / Let's work together</p><h2 id="contact-title">期待下一次创作与合作。</h2>
    <p className="career-lead">求职方向：{career.focus}。欢迎就岗位、项目职责与作品细节联系我。</p>
    <div className="career-contact-line"><span>微信：<strong>{career.contact}</strong></span><button className="career-button" onClick={copy}>复制微信号</button><a className="career-button" href="https://github.com/SJT-bright" target="_blank" rel="noreferrer">GitHub ↗</a></div>
    <p role="status" className="career-status">{status}</p>
    <small>© {new Date().getFullYear()} {career.name} · 个人作品集</small>
  </footer>;
}

