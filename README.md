# Photoflife 摄影分享网站

一个使自动生成规则：
- 子文件夹名作为 `album`（会美化展示），如 `travel`
- 文件名会美化为 `title`（下划线/短横线变为空格，首字母大写）
- `date` 默认取文件的修改时间或 EXIF DateTimeOriginal，格式 `YYYY-MM`
- 自动读取 EXIF：设备 (camera)、镜头 (lens)、焦段 (focalLength)、等效焦段 (focalLength35mm)、光圈 (aperture)、快门 (shutter)、ISOact + Vite + Tailwind CSS 构建，并可部署到 GitHub Pages 的摄影作品展示网站。

## 功能概览
- 响应式照片网格，鼠标悬停动效
- 轻盒查看（点击照片放大，支持缩放 0.5x-5x、拖动查看、关闭）
- 优雅的排版（Inter + Playfair Display）
- 自动 EXIF 读取：设备、镜头、焦段、光圈、快门、ISO
- 视图切换：网格 / 按相册分组 / 时间轴排序
- 简单的数据驱动：只需把图片放到指定文件夹并在数据文件登记即可显示

## 将照片放在哪里（已自动扫描）

把你的图片放在 `public/photos/` 目录下（可用子文件夹分相册，例如 `public/photos/travel/xxx.jpg`）。

你无需再手动编辑 `src/data/photos.js`。我们在开发/构建前会自动扫描并生成 `src/data/photos.generated.js`，`photos.js` 会直接导出该文件。

快速同步命令（可选）：

```bash
npm run sync-photos
```

自动生成规则：
- 子文件夹名作为 `album`（会美化展示），如 `travel`
- 文件名会美化为 `title`（下划线/短横线会替换为空格，首字母大写）
- `date` 默认取文件的修改时间，格式 `YYYY-MM`

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建产物
npm run build

# 预览构建
npm run preview
```

## 部署到 GitHub Pages

1. 将仓库推送到 GitHub。例如仓库名为 `yourname/photoflife`。
2. 在 GitHub 仓库设置中启用 Pages：选择 `GitHub Actions` 或 `Deploy from a branch`。
3. 若使用我们提供的脚本（gh-pages 包）：

```bash
# 先构建
npm run build
# 将 dist 发布到 gh-pages 分支
npm run deploy
```

部署后你的站点地址通常是：
- 用户页（username.github.io）：`https://username.github.io/`
- 项目页（username.github.io/photoflife）：`https://username.github.io/photoflife/`

> 我们在 `vite.config.js` 中设置了 `base: './'`，可兼容 GitHub Pages 项目页的相对路径。若你使用用户主页仓库（username.github.io），也可以保持不变。

## 未来功能准备
- 轻量的相册/标签分类（可在 `photos.js` 添加 `tags` 字段）
- 支持 EXIF 信息读取（可在构建阶段或手动录入）
- 简易的多语言支持
- 页脚社交链接配置（在 `Header.jsx` / `Footer.jsx` 中调整）

## 目录结构

```
Photoflife/
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ public/
│  └─ photos/        # 把你的图片放到这里
├─ src/
│  ├─ index.css
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ Footer.jsx
│  │  └─ PhotoGrid.jsx
│  └─ data/
│     └─ photos.js   # 数据登记文件
└─ README.md
```
