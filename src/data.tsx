import { ModuleContent, ModuleNode, PlanetData } from './types';

export const PLANETS: PlanetData[] = [
  {
    id: 'profile',
    index: '01',
    radius: 8.5,
    speed: 0.16,
    size: 0.72,
    geometryDetail: 0,
    planetClass: 'rocky',
    title: '简介',
    subtitle: 'PROFILE',
    systemLabel: 'INNER / ROCK I',
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
    title: '作品',
    subtitle: 'WORKS',
    systemLabel: 'INNER / ROCK II',
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
    title: '技能',
    subtitle: 'SKILLS',
    systemLabel: 'OUTER / GAS I',
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
    systemLabel: 'OUTER / GAS II',
    color: '#D0C3A4',
  },
];

export const NAV_NODES: ModuleNode[] = PLANETS;

export const MODULE_CONTENT: Record<ModuleNode['id'], ModuleContent> = {
  profile: {
    id: 'profile',
    title: '简介',
    subtitle: 'PROFILE',
    body: (
      <div className="personnel-record">
        <div className="personnel-record__identity">
          <span>ID / 0X-NEUTRINO</span>
          <strong>独立开发者、视觉设计师与架构师。</strong>
          <p>专注于探索技术与极致视觉表现的结合，在结构、空间与交互之间建立新的秩序。</p>
        </div>
        <dl className="archive-ledger">
          <div><dt>LOCATION</dt><dd>EARTH / ASIA</dd></div>
          <div><dt>STATUS</dt><dd>ACTIVE / AVAILABLE</dd></div>
          <div><dt>FOCUS</dt><dd>FRONTEND / WEBGL / VISUAL SYSTEMS</dd></div>
        </dl>
        <blockquote>“秩序建立在对重力的反叛之上。”</blockquote>
      </div>
    ),
  },
  projects: {
    id: 'projects',
    title: '作品',
    subtitle: 'WORKS',
    body: (
      <div className="mission-archive">
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.001</span>
            <span>2025 / DEPLOYED</span>
          </div>
          <div className="mission-entry__content">
            <p>WEBGL DATA VISUALIZATION</p>
            <h3>PROJECT.ALPHA</h3>
            <span>高维数据的三维拓扑结构可视化，构建于 Three.js 之上。</span>
          </div>
        </article>
        <article className="mission-entry">
          <div className="mission-entry__rail">
            <span>OP.002</span>
            <span>2026 / EXPERIMENT</span>
          </div>
          <div className="mission-entry__content">
            <p>BRUTALIST COMMERCE SYSTEM</p>
            <h3>SYSTEM.BETA</h3>
            <span>以反常规排版重构商业体验，使用黑、纸白与信号红建立高压视觉秩序。</span>
          </div>
        </article>
      </div>
    ),
  },
  skills: {
    id: 'skills',
    title: '技能',
    subtitle: 'SKILLS',
    body: (
      <div className="diagnostics-list">
        {[
          { name: 'THREE.JS / WEBGL', level: 90, code: 'GFX.01' },
          { name: 'REACT / VITE', level: 95, code: 'SYS.02' },
          { name: 'TYPESCRIPT', level: 85, code: 'ENG.03' },
          { name: 'UI / UX DESIGN', level: 80, code: 'VIS.04' },
        ].map((skill) => (
          <div key={skill.name} className="diagnostic-row">
            <span className="diagnostic-row__code">{skill.code}</span>
            <strong>{skill.name}</strong>
            <div className="diagnostic-row__signal" aria-label={`${skill.level}%`}>
              {Array.from({ length: 10 }, (_, index) => (
                <span key={index} className={index < Math.round(skill.level / 10) ? 'is-on' : ''} />
              ))}
            </div>
            <span className="diagnostic-row__value">{(skill.level / 10).toFixed(1)}</span>
          </div>
        ))}
      </div>
    ),
  },
  contact: {
    id: 'contact',
    title: '联系',
    subtitle: 'CONTACT',
    body: (
      <div className="transmission-record">
        <p className="transmission-record__prompt">
          &gt; COMMUNICATION PROTOCOL READY<span className="terminal-cursor" />
        </p>
        <div className="transmission-channels">
          <a href="mailto:hello@system.com">
            <span>CH.01 / EMAIL</span>
            <strong>HELLO@SYSTEM.COM</strong>
            <small>OPEN CHANNEL ↗</small>
          </a>
          <a href="https://github.com/neutrino" target="_blank" rel="noreferrer">
            <span>CH.02 / GITHUB</span>
            <strong>@NEUTRINO</strong>
            <small>EXTERNAL LINK ↗</small>
          </a>
          <a href="https://x.com/system_core" target="_blank" rel="noreferrer">
            <span>CH.03 / SOCIAL</span>
            <strong>@SYSTEM_CORE</strong>
            <small>EXTERNAL LINK ↗</small>
          </a>
        </div>
        <p className="transmission-record__warning">
          SIGNAL NOTICE / EXPECT DELAYED TRANSMISSIONS ACROSS SECTORS.
        </p>
      </div>
    ),
  },
};
