import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Patient } from "@/types";
import QueueDisplay from "@/components/display/QueueDisplay";

export default function Display() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [roomQueues, setRoomQueues] = useState<Record<string, Patient[]>>({
    'Consultation room 1': [],
    'Consultation room 2': [],
    'Consultation room 3': [],
    'Consultation room 4': []
  });
  const [generalQueue, setGeneralQueue] = useState<Patient[]>([]);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [highlightAnnouncement, setHighlightAnnouncement] = useState(false);
  const [patientCallQueue, setPatientCallQueue] = useState<Patient[]>([]);
  const nameAlertSoundRef = useRef<HTMLAudioElement>(null);
  
  // Update clock every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Listen for patient updates
  useEffect(() => {
    const tokensRef = ref(db, 'patients/tokens');
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString());
      
      if (!tokens) return;
      
      const roomQueuesData: Record<string, Patient[]> = {
        'Consultation room 1': [],
        'Consultation room 2': [],
        'Consultation room 3': [],
        'Consultation room 4': []
      };
      
      const generalQueueData: Patient[] = [];
      let foundCurrentPatient = false;
      
      // Process all tokens
      Object.entries(tokens).forEach(([id, token]: [string, any]) => {
        const patientWithId = { ...token, id, token: id };
        
        // Find patients being served
        if (token.status === 'in-service' && !foundCurrentPatient) {
          setCurrentPatient(patientWithId);
          foundCurrentPatient = true;
          
          // Add to call queue if it's a newly called patient
          if (token.called && !token.announcementPlayed) {
            setPatientCallQueue(prev => [...prev, patientWithId]);
          }
        }
        
        // Group waiting patients by room
        if (token.status === 'waiting-consultation' && token.assignedRoom) {
          if (roomQueuesData[token.assignedRoom]) {
            roomQueuesData[token.assignedRoom].push(patientWithId);
          }
        }
        
        // Add to general queue if waiting or in-triage
        if (token.status === 'waiting' || token.status === 'in-triage') {
          generalQueueData.push(patientWithId);
        }
      });
      
      setRoomQueues(roomQueuesData);
      setGeneralQueue(generalQueueData);
      
      // Reset current patient if none is in service
      if (!foundCurrentPatient) {
        setCurrentPatient(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Process patient call queue
  useEffect(() => {
    if (!soundEnabled || patientCallQueue.length === 0) return;
    
    const patient = patientCallQueue[0];
    const remainingQueue = patientCallQueue.slice(1);
    
    // Update announcement text
    const roomDirection = patient.assignedRoom 
      ? ` to ${patient.assignedRoom}`
      : " to the consultation area";
    
    setAnnouncement(`${patient.name}, token number ${patient.number}, please proceed${roomDirection}`);
    setHighlightAnnouncement(true);
    
    // Play sound notification
    if (nameAlertSoundRef.current) {
      nameAlertSoundRef.current.play()
        .then(() => {
          // Text-to-speech announcement
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
              `Patient ${patient.name}, token number ${patient.number}, please proceed${roomDirection}`
            );
            utterance.rate = 0.9; // Slightly slower for clarity
            speechSynthesis.speak(utterance);
          }
        })
        .catch(error => {
          console.log("Audio play failed:", error);
        });
    }
    
    // Clear highlight after 5 seconds
    setTimeout(() => {
      setHighlightAnnouncement(false);
    }, 5000);
    
    // Mark as announced in the queue
    setPatientCallQueue(remainingQueue);
    
    // Update the database to mark announcement as played
    // (This would be implemented if we had write access to the database)
  }, [patientCallQueue, soundEnabled]);

  const enableSound = () => {
    setSoundEnabled(true);
    
    // Play a test sound to confirm permission is granted
    if (nameAlertSoundRef.current) {
      nameAlertSoundRef.current.volume = 0.5;
      nameAlertSoundRef.current.play().catch(error => {
        console.log("Audio play failed:", error);
      });
    }
  };

  return (
    <div className="min-h-screen display-body bg-secondary-50">
      <div className="container mx-auto px-4 py-6">
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <header className="bg-primary-700 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <i className="fas fa-hospital text-2xl mr-3"></i>
                  <h1 className="text-2xl font-bold">Hospital Queue Status</h1>
                </div>
                <div className="text-right">
                  <div className="text-xl font-medium">{currentTime.toLocaleTimeString()}</div>
                  <div className="text-sm">{currentDate}</div>
                </div>
              </div>
            </header>
            
            <div className="p-6">
              <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded-md mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-user-md text-primary-600 text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-bold text-primary-800">Now Serving</h2>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-2xl font-bold text-secondary-900">
                        {currentPatient ? currentPatient.name : "---"}
                      </div>
                      <div className="flex gap-4">
                        <div className="text-primary-600 font-medium">
                          {currentPatient ? currentPatient.assignedRoom : ""}
                        </div>
                        <div className="bg-primary-100 px-3 py-1 rounded-full text-primary-800">
                          {currentPatient ? currentPatient.id : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <QueueDisplay 
                  title="General Queue" 
                  patients={generalQueue}
                  icon="clipboard-list"
                  stats={{
                    waiting: generalQueue.length,
                    urgent: generalQueue.filter(p => p.priority === 'urgent').length
                  }}
                />
                
                <QueueDisplay 
                  title="Consultation Room 1" 
                  patients={roomQueues['Consultation room 1']}
                  icon="door-open"
                  stats={{
                    waiting: roomQueues['Consultation room 1'].length,
                    current: roomQueues['Consultation room 1'].length > 0 ? 
                      roomQueues['Consultation room 1'][0].id : "---"
                  }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <QueueDisplay 
                  title="Consultation Room 2" 
                  patients={roomQueues['Consultation room 2']}
                  icon="door-open"
                  stats={{
                    waiting: roomQueues['Consultation room 2'].length,
                    current: roomQueues['Consultation room 2'].length > 0 ? 
                      roomQueues['Consultation room 2'][0].id : "---"
                  }}
                />
                
                <QueueDisplay 
                  title="Consultation Room 3" 
                  patients={roomQueues['Consultation room 3']}
                  icon="door-open"
                  stats={{
                    waiting: roomQueues['Consultation room 3'].length,
                    current: roomQueues['Consultation room 3'].length > 0 ? 
                      roomQueues['Consultation room 3'][0].id : "---"
                  }}
                />
                
                <QueueDisplay 
                  title="Consultation Room 4" 
                  patients={roomQueues['Consultation room 4']}
                  icon="door-open"
                  stats={{
                    waiting: roomQueues['Consultation room 4'].length,
                    current: roomQueues['Consultation room 4'].length > 0 ? 
                      roomQueues['Consultation room 4'][0].id : "---"
                  }}
                />
              </div>
              
              <div className={`p-4 rounded-md mb-6 transition-all ${
                highlightAnnouncement 
                  ? 'bg-primary-100 border border-primary-300' 
                  : 'bg-secondary-100 border border-secondary-200'
              }`}>
                <div className="flex items-center">
                  <i className="fas fa-bullhorn text-primary-600 mr-3"></i>
                  <span className="text-lg font-medium">
                    {announcement || "Welcome to Hospital Queue Management System. Please wait for your name to be called."}
                  </span>
                </div>
              </div>
            </div>
            
            <footer className="bg-white border-t border-secondary-200 p-4 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="text-sm text-secondary-500">
                  Last updated: {lastUpdated}
                </div>
                <div className="flex items-center text-sm text-secondary-600">
                  <i className="fas fa-info-circle mr-2"></i>
                  <span>Please proceed to your assigned consultation room when your name is called</span>
                </div>
              </div>
            </footer>
          </CardContent>
        </Card>
        
        <div className="fixed bottom-5 right-5">
          {!soundEnabled && (
            <Button 
              onClick={enableSound}
              className="shadow-lg"
            >
              <i className="fas fa-volume-up mr-2"></i> Enable Sound Notifications
            </Button>
          )}
        </div>
      </div>
      
      <audio 
        ref={nameAlertSoundRef} 
        src="https://soundbible.com/grab.php?id=2206&type=mp3" 
        preload="auto"
      />
    </div>
  );
}
