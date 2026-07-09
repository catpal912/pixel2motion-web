# Pixel2Motion Web

在浏览器中将像素 Logo 转换为 **SVG 矢量图形** 并生成 **CSS 动画**，无需服务器，完全免费。

---

## 功能特性

- 🖼️ **图片上传**：支持 PNG、JPG、WebP 格式
- 🔄 **实时矢量化**：Canvas 像素读取 + 轮廓提取 + Douglas–Peucker 简化
- ✨ **动画生成**：5 种动画模式（交错显现、描边绘制、弹性弹出、淡入滑动、形变入场）
- 🎛️ **参数调节**：阈值、平滑度、颜色、动画时长、间隔、方向等
- 📦 **独立导出**：生成不依赖任何外部资源的单文件 HTML
- 🚀 **Vercel 一键部署**：零服务器成本

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开 http://localhost:3000
```

---

## 部署到 Vercel

### 方式一：GitHub + Vercel 自动部署（推荐）

1. 在 GitHub 上创建一个新仓库，将本项目代码 push 上去
2. 登录 [vercel.com](https://vercel.com)，点击 **Add New Project**
3. 选择刚才创建的 GitHub 仓库
4. Vercel 会自动识别 Next.js 项目，保持默认配置即可
5. 点击 **Deploy**，等待构建完成
6. 获得 `https://your-project.vercel.app` 域名

### 方式二：Vercel CLI 本地部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 方式三：静态文件手动上传

```bash
# 构建静态输出
npm run build

# 输出目录为 ./dist，可直接上传到任何静态托管服务
```

---

## 项目结构

```
pixel2motion-web/
├── app/              # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx      # 主页面
├── components/       # React 组件
│   ├── UploadZone.tsx
│   ├── SvgPreview.tsx
│   └── ControlPanel.tsx
├── lib/              # 核心库
│   ├── tracer.ts     # 图片 → SVG 转换（浏览器端）
│   ├── motionEngine.ts  # CSS 动画生成
│   ├── svgUtils.ts   # SVG 解析与工具
│   └── types.ts      # TypeScript 类型
├── package.json
├── next.config.js
└── tailwind.config.ts
```

---

## 技术说明

### 与原版 Pixel2Motion 的区别

原版 Pixel2Motion 是一个 **Python 桌面工具链**，依赖 Chrome Headless + Playwright + Pillow，用于专业级 Logo 动画工作流。

本项目是 **纯前端改造版**：
- 用 Canvas API + Marching Squares 替代 Potrace
- 用浏览器内 CSS 动画替代 Python 脚本生成
- 所有计算在浏览器端完成，无需服务器

**适用场景**：快速原型、个人项目、轻量 Logo 动画生成。
**不适用场景**：需要专业级矢量拟合 QA、批量处理、4K 视频导出。

---

## License

MIT
