import { ModuleContent, ModuleNode, PlanetData } from './types';
import SignalStudies from './components/SignalStudies';

export const PLANETS: PlanetData[] = [
  {
    id: 'profile',
    index: '01',
    radius: 8.5,
    speed: 0.16,
    size: 0.72,
    geometryDetail: 0,
    planetClass: 'rocky',
    title: '档案',
    subtitle: 'PROFILE',
    systemLabel: 'CORE / IDENTITY',
    color: '#817D73',
  },
  {
    id: 'projects',
    index: '02',
    radius: 12.5,
    speed: 0.11,
    size: 0.98,
    geometryDetail: 0,
    planetClass: 'rocky',
    title: '项目',
    subtitle: 'PROJECTS',
    systemLabel: 'ORBIT / SELECTED WORK',
    color: '#B85A3C',
  },
  {
    id: 'skills',
    index: '03',
    radius: 21,
    speed: 0.055,
    size: 1.82,
    geometryDetail: 1,
    planetClass: 'gas-giant',
    title: '能力',
    subtitle: 'SYSTEMS',
    systemLabel: 'STACK / CAPABILITY',
    color: '#B9A47C',
  },
  {
    id: 'contact',
    index: '04',
    radius: 28.5,
    speed: 0.036,
    size: 2.36,
    geometryDetail: 2,
    planetClass: 'gas-giant',
    hasRings: true,
    title: '联系',
    subtitle: 'CONTACT',
    systemLabel: 'SIGNAL / CONTACT',
    color: '#D0C3A4',
  },
];

export const NAV_NODES: ModuleNode[] = PLANETS;

