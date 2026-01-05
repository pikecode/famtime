import { create } from 'zustand';
import type { Event, EventStatus } from '@famtime/shared';

interface EventState {
  events: Record<string, Event[]>;  // key: YYYY-MM-DD
  pendingEvents: Event[];
  selectedDate: string;
  isLoading: boolean;

  setEvents: (date: string, events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  setPendingEvents: (events: Event[]) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
}

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const useEventStore = create<EventState>((set, get) => ({
  events: {},
  pendingEvents: [],
  selectedDate: formatDate(new Date()),
  isLoading: false,

  setEvents: (date, events) => {
    set((state) => ({
      events: {
        ...state.events,
        [date]: events,
      },
    }));
  },

  addEvent: (event) => {
    const dateKey = event.startTime.split('T')[0];
    set((state) => ({
      events: {
        ...state.events,
        [dateKey]: [...(state.events[dateKey] || []), event],
      },
    }));
  },

  updateEvent: (updatedEvent) => {
    const dateKey = updatedEvent.startTime.split('T')[0];
    set((state) => ({
      events: {
        ...state.events,
        [dateKey]: (state.events[dateKey] || []).map((e) =>
          e.id === updatedEvent.id ? updatedEvent : e
        ),
      },
    }));
  },

  removeEvent: (eventId) => {
    set((state) => {
      const newEvents = { ...state.events };
      Object.keys(newEvents).forEach((date) => {
        newEvents[date] = newEvents[date].filter((e) => e.id !== eventId);
      });
      return { events: newEvents };
    });
  },

  setPendingEvents: (events) => {
    set({ pendingEvents: events });
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));
