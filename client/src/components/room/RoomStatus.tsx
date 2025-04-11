import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { RoomInfo } from "@/types";

export default function RoomStatus() {
  const [rooms, setRooms] = useState<RoomInfo[]>([
    { id: 'room1', name: 'Room 1', department: 'General', status: 'available', currentPatient: null },
    { id: 'room2', name: 'Room 2', department: 'Consultation', status: 'available', currentPatient: null },
    { id: 'room3', name: 'Room 3', department: 'Emergency', status: 'available', currentPatient: null },
    { id: 'room4', name: 'Room 4', department: 'Pediatrics', status: 'available', currentPatient: null }
  ]);

  useEffect(() => {
    const tokensRef = ref(db, 'patients/tokens');
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      
      // Create a copy of room state to update
      const updatedRooms = [...rooms];
      
      // Reset all rooms to available first
      updatedRooms.forEach(room => {
        room.status = 'available';
        room.currentPatient = null;
      });
      
      if (tokens) {
        // Check for patients currently in service
        Object.entries(tokens).forEach(([id, token]: [string, any]) => {
          if (token.status === 'in-service') {
            // Find the room this patient is in
            const roomNumber = token.doctorRoom ? token.doctorRoom.replace('dr', '') : null;
            
            if (roomNumber) {
              const roomIndex = updatedRooms.findIndex(r => r.id === `room${roomNumber}`);
              if (roomIndex >= 0) {
                updatedRooms[roomIndex].status = 'busy';
                updatedRooms[roomIndex].currentPatient = {
                  id,
                  name: token.name
                };
              }
            }
          }
        });
      }
      
      setRooms(updatedRooms);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <i className="fas fa-door-open text-primary-500 mr-2"></i>
          Room Availability
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map(room => (
            <div 
              key={room.id}
              className={`room-status-indicator relative border rounded-lg p-4 ${
                room.status === 'busy' ? 'border-warning' :
                room.status === 'unavailable' ? 'border-danger' :
                'border-success'
              }`}
            >
              <div className={`absolute top-3 right-3 h-3 w-3 rounded-full ${
                room.status === 'available' ? 'bg-success' :
                room.status === 'busy' ? 'bg-warning' :
                'bg-danger'
              }`}></div>
              
              <h4 className="font-semibold mb-1">{room.name}</h4>
              <p className="text-sm text-secondary-500">{room.department}</p>
              
              <div className="mt-2 flex flex-col space-y-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  room.status === 'available' ? 'bg-success/10 text-success' :
                  room.status === 'busy' ? 'bg-warning/10 text-warning' :
                  'bg-danger/10 text-danger'
                }`}>
                  {room.status === 'available' ? 'Available' :
                   room.status === 'busy' ? 'In Use' :
                   'Unavailable'}
                </span>
                
                {room.currentPatient && (
                  <span className="text-xs text-secondary-500">
                    Patient: {room.currentPatient.id} - {room.currentPatient.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-secondary-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-success mr-1"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-warning mr-1"></div>
              <span>In Use</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-danger mr-1"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
