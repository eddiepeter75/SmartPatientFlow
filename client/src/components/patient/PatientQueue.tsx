import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Patient } from "@/types";
import { Button } from "@/components/ui/button";

interface PatientQueueProps {
  status?: string | null;
  filterDepartment?: string | null;
  showActionsColumn?: boolean;
}

export default function PatientQueue({ 
  status = null, 
  filterDepartment = null,
  showActionsColumn = true
}: PatientQueueProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    const tokensRef = ref(db, 'patients/tokens');
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      if (!tokens) return;

      const patientsList: Patient[] = [];
      
      Object.entries(tokens).forEach(([id, token]: [string, any]) => {
        const patientWithId = { ...token, id };
        
        // Apply status filter if provided
        if (status && token.status !== status) {
          return;
        }
        
        // Apply department filter if provided
        if (filterDepartment && token.department !== filterDepartment) {
          return;
        }
        
        patientsList.push(patientWithId);
      });
      
      // Sort by timestamp (oldest first) and then by priority (urgent first)
      patientsList.sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
        return a.timestamp - b.timestamp;
      });
      
      setPatients(patientsList);
    });
    
    return () => unsubscribe();
  }, [status, filterDepartment]);

  const filteredPatients = filter
    ? patients.filter(p => p.status === filter)
    : patients;

  return (
    <div>
      {status === null && (
        <div className="flex space-x-2 text-sm mb-4">
          <Button 
            variant={filter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={filter === 'waiting' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('waiting')}
          >
            Waiting
          </Button>
          <Button 
            variant={filter === 'in-triage' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('in-triage')}
          >
            In Triage
          </Button>
          <Button 
            variant={filter === 'waiting-consultation' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('waiting-consultation')}
          >
            Waiting Consultation
          </Button>
          <Button 
            variant={filter === 'in-service' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('in-service')}
          >
            In Progress
          </Button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Token
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Patient
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Department
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Room
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Priority
              </th>
              {showActionsColumn && (
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className={`hover:bg-secondary-50 ${patient.called ? 'announcement-animation' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-900">
                    {patient.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">
                    {patient.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">
                    {patient.department}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      patient.status === 'waiting' ? 'bg-waiting/10 text-waiting' :
                      patient.status === 'in-triage' ? 'bg-info/10 text-info' :
                      patient.status === 'waiting-consultation' ? 'bg-waiting/10 text-waiting' :
                      patient.status === 'in-service' ? 'bg-inProgress/10 text-inProgress' :
                      'bg-complete/10 text-complete'
                    }`}>
                      {patient.status === 'waiting' ? 'Waiting' :
                       patient.status === 'in-triage' ? 'In Triage' :
                       patient.status === 'waiting-consultation' ? 'Waiting Consultation' :
                       patient.status === 'in-service' ? 'In Progress' :
                       'Completed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-700">
                    {patient.assignedRoom || '---'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      patient.priority === 'urgent' ? 'bg-emergency/10 text-emergency' : 'bg-secondary-100 text-secondary-800'
                    }`}>
                      {patient.priority === 'urgent' ? 'Urgent' : 'Normal'}
                    </span>
                  </td>
                  {showActionsColumn && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-500">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <i className="fas fa-eye"></i>
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={showActionsColumn ? 7 : 6} className="px-4 py-6 text-center text-sm text-secondary-500">
                  No patients in queue
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
