import type { ChatMessage } from './types';

export interface ChatSession { id: string; name: string; messages: ChatMessage[]; parent?: string; createdAt: number }
export interface SessionsState { active: string; sessions: ChatSession[] }

export const MAIN_ID = 'main';

export function initialState(mainMessages: ChatMessage[] = [], now = Date.now()): SessionsState {
  return { active: MAIN_ID, sessions: [{ id: MAIN_ID, name: '主线', messages: mainMessages, createdAt: now }] };
}

/** Parse "/side [message]". Returns null when the text is not a /side command. */
export function parseSide(text: string): { message: string } | null {
  const m = text.trim().match(/^\/side(?:\s+([\s\S]*))?$/i);
  return m ? { message: (m[1] ?? '').trim() } : null;
}

function nextSideNumber(state: SessionsState): number {
  const nums = state.sessions.map((s) => s.name.match(/^支线 (\d+)$/)?.[1]).filter(Boolean).map(Number);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

/** Fork `fromId` into a new side session (deep-copied history) and make it active. Pure. */
export function forkSession(state: SessionsState, fromId: string, now = Date.now(), id = `side-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`): { state: SessionsState; id: string } {
  const src = state.sessions.find((s) => s.id === fromId) ?? state.sessions[0]!;
  const side: ChatSession = {
    id, name: `支线 ${nextSideNumber(state)}`, parent: src.id, createdAt: now,
    messages: src.messages.filter((m) => m.content).map((m) => ({ ...m })),
  };
  return { state: { active: id, sessions: [...state.sessions, side] }, id };
}

/** Close a side session (main can't be closed); falls back to main if it was active. Pure. */
export function closeSession(state: SessionsState, id: string): SessionsState {
  if (id === MAIN_ID) return state;
  const sessions = state.sessions.filter((s) => s.id !== id);
  return { sessions, active: state.active === id || !sessions.some((s) => s.id === state.active) ? MAIN_ID : state.active };
}

export function setActive(state: SessionsState, id: string): SessionsState {
  return state.sessions.some((s) => s.id === id) ? { ...state, active: id } : state;
}

export function appendMessages(state: SessionsState, id: string, msgs: ChatMessage[]): SessionsState {
  return { ...state, sessions: state.sessions.map((s) => (s.id === id ? { ...s, messages: [...s.messages, ...msgs] } : s)) };
}

export function getSession(state: SessionsState, id: string): ChatSession | undefined {
  return state.sessions.find((s) => s.id === id);
}
