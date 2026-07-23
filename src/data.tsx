import { PlanetData, ModuleContent } from './types';

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

export const MODULE_CONTENT: Record<string, ModuleContent> = {
  profile: {
    id: 'profile',
    title: '简介',
    subtitle: 'PROFILE',
    body: (
      <div className="space-y-6 text-lg">
        <p className="font-bold text-2xl uppercase tracking-widest text-[#BE2E21]">
          <span className="text-[#DED8C4]">ID:</span> 0X-NEUTRINO
        </p>
        <div className="w-full h-1 bg-[#BE2E21]"></div>
        <p>
          独立开发者，视觉设计师与架构师。<br/>
          专注于探索技术与极致视觉表现的结合，打破传统界面的网格束缚。
        </p>
        <p>
          "秩序建立在对重力的反叛之上。"
        </p>
        <ul className="list-square pl-5 space-y-2 mt-8">
          <li>坐标: 地球 / 亚洲</li>
          <li>状态: 活跃运行中</li>
          <li>专精: 前端工程 / 3D交互 / 视觉设计</li>
        </ul>
      </div>
    ),
  },
  projects: {
    id: 'projects',
    title: '作品',
    subtitle: 'WORKS',
    body: (
      <div className="space-y-8">
        <div className="border-2 border-[#3A3935] p-4 relative group hover:bg-[#DED8C4] hover:border-[#DED8C4] transition-colors">
          <h3 className="text-3xl font-black mb-2 uppercase group-hover:text-[#121212]">Project.Alpha</h3>
          <p className="text-sm uppercase tracking-widest mb-4 group-hover:text-[#121212]">WebGL Data Visualization</p>
          <p className="group-hover:text-[#121212]">高维度数据的三维拓扑结构可视化，构建于 Three.js 之上。</p>
        </div>
        <div className="border-2 border-[#3A3935] p-4 relative group hover:bg-[#DED8C4] hover:border-[#DED8C4] transition-colors">
          <h3 className="text-3xl font-black mb-2 uppercase group-hover:text-[#121212]">System.Beta</h3>
          <p className="text-sm uppercase tracking-widest mb-4 group-hover:text-[#121212]">Brutalist E-commerce</p>
          <p className="group-hover:text-[#121212]">反常规排版的电商体验实验，纯粹的黑白红美学体系。</p>
        </div>
      </div>
    ),
  },
  skills: {
    id: 'skills',
    title: '技能',
    subtitle: 'SKILLS',
    body: (
      <div className="space-y-6">
        {[
          { name: 'THREE.JS / WEBGL', level: 90 },
          { name: 'REACT / VITE', level: 95 },
          { name: 'TYPESCRIPT', level: 85 },
          { name: 'UI / UX DESIGN', level: 80 },
        ].map((skill) => (
          <div key={skill.name} className="space-y-2">
            <div className="flex justify-between font-bold uppercase tracking-wider text-xl">
              <span>{skill.name}</span>
              <span className="text-[#BE2E21]">{skill.level}%</span>
            </div>
            <div className="w-full h-3 bg-[#121212] border-2 border-[#333]">
              <div
                className="h-full bg-[#BE2E21]"
                style={{ width: `${skill.level}%` }}
              ></div>
            </div>
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
      <div className="space-y-8">
        <p className="text-xl font-bold uppercase tracking-widest">
          初始化通信协议...
        </p>
        <div className="w-full h-2 bg-[#BE2E21]"></div>
        <div className="space-y-4 text-2xl font-black">
          <a href="#" className="block hover:text-[#BE2E21] hover:translate-x-4 transition-transform">
            [ EMAIL ] HELLO@SYSTEM.COM
          </a>
          <a href="#" className="block hover:text-[#BE2E21] hover:translate-x-4 transition-transform">
            [ GITHUB ] @NEUTRINO
          </a>
          <a href="#" className="block hover:text-[#BE2E21] hover:translate-x-4 transition-transform">
            [ TWITTER ] @SYSTEM_CORE
          </a>
        </div>
        <div className="mt-12 p-6 border-4 border-[#BE2E21] bg-[#121212] text-[#BE2E21] font-bold uppercase">
          <p>WARNING: EXPECT DELAYED TRANSMISSIONS ACROSS SECTORS.</p>
        </div>
      </div>
    ),
  },
};
