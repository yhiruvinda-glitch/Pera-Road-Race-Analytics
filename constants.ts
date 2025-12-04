import { EventStandard, Athlete } from "./types";

export const INITIAL_STANDARDS: EventStandard[] = [
  { id: '1', name: '1500m', goldTime: 245, kValue: 1.1 },
  { id: '2', name: '3000m', goldTime: 560, kValue: 1.1 },
  { id: '3', name: '5000m', goldTime: 970, kValue: 1.1 },
  { id: '4', name: '7km', goldTime: 1460, kValue: 1.1 },
  { id: '5', name: '10km', goldTime: 2070, kValue: 1.1 },
];

export const INITIAL_ATHLETES: Athlete[] = [
  { 
    id: 'a1', 
    name: 'John Doe', 
    personalBests: [{ eventId: '1', time: 250 }], 
    isActive: true,
    photoUrl: 'https://picsum.photos/200/200?random=1'
  },
  { 
    id: 'a2', 
    name: 'Jane Smith', 
    personalBests: [{ eventId: '3', time: 990 }], 
    isActive: true,
     photoUrl: 'https://picsum.photos/200/200?random=2'
  },
];
