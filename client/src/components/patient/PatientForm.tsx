import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, ref, runTransaction, update, incrementCounter } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { recommendRoom } from "@/lib/roomAssignment";
import { Room } from "@/types";

interface PatientFormProps {
  onTokenIssued: (token: string) => void;
  lastToken: string | null;
}

export default function PatientForm({ onTokenIssued, lastToken }: PatientFormProps) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('General');
  const [patientType, setPatientType] = useState('new');
  const [isEmergency, setIsEmergency] = useState(false);
  const [recommendedRoom, setRecommendedRoom] = useState<Room | null>(null);
  const [roomConfidence, setRoomConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const { toast } = useToast();

  useEffect(() => {
    updateRecommendation();
  }, [department, patientType, isEmergency]);

  const updateRecommendation = async () => {
    // Get recommended room based on department, type, and emergency status
    const { room, confidence, reason } = await recommendRoom(department, patientType, isEmergency);
    setRecommendedRoom(room);
    setRoomConfidence(confidence);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !department) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use our helper function to increment the counter
      const tokenNumber = await incrementCounter('counter');
      
      if (tokenNumber) {
        const tokenId = `T${tokenNumber}`;
        
        // Get the recommended room assignment
        const assignedRoom = recommendedRoom?.name || null;
        
        // Create token data
        const tokenData = {
          number: tokenNumber,
          name: name,
          department: department,
          patientType: patientType,
          status: 'waiting',
          priority: isEmergency ? 'urgent' : 'normal',
          timestamp: Date.now(),
          called: false,
          assignedRoom: assignedRoom
        };
        
        // Save to database
        const tokensRef = ref(db, `patients/tokens/${tokenId}`);
        await update(tokensRef, tokenData);
        
        // Update the last token display
        onTokenIssued(tokenId);
        
        toast({
          title: "Patient registered",
          description: `Token ${tokenId} assigned to ${name}${assignedRoom ? ` in ${assignedRoom}` : ''}`
        });
        
        // Clear form
        setName('');
        setDepartment('General');
        setPatientType('new');
        setIsEmergency(false);
      } else {
        throw new Error("Failed to generate token number");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Registration failed:', errorMessage);
      toast({
        title: "Registration failed",
        description: "Error registering patient. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <i className="fas fa-user-plus text-primary-500 mr-2"></i>
          Patient Registration
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name</Label>
            <Input 
              id="patientName" 
              placeholder="Enter patient name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                <SelectItem value="Orthopedics">Orthopedics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="patientType">Patient Type</Label>
            <Select value={patientType} onValueChange={setPatientType}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Patient</SelectItem>
                <SelectItem value="returning">Returning Patient</SelectItem>
                <SelectItem value="followup">Follow-up Appointment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="emergency" 
              checked={isEmergency}
              onCheckedChange={setIsEmergency}
            />
            <div>
              <Label htmlFor="emergency">Emergency Case</Label>
              <p className="text-sm text-secondary-500">Mark this if urgent attention is required</p>
            </div>
          </div>
          
          {recommendedRoom && (
            <div className="p-3 bg-primary-50 border border-primary-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-700">Recommended Room</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  roomConfidence === 'high' ? 'bg-success/10 text-success' :
                  roomConfidence === 'medium' ? 'bg-warning/10 text-warning' :
                  'bg-info/10 text-info'
                }`}>
                  {roomConfidence === 'high' ? 'High Confidence' :
                   roomConfidence === 'medium' ? 'Medium Confidence' :
                   'Low Confidence'}
                </span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-door-open text-primary-500 mr-2"></i>
                <span className="font-medium">{recommendedRoom.name}</span>
                <div className="ml-auto text-xs">
                  <span className="text-secondary-500">{recommendedRoom.reason}</span>
                </div>
              </div>
            </div>
          )}
          
          <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700">
            Register Patient
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-secondary-100 rounded-md text-center">
          <span className="text-sm text-secondary-500">Last token issued:</span>
          <span className="ml-2 font-medium">{lastToken || 'None'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
