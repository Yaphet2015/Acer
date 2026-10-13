export type IconType = 'target' | 'lightbulb' | 'list' | 'chart' | 'flag' | 'book' | 'warning' | 'check';
export const ICON_TYPES: IconType[] = ['target', 'lightbulb', 'list', 'chart', 'flag', 'book', 'warning', 'check'];

export interface Section { title: string; icon: IconType; bullets: string[] }
export interface Summary { overview: string; keyTerms: string[]; sections: Section[] }
export interface ChatMessage { role: 'user' | 'assistant'; content: string; /** what the UI shows instead of content (e.g. a Skill run) */ label?: string }
export interface Settings { baseUrl: string; apiKey: string; model: string; mock: boolean }
export const DEFAULT_SETTINGS: Settings = { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', mock: false };
