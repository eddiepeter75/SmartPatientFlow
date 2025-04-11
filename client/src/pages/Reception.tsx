import { useState } from "react";
import PatientForm from "@/components/patient/PatientForm";
import PatientQueue from "@/components/patient/PatientQueue";
import RoomStatus from "@/components/room/RoomStatus";
import { Card, CardContent } from "@/components/ui/card";
import Announcement from "@/components/display/Announcement";

export default function Reception() {
  const [lastToken, setLastToken] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-800">Reception Dashboard</h2>
        <p className="text-secondary-500">Register new patients and manage the queue</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PatientForm onTokenIssued={setLastToken} lastToken={lastToken} />
        </div>
        
        <div className="lg:col-span-2">
          <RoomStatus />
          
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <i className="fas fa-list-ol text-primary-500 mr-2"></i>
                  Current Queue
                </h3>
              </div>
              
              <PatientQueue />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="fas fa-heartbeat text-primary-500 mr-2"></i>
            Automatic Assignment Logic
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm uppercase text-secondary-500 mb-2">Department Rules</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-0.5 mr-2"></i>
                  <span>General patients → Rooms 1 & 2</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-0.5 mr-2"></i>
                  <span>Consultation → Rooms 2 & 3</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-0.5 mr-2"></i>
                  <span>Emergency → Room 3</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-0.5 mr-2"></i>
                  <span>Pediatrics → Room 4</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-0.5 mr-2"></i>
                  <span>Orthopedics → Rooms 1 & 4</span>
                </li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm uppercase text-secondary-500 mb-2">Priority Rules</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-warning mt-0.5 mr-2"></i>
                  <span>Urgent cases prioritized for next available room</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-warning mt-0.5 mr-2"></i>
                  <span>Emergency department automatically marked urgent</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-warning mt-0.5 mr-2"></i>
                  <span>Urgent pediatric → Room 4 with priority</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-exclamation-triangle text-warning mt-0.5 mr-2"></i>
                  <span>Non-urgent cases assigned in order of arrival</span>
                </li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm uppercase text-secondary-500 mb-2">Room Availability Logic</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <i className="fas fa-sync-alt text-info mt-0.5 mr-2"></i>
                  <span>Load balancing between compatible rooms</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-sync-alt text-info mt-0.5 mr-2"></i>
                  <span>Tracks room occupied/free status in real-time</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-sync-alt text-info mt-0.5 mr-2"></i>
                  <span>Considers historical service times per department</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-sync-alt text-info mt-0.5 mr-2"></i>
                  <span>Room status updates when patients are called/completed</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Announcement />
    </div>
  );
}
