import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PatientQueue from "@/components/patient/PatientQueue";
import { db } from "@/lib/firebase";
import { ref, onValue, update, get } from "firebase/database";
import { Patient } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function Doctor() {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [doctorRoom, setDoctorRoom] = useState("dr1");
  const [roomDisplay, setRoomDisplay] = useState("Room 1");
  const { toast } = useToast();

  const updateDoctorRoom = (value: string) => {
    setDoctorRoom(value);
    setRoomDisplay(`Room ${value.replace('dr', '')}`);
  };

  useEffect(() => {
    // Check if there's a current patient already in service
    const tokensRef = ref(db, 'patients/tokens');
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      if (!tokens) return;
      
      // Find a patient being served in this room
      Object.entries(tokens).forEach(([id, token]: [string, any]) => {
        if (token.status === 'in-service' && 
            token.doctorRoom === doctorRoom) {
          setCurrentPatient({ ...token, id });
        }
      });
    });
    
    return () => unsubscribe();
  }, [doctorRoom]);

  const callNextPatient = async () => {
    const tokensRef = ref(db, 'patients/tokens');
    
    const snapshot = await get(tokensRef);
    const tokens = snapshot.val();
    
    if (!tokens) {
      toast({
        title: "No patients waiting",
        description: "There are no patients in the consultation queue",
        variant: "destructive"
      });
      return;
    }
    
    // First prioritize patients assigned to this specific room
    const roomToFind = `Consultation room ${doctorRoom.replace('dr', '')}`;
    let foundPatient = false;
    let patientId = '';
    let patient: Patient | null = null;
    
    // First pass: Check for patients assigned to this specific room with urgent priority
    Object.entries(tokens).forEach(([id, token]: [string, any]) => {
      if (token.status === 'waiting-consultation' && 
          token.assignedRoom === roomToFind && 
          token.priority === 'urgent' &&
          !foundPatient) {
        patientId = id;
        patient = token;
        foundPatient = true;
      }
    });
    
    // Second pass: Check for patients assigned to this specific room (any priority)
    if (!foundPatient) {
      Object.entries(tokens).forEach(([id, token]: [string, any]) => {
        if (token.status === 'waiting-consultation' && 
            token.assignedRoom === roomToFind &&
            !foundPatient) {
          patientId = id;
          patient = token;
          foundPatient = true;
        }
      });
    }
    
    // Third pass: If still no patient, take any waiting consultation patient with urgent priority
    if (!foundPatient) {
      Object.entries(tokens).forEach(([id, token]: [string, any]) => {
        if (token.status === 'waiting-consultation' && 
            token.priority === 'urgent' &&
            !foundPatient) {
          patientId = id;
          patient = token;
          foundPatient = true;
        }
      });
    }
    
    // Final pass: If still no patient, take any waiting consultation patient
    if (!foundPatient) {
      const sortedTokens = Object.entries(tokens)
        .filter(([, token]: [string, any]) => token.status === 'waiting-consultation')
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      if (sortedTokens.length > 0) {
        patientId = sortedTokens[0][0];
        patient = sortedTokens[0][1];
        foundPatient = true;
      }
    }
    
    if (foundPatient && patientId && patient) {
      // Update the patient status
      update(ref(db, `patients/tokens/${patientId}`), {
        status: 'in-service',
        called: true,
        doctorRoom: doctorRoom,
        currentRoom: roomDisplay
      }).then(() => {
        setCurrentPatient({ ...patient, id: patientId });
        
        // Announce the token
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            `Token ${patientId}, please proceed to ${roomDisplay}`
          );
          window.speechSynthesis.speak(utterance);
        }
        
        toast({
          title: "Patient called",
          description: `Patient ${patient.name} has been called to ${roomDisplay}`
        });
      });
    } else {
      toast({
        title: "No patients waiting",
        description: "There are no patients in the consultation queue",
        variant: "destructive"
      });
    }
  };

  const completeConsultation = async () => {
    if (!currentPatient) {
      toast({
        title: "No patient selected",
        description: "There is no patient currently in consultation",
        variant: "destructive"
      });
      return;
    }

    // Update the patient's status
    update(ref(db, `patients/tokens/${currentPatient.id}`), {
      status: 'completed'
    }).then(() => {
      toast({
        title: "Consultation completed",
        description: `Patient ${currentPatient.name} consultation has been completed`
      });
      
      setCurrentPatient(null);
    }).catch(error => {
      console.error("Error completing consultation:", error);
      toast({
        title: "Error",
        description: "Failed to complete consultation",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-800">Doctor Dashboard</h2>
        <p className="text-secondary-500">Manage patient consultations and treatment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Current Consultation</h2>
              
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
                </div>
              ) : (
                <div className="p-4 border rounded-lg mb-4 text-center text-secondary-500">
                  <p>No patient in consultation</p>
                </div>
              )}
              
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Consultation Room</h3>
                  <Select value={doctorRoom} onValueChange={updateDoctorRoom}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dr1">Room 1</SelectItem>
                      <SelectItem value="dr2">Room 2</SelectItem>
                      <SelectItem value="dr3">Room 3</SelectItem>
                      <SelectItem value="dr4">Room 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button onClick={callNextPatient} className="bg-primary-600 hover:bg-primary-700">
                    <i className="fas fa-bell mr-2"></i> Call Next Patient
                  </Button>
                  <Button 
                    onClick={completeConsultation}
                    variant="secondary"
                    disabled={!currentPatient}
                  >
                    <i className="fas fa-check-circle mr-2"></i> Complete Consultation
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
                  Consultation Queue
                </h3>
                
                <div className="flex space-x-2 text-sm rounded-lg bg-secondary-100 px-3 py-2">
                  <span className="font-medium">Current Room:</span>
                  <span>{roomDisplay}</span>
                </div>
              </div>
              
              <PatientQueue 
                status="waiting-consultation" 
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
