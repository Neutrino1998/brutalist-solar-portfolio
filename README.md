# Brutalist Solar Portfolio

一个以太阳系为主体的 3D 个人展示页。视觉语言结合苏联构成主义、粗野主义平面设计与科普作品中的时空网格意象：行星沿轨道缓慢公转，并在网格上形成实时跟随的重力凹陷。

## 当前特性

- 发光恒星核心、低多边形行星与动态轨道系统
- 与行星位置共用同一坐标模型的重力网格和凹陷
- 贴合变形网格、穿过对应行星中心的动态轨道线
- 自动聚焦距离相机最近的行星，悬停时切换焦点
- 01–04 模块导航：简介、作品、技能与联系
- 拖拽旋转视角，滚轮调整相机距离
- 桌面端与移动端响应式构图
- 构成主义红 `#BE2E21`、暖白 `#DED8C4` 与深灰网格

## 技术栈

- React 19 + TypeScript
- Vite 6
- Three.js
- React Three Fiber + Drei
- Tailwind CSS 4
- Motion

## 本地运行

需要 Node.js 20 或更高版本。当前页面不调用 Gemini API，也不需要配置 API Key。

```bash
npm install
npm run dev
```

开发服务器默认使用 `http://localhost:3000`。如果端口已被占用，Vite 会自动选择下一个可用端口。

## 可用命令

```bash
npm run dev      # 启动开发服务器
npm run lint     # TypeScript 类型检查
npm run build    # 创建生产构建
npm run preview  # 预览生产构建
```

## 项目结构

```text
src/
├── components/
│   ├── CanvasScene.tsx  # 3D 场景、恒星、行星、网格与轨道
│   └── OverlayUI.tsx    # 平面界面、模块导航与内容面板
├── App.tsx              # 页面状态与视觉基底
├── data.tsx             # 行星参数和模块内容
└── types.ts             # 共享类型

references/
├── editorial-aesthetic.html
└── EDITORIAL_AESTHETIC.md
```

设计参考保存在 [`references/editorial-aesthetic.html`](references/editorial-aesthetic.html)。
