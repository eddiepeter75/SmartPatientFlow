import { Patient } from "@/types";

interface QueueDisplayProps {
  title: string;
  patients: Patient[];
  icon: string;
  stats: {
    waiting?: number;
    urgent?: number;
    current?: string;
  };
}

export default function QueueDisplay({ title, patients, icon, stats }: QueueDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="flex items-center mb-3">
        <i className={`fas fa-${icon} text-primary-500 mr-2`}></i>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {stats.waiting !== undefined && (
          <div className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-sm">
            Waiting: <span className="font-semibold">{stats.waiting}</span>
          </div>
        )}
        
        {stats.urgent !== undefined && (
          <div className="bg-emergency/10 text-emergency px-2 py-1 rounded text-sm">
            Urgent: <span className="font-semibold">{stats.urgent}</span>
          </div>
        )}
        
        {stats.current !== undefined && (
          <div className="bg-inProgress/10 text-inProgress px-2 py-1 rounded text-sm">
            Now Serving: <span className="font-semibold">{stats.current}</span>
          </div>
        )}
      </div>
      
      <div className="overflow-y-auto max-h-32">
        {patients.length > 0 ? (
          <div className="space-y-2">
            {patients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between bg-secondary-50 px-3 py-2 rounded-md">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{patient.id}</span>
                  <span className="mx-2 text-secondary-400">•</span>
                  <span className="text-sm truncate max-w-[120px]">{patient.name}</span>
                </div>
                {patient.priority === 'urgent' && (
                  <span className="bg-emergency/10 text-emergency text-xs px-2 py-0.5 rounded-full">
                    Urgent
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 text-secondary-400 text-sm">
            No patients in queue
          </div>
        )}
      </div>
    </div>
  );
}
