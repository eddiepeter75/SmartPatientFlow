import { ref, get } from "firebase/database";
import { db } from "./firebase";
import { Patient, Room } from "@/types";

// Room definitions with compatible departments
const roomDepartmentMapping: Record<string, {
  name: string;
  compatibleWith: string[];
  specialFeatures?: string[];
}> = {
  'Consultation room 1': {
    name: 'Consultation room 1',
    compatibleWith: ['General', 'Orthopedics'],
    specialFeatures: ['Basic equipment']
  },
  'Consultation room 2': {
    name: 'Consultation room 2',
    compatibleWith: ['General', 'Consultation'],
    specialFeatures: ['Advanced diagnostic equipment']
  },
  'Consultation room 3': {
    name: 'Consultation room 3',
    compatibleWith: ['Emergency', 'Consultation'],
    specialFeatures: ['Emergency equipment', 'Trauma supplies']
  },
  'Consultation room 4': {
    name: 'Consultation room 4',
    compatibleWith: ['Pediatrics', 'Orthopedics'],
    specialFeatures: ['Child-friendly environment', 'Orthopedic tools']
  }
};

// Get the current room availability
async function getRoomAvailability(): Promise<Record<string, boolean>> {
  const tokensRef = ref(db, 'patients/tokens');
  const snapshot = await get(tokensRef);
  const tokens = snapshot.val();
  
  // Default all rooms to available
  const roomAvailability: Record<string, boolean> = {
    'Consultation room 1': true,
    'Consultation room 2': true,
    'Consultation room 3': true,
    'Consultation room 4': true
  };
  
  if (tokens) {
    // Find patients currently being served in rooms
    Object.values(tokens).forEach((token: any) => {
      if (token.status === 'in-service' && token.assignedRoom) {
        roomAvailability[token.assignedRoom] = false;
      }
    });
  }
  
  return roomAvailability;
}

// Count patients waiting per room
async function getWaitingCountsByRoom(): Promise<Record<string, number>> {
  const tokensRef = ref(db, 'patients/tokens');
  const snapshot = await get(tokensRef);
  const tokens = snapshot.val();
  
  const waitingCounts: Record<string, number> = {
    'Consultation room 1': 0,
    'Consultation room 2': 0,
    'Consultation room 3': 0,
    'Consultation room 4': 0
  };
  
  if (tokens) {
    Object.values(tokens).forEach((token: any) => {
      if (token.status === 'waiting-consultation' && token.assignedRoom) {
        waitingCounts[token.assignedRoom] = (waitingCounts[token.assignedRoom] || 0) + 1;
      }
    });
  }
  
  return waitingCounts;
}

// Recommend a room based on department, patient type, and emergency status
export async function recommendRoom(
  department: string,
  patientType: string,
  isEmergency: boolean
): Promise<{ room: Room, confidence: 'high' | 'medium' | 'low', reason: string }> {
  const roomAvailability = await getRoomAvailability();
  const waitingCounts = await getWaitingCountsByRoom();
  
  // Default room data structure
  const defaultRoom: Room = {
    id: 'room1',
    name: 'Consultation room 1',
    status: 'available',
    reason: 'Based on availability'
  };
  
  // 1. Emergency cases are directed to Room 3 if available
  if (isEmergency || department === 'Emergency') {
    if (roomAvailability['Consultation room 3']) {
      return {
        room: {
          id: 'room3',
          name: 'Consultation room 3',
          status: 'available',
          reason: isEmergency ? 'Emergency case requires immediate attention' : 'Designated for emergency department'
        },
        confidence: 'high',
        reason: 'Emergency cases are prioritized for Room 3'
      };
    } else {
      // If Emergency room is not available, find another compatible room
      return {
        room: {
          id: 'room1',
          name: 'Consultation room 1',
          status: roomAvailability['Consultation room 1'] ? 'available' : 'busy',
          reason: 'Alternate room for emergency case as Room 3 is occupied'
        },
        confidence: 'medium',
        reason: 'Primary emergency room is not available'
      };
    }
  }
  
  // 2. For specific departments, check compatible rooms and their availability
  const compatibleRooms = Object.entries(roomDepartmentMapping)
    .filter(([, roomInfo]) => roomInfo.compatibleWith.includes(department))
    .sort((a, b) => {
      // Sort by availability first
      if (roomAvailability[a[0]] && !roomAvailability[b[0]]) return -1;
      if (!roomAvailability[a[0]] && roomAvailability[b[0]]) return 1;
      
      // Then by waiting count (fewer waiting patients first)
      return waitingCounts[a[0]] - waitingCounts[b[0]];
    });
  
  if (compatibleRooms.length > 0) {
    const [roomId, roomInfo] = compatibleRooms[0];
    const roomNumber = roomId.replace('Consultation room ', '');
    
    return {
      room: {
        id: `room${roomNumber}`,
        name: roomId,
        status: roomAvailability[roomId] ? 'available' : 'busy',
        reason: `Optimal for ${department} department`
      },
      confidence: roomAvailability[roomId] ? 'high' : 'medium',
      reason: `Based on department specialization and ${roomAvailability[roomId] ? 'availability' : 'queue length'}`
    };
  }
  
  // 3. If no specific recommendations, find the most available room
  const availableRooms = Object.entries(roomAvailability)
    .filter(([, isAvailable]) => isAvailable)
    .map(([roomId]) => roomId);
  
  if (availableRooms.length > 0) {
    // Sort by least waiting patients
    const leastBusyRoom = availableRooms.sort((a, b) => waitingCounts[a] - waitingCounts[b])[0];
    const roomNumber = leastBusyRoom.replace('Consultation room ', '');
    
    return {
      room: {
        id: `room${roomNumber}`,
        name: leastBusyRoom,
        status: 'available',
        reason: 'Room has shortest queue'
      },
      confidence: 'medium',
      reason: 'Based on current availability and queue length'
    };
  }
  
  // 4. If no rooms are available, recommend the one with shortest queue
  const shortestQueueRoom = Object.entries(waitingCounts)
    .sort(([, countA], [, countB]) => countA - countB)[0][0];
  const roomNumber = shortestQueueRoom.replace('Consultation room ', '');
  
  return {
    room: {
      id: `room${roomNumber}`,
      name: shortestQueueRoom,
      status: 'busy',
      reason: 'All rooms are busy, shortest wait time'
    },
    confidence: 'low',
    reason: 'Based on current queue lengths as all rooms are busy'
  };
}

