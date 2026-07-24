export type ModuleId = 'profile' | 'projects' | 'skills' | 'contact';

export type PlanetClass = 'rocky' | 'gas-giant';

export interface ModuleNode {
  id: ModuleId;
  index: string;
  title: string;
  subtitle: string;
  systemLabel: string;
}

export interface PlanetData extends ModuleNode {
  radius: number;
  speed: number;
  size: number;
  geometryDetail: 0 | 1 | 2;
  planetClass: PlanetClass;
  hasRings?: boolean;
  color: string;
}

export interface ModuleContent {
  id: ModuleId;
  title: string;
  subtitle: string;
  body: React.ReactNode;
}
