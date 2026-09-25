import { useEffect, useRef, useState } from "react";

import { copyContact } from "../lib/copy-contact.js";
import { COMMUNITY_NAME, COMMUNITY_CONTACT as CONTACT } from "../data/community.js";
import "./LabGateway.css";

export default function LabGateway() {
  const [copyState, setCopyState] = useState("idle");
  const operationRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => {
    operationRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const runCopy = async () => {
    if (copyState === "copying") return null;
    const operation = operationRef.current + 1;
    operationRef.current = operation;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setCopyState("copying");

    const copied = await copyContact(CONTACT);
    if (operationRef.current !== operation) return null;

    setCopyState(copied ? "success" : "error");
    if (copied) {
      timerRef.current = window.setTimeout(() => {
        if (operationRef.current === operation) setCopyState("idle");
      }, 2400);
    }
    return copied;
  };

  const handleManualCopy = () => {
    void runCopy();
  };

  const statusText = copyState === "success"
    ? `已复制微信号 ${CONTACT}`
    : copyState === "error"
      ? "无法自动复制，请手动复制上方微信号。"
      : copyState === "copying"
        ? "正在复制微信号…"
        : "";

  return (
    <section
      className="lab-gateway"
      data-lab-gateway
      lang="zh-CN"
      aria-labelledby="lab-gateway-title"
    >
      <div className="lab-gateway__inner">
        <div className="lab-gateway__heading">
          <p className="lab-gateway__kicker">AI COMMUNITY</p>
          <h2 id="lab-gateway-title">欢迎加入 AI 社群</h2>
          <p className="lab-gateway__name">{COMMUNITY_NAME}</p>
          <p className="lab-gateway__description">面向 CUPK 校园同学，从 AI 入门到项目共创。一起做视频、图片、网站与小程序，让想法成为自己的作品。</p>
        </div>
        <div className="lab-gateway__invitation">
          <a className="lab-gateway__link" href="/lab">
            <span>了解社群 · 六个交流方向</span>
            <span aria-hidden="true">↗</span>
          </a>
          <div className="lab-gateway__contact">
            <p className="lab-gateway__account" aria-label={`微信号 ${CONTACT}`}>{CONTACT}</p>
            <button
              className="lab-gateway__copy"
              type="button"
              data-gateway-copy
              onClick={handleManualCopy}
              aria-disabled={copyState === "copying"}
            >
              {copyState === "success" ? "已复制" : copyState === "copying" ? "复制中…" : "复制微信号"}
            </button>
          </div>
          <p className="lab-gateway__description">添加微信，备注「CUPK + AI 交流群」。</p>
          <p className="lab-gateway__status" data-gateway-status role="status" aria-live="polite">
            {statusText}
          </p>
        </div>
      </div>
    </section>
  );
}