export const MODULE_CONTENT: Record<ModuleNode['id'], ModuleContent> = {
  profile: {
    id: 'profile',
    title: '个人档案',
    subtitle: 'PROFILE',
    body: (
      <div className="personnel-record">
        <blockquote>构建能在真实约束中长期运行的 AI 系统，而不只是一次成功的演示。</blockquote>
        <div className="personnel-record__identity">
          <span>ID / 0X-NEUTRINO</span>
          <strong>AI 智能体平台工程师，专注私有化与受监管环境中的生产级 AI 系统。</strong>
          <p>
            拥有 5 年金融科技数据与 AI 系统研发经验，工作横跨执行引擎、后端服务、
            分布式运行时、前端交互与离线部署。擅长把 AI 原型推进为可部署、可治理、
            可观测的完整产品。
          </p>
        </div>
        <dl className="archive-ledger">
          <div><dt>ROLE</dt><dd>AI AGENT PLATFORM ENGINEER</dd></div>
          <div><dt>EXPERIENCE</dt><dd>5+ YEARS / FINANCIAL AI SYSTEMS</dd></div>
          <div><dt>FOCUS</dt><dd>AGENT RUNTIME / PRIVATE DEPLOYMENT / RAG</dd></div>
          <div><dt>SCOPE</dt><dd>ENGINE / BACKEND / FRONTEND / INFRA</dd></div>
          <div><dt>BASE</dt><dd>CHINA / ASIA</dd></div>
        </dl>
        <div className="mission-archive personnel-record__education" aria-label="教育背景">
          <article className="mission-entry">
            <div className="mission-entry__rail">
              <span>EDU.01</span>
              <span>2020—2021</span>
            </div>
            <div className="mission-entry__content">
              <p>MASTER / DATA MODELING</p>
              <h3>香港科技大学</h3>
              <span>数据建模理学硕士 · GPA 3.9 / 4.3 · 入学奖学金 · 最佳演讲者</span>
            </div>
          </article>
          <article className="mission-entry">
            <div className="mission-entry__rail">
              <span>EDU.02</span>
              <span>2016—2020</span>
            </div>
            <div className="mission-entry__content">
              <p>BACHELOR / PHYSICS</p>
              <h3>香港科技大学</h3>
              <span>物理学理学士 · 一级荣誉 · GPA 3.6 / 4.3 · 院长优等生名录</span>
            </div>
          </article>
          <article className="mission-entry">
            <div className="mission-entry__rail">
              <span>EDU.03</span>
              <span>2019 / EXCHANGE</span>
            </div>
            <div className="mission-entry__content">
              <p>PHYSICS / MACHINE LEARNING</p>
              <h3>慕尼黑工业大学</h3>
              <span>固态物理与机器学习交换学习</span>
            </div>
          </article>
        </div>
      </div>
    ),
  },
  projects: {
    id: 'projects',
    title: '代表项目',
    subtitle: 'PROJECTS',
    body: (
      <div className="mission-archive">
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.001</span>
            <span>2025—NOW / PUBLIC</span>
          </div>
          <div className="mission-entry__content">
            <p>PUBLIC REPOSITORY / PI-STYLE MULTI-AGENT STACK</p>
            <h3>
              <a
                className="text-inherit no-underline"
                href="https://github.com/Neutrino1998/artifact-flow"
                target="_blank"
                rel="noreferrer"
              >
                ArtifactFlow ↗
              </a>
            </h3>
            <span>
              面向私有化 AI 服务的公开项目：自研扁平执行引擎、可配置 Agent / Tool / Model、
              双 Artifact、SSE 权限中断、多数据库与 Redis 分布式运行时。技术栈覆盖
              FastAPI、Next.js、SQLAlchemy 与 Docker。
            </span>
          </div>
        </article>
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.002</span>
            <span>2026 / PUBLIC</span>
          </div>
          <div className="mission-entry__content">
            <p>INTERACTIVE LLM SYSTEM ENGINEERING WORKSHOP</p>
            <h3>
              <a
                className="text-inherit no-underline"
                href="https://github.com/Neutrino1998/llm-workshop"
                target="_blank"
                rel="noreferrer"
              >
                LLM Workshop ↗
              </a>
            </h3>
            <span>
              面向大模型初学者的交互式教学工具，以 6 个递进阶段可视化展示 API 调用、
              System Prompt、多轮对话、工具调用、RAG 与 Agentic RAG；使用真实模型调用而非 Mock 数据。
            </span>
          </div>
        </article>
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.003</span>
            <span>2026 / PUBLIC</span>
          </div>
          <div className="mission-entry__content">
            <p>INTERACTIVE 3D PERSONAL PORTFOLIO</p>
            <h3>
              <a
                className="text-inherit no-underline"
                href="https://github.com/Neutrino1998/brutalist-solar-portfolio"
                target="_blank"
                rel="noreferrer"
              >
                Brutalist Solar Portfolio ↗
              </a>
            </h3>
            <span>
              以太阳系为主体的 3D 个人展示页，将苏联构成主义、粗野主义排版与动态时空网格结合，
              使用 React、TypeScript、Three.js 与 React Three Fiber 构建。
            </span>
          </div>
        </article>
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.004</span>
            <span>2024—NOW / SANITIZED</span>
          </div>
          <div className="mission-entry__content">
            <p>ENTERPRISE AGENT PLATFORM</p>
            <h3>通用智能体平台</h3>
            <span>
              面向数据不出域场景建设多智能体运行平台，覆盖事件溯源、上下文压缩、
              工具权限、安全沙盒、组织级能力治理与多 Worker 私有化部署。单位与内部系统信息已脱敏。
            </span>
          </div>
        </article>
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.005</span>
            <span>2024—2026 / SANITIZED</span>
          </div>
          <div className="mission-entry__content">
            <p>MULTI-AGENT RESEARCH WORKFLOW</p>
            <h3>自动调研报告系统</h3>
            <span>
              将检索、网页解析、多模型路由、分工撰写、审阅校验与 Word 交付串联为端到端流程，
              并通过单代理 ReAct 基线对照验证多智能体方案。
            </span>
          </div>
        </article>
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.006</span>
            <span>2021—2025 / SANITIZED</span>
          </div>
          <div className="mission-entry__content">
            <p>FINANCIAL TIME-SERIES INTELLIGENCE</p>
            <h3>异常检测与根因分析</h3>
            <span>
              为高容量金融业务数据构建预测、极值检测、贡献度分析与关联规则方案，
              并将实验算法推进为可容器化部署、可与业务系统集成的服务组件。
            </span>
          </div>
        </article>
      </div>
    ),
  },
  skills: {
    id: 'skills',
    title: '系统能力',
    subtitle: 'SYSTEMS',
    body: (
      <div className="systems-diagnostics">
        <p className="system-status">
          &gt; CAPABILITY MATRIX / SYSTEMS ONLINE
        </p>
        <div className="diagnostics-list">
          {[
            { name: 'AGENT SYSTEMS / RAG / MCP', level: 95, code: 'AI.01' },
            { name: 'PYTHON / FASTAPI / ASYNC', level: 95, code: 'BE.02' },
            { name: 'REDIS / SQL / EVENT STREAMS', level: 90, code: 'DS.03' },
            { name: 'REACT / NEXT.JS / TYPESCRIPT', level: 85, code: 'FE.04' },
            { name: 'DOCKER / PRIVATE DEPLOYMENT', level: 90, code: 'OP.05' },
            { name: 'TIME SERIES / AIOPS', level: 85, code: 'DA.06' },
          ].map((skill) => {
            const signalLevel = skill.level / 10;

            return (
              <div key={skill.name} className="diagnostic-row">
                <span className="diagnostic-row__code">{skill.code}</span>
                <strong>{skill.name}</strong>
                <div className="diagnostic-row__signal" aria-label={`${skill.level}%`}>
                  {Array.from({ length: 10 }, (_, index) => {
                    const cellState = index < Math.floor(signalLevel)
                      ? 'is-on'
                      : index < signalLevel
                        ? 'is-half'
                        : '';

                    return <span key={index} className={cellState} />;
                  })}
                </div>
                <span className="diagnostic-row__value">{signalLevel.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  contact: {
    id: 'contact',
    title: '联系',
    subtitle: 'CONTACT',
    body: (
      <div className="transmission-record">
        <div className="transmission-channels">
          <a href="mailto:1998neutrino@gmail.com">
            <span>CH.01 / EMAIL</span>
            <strong>1998neutrino@gmail.com</strong>
            <small>OPEN CHANNEL ↗</small>
          </a>
          <a href="https://github.com/Neutrino1998" target="_blank" rel="noreferrer">
            <span>CH.02 / GITHUB</span>
            <strong>@Neutrino1998</strong>
            <small>EXTERNAL LINK ↗</small>
          </a>
          <a href="https://github.com/Neutrino1998/artifact-flow" target="_blank" rel="noreferrer">
            <span>CH.03 / PROJECT</span>
            <strong>ArtifactFlow</strong>
            <small>PUBLIC REPO ↗</small>
          </a>
        </div>
        <p className="transmission-record__warning">
          PUBLIC PROFILE / EMPLOYER AND INTERNAL SYSTEM IDENTIFIERS REDACTED.
        </p>
        <SignalStudies />
      </div>
    ),
  },
};
