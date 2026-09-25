# WorkBuddy 部署交接

这是 Felix 的 AI 共创社群网站，包含黑洞视频、动态首页、作品与星空影像馆，以及 `/lab` 社群页面。

## 部署配置

- 类型：React + Vite 静态网站，无后端和数据库。
- Node.js：22.12 或以上。
- 安装：`npm ci`。
- 构建：`npm run build`。
- 发布目录：`dist`。包内已有本次构建结果，也可以重新构建。
- 首页：`/`；社群：`/lab`；星空影像馆：`/portfolio/index.html`。
- 请将网站挂载于域名根路径，保留整个 `dist/portfolio/` 和本地 `vendor/` 文件。
- 真实文件优先于单页应用回退规则，不能把 `/portfolio/app.js`、图片或 `index.html` 重写成主站首页。
- 不要部署 `node_modules`、测试目录或源码根目录。`preview-server.mjs` 仅用于本地验收，不作为云端启动服务。

## 交给 WorkBuddy 的说明

请将此目录的 Felix AI 共创社群网站通过 WorkBuddy 内置云托管发布为静态网站。使用 Node.js 22.12+，执行 npm ci 和 npm run build，发布 dist 目录。保留带声音的黑洞开场视频、动态粒子黑洞首页、`/lab` 社群页面、独立影像馆 `/portfolio/index.html`、所有 34 张图片以及本地 three.js 与 GSAP 文件。部署后验证首次播放、首页动效、社群跳转、影像馆图片加载与拖拽，以及影像馆返回首页不重播视频，并返回公开访问的 HTTPS 链接。

## 素材与内容

- 星空影像馆：34 张（a-001 至 a-034），本次新增最后 6 张；原图及图内排版保留。
- AI 场景图片墙：10 张。
- 视觉网站参考封面：8 张，明确标为外部审美参考，非个人开发成果。
- GitHub 项目：保留原有公开/私有说明。
- GitHub 仓库只存放源码；仍需在 WorkBuddy 单独部署并验证。
