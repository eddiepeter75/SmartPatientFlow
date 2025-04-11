import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Patient } from "@/types";

export default function Announcement() {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const tokensRef = ref(db, 'patients/tokens');
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      if (!tokens) return;
      
      // Find any recently called patients
      Object.entries(tokens).forEach(([id, token]: [string, any]) => {
        if (token.called && Date.now() - token.timestamp < 60000 * 5) { // Within the last 5 minutes
          const patientData = token as Patient;
          const roomDirection = patientData.assignedRoom 
            ? ` to ${patientData.assignedRoom}`
            : " to the consultation area";
          
          setAnnouncement(`${id} - ${patientData.name}, please proceed${roomDirection}`);
          setIsVisible(true);
          
          // Text-to-speech announcement if enabled
          if (soundEnabled && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
              `Patient ${patientData.name}, please proceed${roomDirection}`
            );
            utterance.rate = 0.9; // Slightly slower for clarity
            speechSynthesis.speak(utterance);
          }
          
          // Hide the announcement after 5 seconds
          setTimeout(() => {
            setIsVisible(false);
          }, 5000);
        }
      });
    });
    
    return () => unsubscribe();
  }, [soundEnabled]);

  return (
    <div className="fixed bottom-5 right-5 max-w-md z-50">
      <div className={`bg-primary-50 border-l-4 border-primary-500 p-4 rounded-md shadow-lg transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-bell text-primary-500"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-800">Patient Call</h3>
            <div className="mt-1 text-sm text-primary-700">
              {announcement}
            </div>
            <div className="mt-2 flex">
              <button
                type="button"
                className={`text-xs px-2 py-1 rounded ${
                  soundEnabled
                    ? 'bg-primary-200 text-primary-800'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? 'Sound Enabled' : 'Enable Sound'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
