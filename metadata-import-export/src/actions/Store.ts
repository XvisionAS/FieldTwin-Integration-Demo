import { writable } from 'svelte/store';

export interface IStore {
  token: string;
  event: IEvent;
}

export interface IEvent {
  id: string;
  event: string;
  type: any;
  data: any;
}

const Store = writable({
  token: '' as string,
  event: {} as IEvent
} as IStore)

export { Store }