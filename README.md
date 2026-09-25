# Felix · AI 共创社群网站

面向 CUPK 同学的 AI 学习与共创网站，包含黑洞视频序章、动态粒子黑洞首页、视觉作品、项目展示、星空影像馆和 AI 共创社群页面。八个外部视觉网站仅作为审美参考选集，不作为本人开发成果。

## 本地运行

需要 Node.js 22.12 或以上。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:52125/。生产预览使用 `npm run preview`；静态部署文件由 `npm run build` 输出到 `dist/`。

## 内容维护

- 黑洞视频和页面衔接：`src/components/OpeningSequence.jsx`
- 动态粒子黑洞：`public/felix-opening/scene.js`；Canvas 备用实现：`public/felix-opening/opening.js`
- 网站作品：`src/data/projectItems.js`
- GitHub 项目：`src/data/githubProjects.js`
- 影像馆：`public/portfolio/collection.js`，已收录 34 张，不设置空位。
- 社群内容：`src/data/community.js`、`src/pages/LabPage.jsx`

首次访问先播放黑洞视频，随后进入动态粒子黑洞首页；下滑进入星空视觉作品与项目展示。站内导航与影像馆返回不重复播放视频。社群详情位于 `/lab`。

本目录是完整独立源码，不依赖其他项目目录或符号链接。GitHub 仓库用于存放源码，不等同于网站已部署上线。

## WorkBuddy 部署

详见 `WORKBUDDY_DEPLOY.md`。源码包同时提供 `dist/` 成品；静态托管发布目录为 `dist`，不是项目根目录。无需数据库、API Key 或后端服务。

## 检查

`npm test` 检查内容边界；先启动预览，再运行 `npm run test:browser` 检查桌面、移动尺寸和影像馆。浏览器检查需 Python Playwright 及本机 Chrome。
