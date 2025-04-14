import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PatientQueue from "@/components/patient/PatientQueue";
import { db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { Patient } from "@/types";
import { useToast } from "@/hooks/use-toast";
import RoomAssignment from "@/components/room/RoomAssignment";

export default function Triage() {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [assignedRoom, setAssignedRoom] = useState("Consultation room 1");
  const [waitingCount, setWaitingCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const tokensRef = ref(db, 'patients/tokens');
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      let waiting = 0;
      let urgent = 0;
      
      if (tokens) {
        Object.values(tokens as Record<string, Patient>).forEach((token: Patient) => {
          if (token.status === 'waiting') {
            waiting++;
            if (token.priority === 'urgent') {
              urgent++;
            }
          }
        });
      }
      
      setWaitingCount(waiting);
      setUrgentCount(urgent);
    });
    
    return () => unsubscribe();
  }, []);

  const callNextPatient = async () => {
    const tokensRef = ref(db, 'patients/tokens');
    
    onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      if (!tokens) {
        toast({
          title: "No patients waiting",
          description: "There are no patients in the waiting queue",
          variant: "destructive"
        });
        return;
      }
      
      // First check for urgent patients
      let foundPatient = false;
      let patientId = '';
      let patient: Patient | null = null;
      
      // First pass: Look for urgent cases
      Object.entries(tokens).forEach(([id, token]: [string, any]) => {
        if (token.status === 'waiting' && token.priority === 'urgent' && !foundPatient) {
          patientId = id;
          patient = token as Patient;
          foundPatient = true;
        }
      });
      
      // Second pass: If no urgent cases, take the oldest token
      if (!foundPatient) {
        const sortedTokens = Object.entries(tokens)
          .filter(([, token]: [string, any]) => token.status === 'waiting')
          .sort((a, b) => (a[1] as any).timestamp - (b[1] as any).timestamp);
        
        if (sortedTokens.length > 0) {
          patientId = sortedTokens[0][0];
          patient = sortedTokens[0][1] as Patient;
          foundPatient = true;
        }
      }
      
      if (foundPatient && patientId && patient) {
        // Update the patient status
        update(ref(db, `patients/tokens/${patientId}`), {
          status: 'in-triage',
          called: true
        }).then(() => {
          setCurrentPatient({ ...patient, id: patientId } as Patient);
          
          // Use room assignment from patient if it exists
          if (patient?.assignedRoom) {
            setAssignedRoom(patient.assignedRoom);
          }
          
          // Announce the token and patient name
          if ('speechSynthesis' in window && patient) {
            const utterance = new SpeechSynthesisUtterance(
              `Patient ${patient.name}, token number ${patient.number}, please proceed to triage`
            );
            utterance.rate = 0.9; // Slightly slower for clarity
            window.speechSynthesis.speak(utterance);
          }
          
          toast({
            title: "Patient called",
            description: `Patient ${patient?.name} has been called to triage`
          });
        });
      } else {
        toast({
          title: "No patients waiting",
          description: "There are no patients in the waiting queue",
          variant: "destructive"
        });
      }
    }, { onlyOnce: true });
  };

  const completeTriageForPatient = async () => {
    if (!currentPatient) {
      toast({
        title: "No patient selected",
        description: "There is no patient currently in triage",
        variant: "destructive"
      });
      return;
    }

    // Update the patient's status and room assignment
    update(ref(db, `patients/tokens/${currentPatient.id}`), {
      status: 'waiting-consultation',
      assignedRoom: assignedRoom
    }).then(() => {
      toast({
        title: "Triage completed",
        description: `Patient ${currentPatient.name} has been assigned to ${assignedRoom}`
      });
      
      setCurrentPatient(null);
    }).catch(error => {
      console.error("Error completing triage:", error);
      toast({
        title: "Error",
        description: "Failed to complete triage",
        variant: "destructive"
      });
    });
  };

  const handleRoomReassignment = async () => {
    if (!currentPatient) {
      toast({
        title: "No patient selected",
        description: "There is no patient currently in triage",
        variant: "destructive"
      });
      return;
    }

    update(ref(db, `patients/tokens/${currentPatient.id}`), {
      assignedRoom: assignedRoom
    }).then(() => {
      toast({
        title: "Room reassigned",
        description: `Patient ${currentPatient.name} has been reassigned to ${assignedRoom}`
      });
    }).catch(error => {
      console.error("Error reassigning room:", error);
      toast({
        title: "Error",
        description: "Failed to reassign room",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-800">Triage Nurse Dashboard</h2>
        <p className="text-secondary-500">Assess patients and assign consultation rooms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Next Patient</h2>
              
              {currentPatient ? (
                <div className="p-4 border rounded-lg mb-4">
                  <h3 className="font-bold text-lg">{currentPatient.id}</h3>
                  <p>Name: {currentPatient.name}</p>
                  <p>Department: {currentPatient.department}</p>
                  <p>Priority: {currentPatient.priority === 'urgent' ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-emergency/10 text-emergency">
                      Urgent
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-secondary-100 text-secondary-800">
                      Normal
                    </span>
                  )}</p>
                  <p>Assigned Room: {currentPatient.assignedRoom || "Not assigned"}</p>
                </div>
              ) : (
                <div className="p-4 border rounded-lg mb-4 text-center text-secondary-500">
                  <p>No patient in triage</p>
                </div>
              )}
              
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Room Assignment</h3>
                  <Select value={assignedRoom} onValueChange={setAssignedRoom}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation room 1">Room 1</SelectItem>
                      <SelectItem value="Consultation room 2">Room 2</SelectItem>
                      <SelectItem value="Consultation room 3">Room 3</SelectItem>
                      <SelectItem value="Consultation room 4">Room 4</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleRoomReassignment}
                    variant="outline"
                    className="w-full"
                    disabled={!currentPatient}
                  >
                    <i className="fas fa-exchange-alt mr-2"></i> Reassign Room
                  </Button>

                  {currentPatient && (
                    <RoomAssignment 
                      patient={currentPatient} 
                      setAssignedRoom={setAssignedRoom}
                    />
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button onClick={callNextPatient} className="bg-primary-600 hover:bg-primary-700">
                    <i className="fas fa-bell mr-2"></i> Call Next Patient
                  </Button>
                  <Button 
                    onClick={completeTriageForPatient}
                    variant="secondary"
                    disabled={!currentPatient}
                  >
                    <i className="fas fa-check-circle mr-2"></i> Complete Triage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <i className="fas fa-list-ol text-primary-500 mr-2"></i>
                  Triage Queue
                </h3>
                
                <div className="flex gap-2">
                  <div className="flex space-x-2 text-sm rounded-lg bg-secondary-100 px-3 py-2">
                    <span className="font-medium">Waiting:</span>
                    <span>{waitingCount}</span>
                  </div>
                  <div className="flex space-x-2 text-sm rounded-lg bg-emergency/10 px-3 py-2">
                    <span className="font-medium">Urgent:</span>
                    <span>{urgentCount}</span>
                  </div>
                </div>
              </div>
              
              <PatientQueue 
                status="waiting" 
                filterDepartment={null}
                showActionsColumn={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
