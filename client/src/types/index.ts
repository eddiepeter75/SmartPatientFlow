// Patient interface
export interface Patient {
  id: string;
  number: number;
  name: string;
  department: string;
  patientType?: string;
  status: 'waiting' | 'in-triage' | 'waiting-consultation' | 'in-service' | 'completed';
  priority: 'urgent' | 'normal';
  timestamp: number;
  called: boolean;
  assignedRoom?: string;
  doctorRoom?: string;
  currentRoom?: string;
  announcementPlayed?: boolean;
}

// Room interface for room status display
export interface RoomInfo {
  id: string;
  name: string;
  department: string;
  status: 'available' | 'busy' | 'unavailable';
  currentPatient: {
    id: string;
    name: string;
  } | null;
}

// Room recommendation interface
export interface Room {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'unavailable';
  reason: string;
}
