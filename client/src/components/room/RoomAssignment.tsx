import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Patient } from "@/types";
import { recommendRoomForExistingPatient } from "@/lib/roomAssignment";

interface RoomAssignmentProps {
  patient: Patient;
  setAssignedRoom: (room: string) => void;
}

export default function RoomAssignment({ patient, setAssignedRoom }: RoomAssignmentProps) {
  const [recommendations, setRecommendations] = useState<{
    primary: { name: string; reason: string; };
    alternatives: { name: string; reason: string; }[];
  } | null>(null);

  useEffect(() => {
    if (patient) {
      const getRecommendations = async () => {
        const result = await recommendRoomForExistingPatient(patient);
        setRecommendations(result);
      };
      
      getRecommendations();
    }
  }, [patient]);

  if (!recommendations) {
    return <div className="text-sm text-secondary-500 mt-2">Loading recommendations...</div>;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold mb-2">Intelligent Room Recommendations</h4>
        
        <div className="space-y-3">
          <div className="p-2 border-l-4 border-primary-500 bg-primary-50 rounded-r-sm">
            <div className="text-sm font-medium flex justify-between items-center">
              <span>Recommended:</span>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 py-0 px-2 text-xs"
                onClick={() => setAssignedRoom(recommendations.primary.name)}
              >
                Select
              </Button>
            </div>
            <div className="flex mt-1">
              <div className="font-semibold text-primary-700">{recommendations.primary.name}</div>
              <div className="ml-2 text-xs text-secondary-500 mt-0.5">{recommendations.primary.reason}</div>
            </div>
          </div>
          
          {recommendations.alternatives.length > 0 && (
            <div>
              <div className="text-xs text-secondary-500 mb-1">Alternative options:</div>
              {recommendations.alternatives.map((alt, idx) => (
                <div key={idx} className="p-2 border-l-2 border-secondary-300 mb-1 bg-secondary-50 rounded-r-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{alt.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 py-0 px-2 text-xs"
                      onClick={() => setAssignedRoom(alt.name)}
                    >
                      Select
                    </Button>
                  </div>
                  <div className="text-xs text-secondary-500">{alt.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
