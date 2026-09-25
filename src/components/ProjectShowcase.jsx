import { useEffect, useRef } from "react";
import "./ProjectShowcase/ProjectShowcase.css";

import { BentoGrid, BentoGridItem } from "./ProjectShowcase/BentoGrid.jsx";
import PortfolioEntryTransition from "./PortfolioEntryTransition.jsx";
import GitHubProjectList from "./ProjectShowcase/GitHubProjectList.jsx";
import ProjectCard from "./ProjectShowcase/ProjectCard.jsx";
import { projectItems } from "../data/projectItems.js";
import portfolioGatewayImage from "../assets/starry-archive-entrance.png";

const portfolioGatewayMedia = {
  src: portfolioGatewayImage,
  width: 1672,
  height: 941,
};

const SHOWCASE_TRAILS = [
  { top: "8%", left: "8%", delay: 0.2, duration: 2.8, length: 180, size: 0.85, deltaX: "110vw", deltaY: "18vh", angle: -30, opacity: 0.42 },
  { top: "16%", left: "62%", delay: 1.4, duration: 3.4, length: 220, size: 1.05, deltaX: "122vw", deltaY: "10vh", angle: -24, opacity: 0.48 },
  { top: "28%", left: "84%", delay: 0.9, duration: 2.6, length: 160, size: 0.8, deltaX: "96vw", deltaY: "28vh", angle: -48, opacity: 0.38 },
  { top: "54%", left: "22%", delay: 2.2, duration: 3.1, length: 210, size: 1.0, deltaX: "112vw", deltaY: "34vh", angle: -38, opacity: 0.45 },
  { top: "64%", left: "74%", delay: 1.8, duration: 2.9, length: 180, size: 0.8, deltaX: "95vw", deltaY: "16vh", angle: -55, opacity: 0.4 },
  { top: "34%", left: "42%", delay: 0.5, duration: 4.0, length: 240, size: 1.15, deltaX: "120vw", deltaY: "22vh", angle: -44, opacity: 0.5 },
  { top: "75%", left: "38%", delay: 2.6, duration: 3.6, length: 150, size: 0.9, deltaX: "100vw", deltaY: "-8vh", angle: -10, opacity: 0.38 },
  { top: "86%", left: "68%", delay: 3.0, duration: 3.2, length: 190, size: 0.95, deltaX: "104vw", deltaY: "4vh", angle: -36, opacity: 0.44 },
];

export default function ProjectShowcase() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) return undefined;

    if (!("IntersectionObserver" in window)) {
      sectionElement
        .querySelectorAll(
          ".project-showcase__header, .project-bento-grid__item--entry, .github-projects, .github-projects__card, .portfolio-gateway"
        )
        .forEach((node) => {
          node.classList.add("is-visible");
        });
      return undefined;
    }

    const revealTargets = [
      sectionElement.querySelector(".project-showcase__header"),
      ...sectionElement.querySelectorAll(".project-bento-grid__item--entry"),
      sectionElement.querySelector(".github-projects"),
      ...sectionElement.querySelectorAll(".github-projects__card"),
      sectionElement.querySelector(".portfolio-gateway"),
    ].filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.16 });

    for (const target of revealTargets) {
      if (target) observer.observe(target);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="project-showcase"
      tabIndex={-1}
      data-project-showcase
      lang="zh-CN"
      aria-labelledby="project-showcase-title"
      className="project-showcase"
    >
      <div className="project-showcase__starfield" aria-hidden="true">
        {SHOWCASE_TRAILS.map((star, index) => (
          <span
            key={`showcase-star-${index}`}
            className="project-showcase__shooting-star"
            style={{
              "--shooting-star-top": star.top,
              "--shooting-star-left": star.left,
              "--shooting-star-delay": `${star.delay}s`,
              "--shooting-star-duration": `${star.duration}s`,
              "--shooting-star-length": `${star.length}px`,
              "--shooting-star-size": star.size,
              "--shooting-star-delta-x": star.deltaX,
              "--shooting-star-delta-y": star.deltaY,
              "--shooting-star-angle": `${star.angle}deg`,
              "--shooting-star-opacity": star.opacity,
            }}
          />
        ))}
      </div>
      <div className="project-showcase__content">
        <header className="project-showcase__header">
          <p className="project-showcase__eyebrow">Visual Curation · 审美参考</p>
          <h2 id="project-showcase-title">我的视觉审美选集</h2>
          <p className="project-showcase__intro">八个值得欣赏的网站，记录我关注的构图、配色、动效与叙事。它们是我的审美参考，不作为个人开发成果展示。</p>
          <p className="curation-note">点击封面欣赏外部网站；个人开发项目与源码记录见下方「实用工具与生活效率」。</p>
        </header>
        <BentoGrid>
          {projectItems.map((project, index) => (
            <BentoGridItem
              key={project.id}
              className="project-showcase__item project-bento-grid__item--entry"
              style={{ "--project-item-delay": `${(index % 2) * 90}ms` }}
            >
              <ProjectCard {...project} />
            </BentoGridItem>
          ))}
        </BentoGrid>
        <GitHubProjectList />
        <aside id="portfolio-gallery" tabIndex={-1} className="portfolio-gateway" aria-label="Felix 影像馆入口">
          <figure className="portfolio-gateway__photo" aria-hidden="true">
            <span className="portfolio-gateway__photo-fallback">星空影像馆 · 群星之间</span>
            <img
              className="portfolio-gateway__image"
              src={portfolioGatewayMedia.src}
              alt=""
              width={portfolioGatewayMedia.width}
              height={portfolioGatewayMedia.height}
              loading="eager"
              decoding="async"
            />
          </figure>
          <div className="portfolio-gateway__copy">
            <p className="portfolio-gateway__kicker">Felix · Starry Archive</p>
            <h3 className="portfolio-gateway__title">星空影像馆</h3>
            <p className="portfolio-gateway__supporting">把影像留在群星之间。拖动视角，探索环绕身边的写真与视觉作品。</p>
          </div>
          <div className="portfolio-gateway__action">
            <p className="portfolio-gateway__marker"><span>A PRIVATE</span><span>VISUAL SPACE</span></p>
            <PortfolioEntryTransition />
          </div>
        </aside>
      </div>
    </section>
  );
}