// Recommend a room for an existing patient (for triage)
export async function recommendRoomForExistingPatient(patient: Patient): Promise<{
  primary: { name: string; reason: string; };
  alternatives: { name: string; reason: string; }[];
}> {
  const roomAvailability = await getRoomAvailability();
  const waitingCounts = await getWaitingCountsByRoom();
  
  // Start with patient's original room assignment if it exists
  let primaryRecommendation = {
    name: patient.assignedRoom || 'Consultation room 1',
    reason: patient.assignedRoom 
      ? 'Originally assigned room' 
      : 'Default assignment based on availability'
  };
  
  const alternatives: { name: string; reason: string; }[] = [];
  
  // Check if there's a better room based on department and availability
  const compatibleRooms = Object.entries(roomDepartmentMapping)
    .filter(([, roomInfo]) => roomInfo.compatibleWith.includes(patient.department))
    .sort((a, b) => {
      // Sort by availability first
      if (roomAvailability[a[0]] && !roomAvailability[b[0]]) return -1;
      if (!roomAvailability[a[0]] && roomAvailability[b[0]]) return 1;
      
      // Then by waiting count
      return waitingCounts[a[0]] - waitingCounts[b[0]];
    });
  
  // If we have compatible rooms, suggest the best one
  if (compatibleRooms.length > 0) {
    const [bestRoomId, bestRoomInfo] = compatibleRooms[0];
    
    // If this is different than the original room and better, replace primary recommendation
    if (bestRoomId !== primaryRecommendation.name && 
        (roomAvailability[bestRoomId] || waitingCounts[bestRoomId] < waitingCounts[primaryRecommendation.name])) {
      
      // Add current primary to alternatives
      alternatives.push(primaryRecommendation);
      
      // Set new primary recommendation
      primaryRecommendation = {
        name: bestRoomId,
        reason: `Better match for ${patient.department} with ${
          roomAvailability[bestRoomId] ? 'immediate availability' : 'shorter queue'
        }`
      };
    } 
    // Otherwise add it as an alternative
    else if (bestRoomId !== primaryRecommendation.name) {
      alternatives.push({
        name: bestRoomId,
        reason: `Good match for ${patient.department} department`
      });
    }
  }
  
  // Add other available rooms with short queues as alternatives
  Object.entries(roomAvailability)
    .filter(([roomId, isAvailable]) => isAvailable && roomId !== primaryRecommendation.name)
    .forEach(([roomId]) => {
      if (!alternatives.some(alt => alt.name === roomId)) {
        alternatives.push({
          name: roomId,
          reason: 'Currently available with no wait'
        });
      }
    });
  
  // If we don't have enough alternatives, add rooms with shortest queues
  if (alternatives.length < 2) {
    Object.entries(waitingCounts)
      .sort(([, countA], [, countB]) => countA - countB)
      .filter(([roomId]) => 
        roomId !== primaryRecommendation.name && 
        !alternatives.some(alt => alt.name === roomId)
      )
      .slice(0, 2 - alternatives.length)
      .forEach(([roomId, count]) => {
        alternatives.push({
          name: roomId,
          reason: `Short queue (${count} patients waiting)`
        });
      });
  }
  
  return {
    primary: primaryRecommendation,
    alternatives: alternatives.slice(0, 2) // Limit to top 2 alternatives
  };
}
