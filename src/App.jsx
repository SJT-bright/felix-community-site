import { useEffect } from "react";
import ProjectShowcase from "./components/ProjectShowcase.jsx";
import DriftWallGallery from "./components/DriftWallGallery.jsx";
import LabGateway from "./components/LabGateway.jsx";

export default function App() {
  useEffect(() => {
    const jump=()=>{const id=decodeURIComponent(location.hash.slice(1)); if(id) document.getElementById(id)?.scrollIntoView({behavior:"instant"});};
    const frame=requestAnimationFrame(jump);
    let active = true;
    const ready = async () => {
      await customElements.whenDefined("felix-opening");
      const sheet = document.querySelector("felix-opening")?.shadowRoot?.querySelector('link[rel="stylesheet"]');
      if (sheet && !sheet.sheet) await new Promise(resolve => { sheet.addEventListener("load", resolve, {once:true}); sheet.addEventListener("error", resolve, {once:true}); });
      await document.fonts.ready;
      if(active) requestAnimationFrame(jump);
    };
    void ready();
    window.addEventListener("hashchange",jump);
    return ()=>{active=false;cancelAnimationFrame(frame);window.removeEventListener("hashchange",jump);};
  },[]);
  return <main id="top">
    <DriftWallGallery />
    <ProjectShowcase />
    <div id="community-contact"><LabGateway /></div>
  </main>;
}
