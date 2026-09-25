# WorkBuddy 部署交接 · 2026-09-17

这是独立的个人求职作品集，不含社群招募、入群或代订阅内容。

## 部署配置

- 类型：React + Vite 静态网站，无后端和数据库。
- Node.js：22.12 或以上。
- 安装：`npm ci`。
- 构建：`npm run build`。
- 发布目录：`dist`。包内已有本次构建结果，也可以重新构建。
- 首页：`/`；星空影像馆：`/portfolio/index.html`。
- 请将网站挂载于域名根路径，保留整个 `dist/portfolio/` 和本地 `vendor/` 文件。
- 真实文件优先于单页应用回退规则，不能把 `/portfolio/app.js`、图片或 `index.html` 重写成主站首页。
- 不要部署 `node_modules`、测试目录或源码根目录。`preview-server.mjs` 仅用于本地验收，不作为云端启动服务。

## 交给 WorkBuddy 的说明

请将此目录的 Felix 个人求职作品集通过 WorkBuddy 内置云托管发布为静态网站。使用 Node.js 22.12+，执行 npm ci 和 npm run build，发布 dist 目录。保留独立影像馆 /portfolio/index.html、所有 34 张图片、three.js 与 GSAP 本地文件，不修改作品内容或恢复社群模块。部署后验证首页、影像馆 34 张图片加载、鼠标拖拽、点击大图及返回首页，返回本次生成并可公开访问的完整 HTTPS 链接。

## 素材与内容

- 星空影像馆：34 张（a-001 至 a-034），本次新增最后 6 张；原图及图内排版保留。
- AI 场景图片墙：10 张。
- 视觉网站参考封面：8 张，明确标为外部审美参考，非个人开发成果。
- GitHub 项目：保留原有公开/私有说明。
- 未在本次执行公网发布；源码与静态构建交由用户上传 WorkBuddy。
