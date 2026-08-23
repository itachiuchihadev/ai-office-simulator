// js/event-bus.js — Lightweight pub/sub event system

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const fns = this.listeners.get(event);
    if (fns) fns.delete(fn);
  }

  emit(event, data) {
    const fns = this.listeners.get(event);
    if (fns) fns.forEach(fn => fn(data));
  }
}

export const eventBus = new EventBus();
