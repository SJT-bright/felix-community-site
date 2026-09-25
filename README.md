# 司钧霆 Felix · 求职作品集

独立的个人求职网站，展示个人简介、项目实践、视觉审美参考、GitHub 开发项目与星空影像馆。上方八个外部网站为欣赏与参考选集，不作为本人开发成果；下方为个人实用项目，保留公开与私有状态的区分。

## 本地运行

需要 Node.js 22.12 或以上。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:52125/。生产预览使用 `npm run preview`；静态部署文件由 `npm run build` 输出到 `dist/`。

## 内容维护

- 经历与求职联系方式：`src/data/career.js`
- 首屏介绍：`src/components/ProfileLanding.jsx`
- 网站作品：`src/data/projectItems.js`
- GitHub 项目：`src/data/githubProjects.js`
- 影像馆：`public/portfolio/collection.js`，已收录 34 张，不设置空位。

首次访问先播放可跳过的黑洞视频，随后进入新粒子黑洞首页，下滑经过星空过渡进入原个人介绍。站内导航与影像馆返回不重复播放。接入细节参见《新首页接入说明.md》。作品资料沿用 Felix 提供的真实内容；个人净利润与团队成交额分别列示，不相加。尚未提供的专业、毕业时间、到岗时间等信息没有编造。

本目录是完整独立副本，不依赖其他项目目录或符号链接。修改此版本不会影响其他网站。本次仅提供本地预览和静态构建，尚未发布到公网。

## WorkBuddy 部署

详见 `WORKBUDDY_DEPLOY.md`。源码包同时提供 `dist/` 成品；静态托管发布目录为 `dist`，不是项目根目录。无需数据库、API Key 或后端服务。

## 检查

`npm test` 检查内容边界；先启动预览，再运行 `npm run test:browser` 检查桌面、移动尺寸和影像馆。浏览器检查需 Python Playwright 及本机 Chrome。
