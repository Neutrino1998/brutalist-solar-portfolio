export type ModuleId = 'profile' | 'projects' | 'skills' | 'contact';

export interface PlanetData {
  id: ModuleId;
  index: string;
  radius: number;
  speed: number;
  size: number;
  title: string;
  subtitle: string;
  systemLabel: string;
  color: string;
}

export interface ModuleContent {
  id: ModuleId;
  title: string;
  subtitle: string;
  body: React.ReactNode;
}
