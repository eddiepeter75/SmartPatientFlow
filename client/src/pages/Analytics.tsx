import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Patient } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface RoomMetrics {
  id: string;
  room: string;
  patientsServed: number;
  averageWaitTime: number;
  currentStatus: 'available' | 'busy' | 'unavailable';
  utilizationRate: number;
}

export default function Analytics() {
  const [roomMetrics, setRoomMetrics] = useState<RoomMetrics[]>([]);
  const [departmentDistribution, setDepartmentDistribution] = useState<any[]>([]);
  const [priorityDistribution, setPriorityDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokensRef = ref(db, 'patients/tokens');
    
    const unsubscribe = onValue(tokensRef, (snapshot) => {
      const tokens = snapshot.val();
      
      if (!tokens) {
        setLoading(false);
        return;
      }
      
      // Process room metrics
      const roomStats: Record<string, {
        patientsServed: number,
        totalWaitTime: number,
        inUse: boolean,
        isAvailable: boolean
      }> = {
        'Consultation room 1': { patientsServed: 0, totalWaitTime: 0, inUse: false, isAvailable: true },
        'Consultation room 2': { patientsServed: 0, totalWaitTime: 0, inUse: false, isAvailable: true },
        'Consultation room 3': { patientsServed: 0, totalWaitTime: 0, inUse: false, isAvailable: true },
        'Consultation room 4': { patientsServed: 0, totalWaitTime: 0, inUse: false, isAvailable: true }
      };
      
      // Track departments and priorities
      const departments: Record<string, number> = {};
      const priorities: Record<string, number> = {
        urgent: 0,
        normal: 0
      };
      
      // Process all tokens
      Object.values(tokens as Record<string, Patient>).forEach((patient: Patient) => {
        // Process department stats
        if (patient.department) {
          departments[patient.department] = (departments[patient.department] || 0) + 1;
        }
        
        // Process priority stats
        if (patient.priority) {
          priorities[patient.priority] = (priorities[patient.priority] || 0) + 1;
        }
        
        // Process room stats
        if (patient.assignedRoom && patient.status) {
          // Count patients served by this room
          roomStats[patient.assignedRoom].patientsServed++;
          
          // Calculate wait time if patient has been seen
          if (patient.status === 'in-service' || patient.status === 'completed') {
            const waitTime = patient.status === 'in-service' 
              ? (Date.now() - patient.timestamp) / 60000 // Convert to minutes
              : 15; // Estimate for completed patients
            
            roomStats[patient.assignedRoom].totalWaitTime += waitTime;
          }
          
          // Check if room is currently in use
          if (patient.status === 'in-service') {
            roomStats[patient.assignedRoom].inUse = true;
          }
        }
      });
      
      // Transform room stats to metrics
      const metricsData = Object.entries(roomStats).map(([room, stats]) => {
        const avgWaitTime = stats.patientsServed > 0 
          ? stats.totalWaitTime / stats.patientsServed 
          : 0;
        
        let status: 'available' | 'busy' | 'unavailable' = 'available';
        if (stats.inUse) {
          status = 'busy';
        } else if (!stats.isAvailable) {
          status = 'unavailable';
        }
        
        // Calculate utilization rate (mocked for demo purposes)
        const utilizationRate = Math.min(
          Math.max(0.3, stats.patientsServed / 10 + (stats.inUse ? 0.3 : 0)), 
          1
        ) * 100;
        
        return {
          id: room.replace('Consultation room ', ''),
          room,
          patientsServed: stats.patientsServed,
          averageWaitTime: parseFloat(avgWaitTime.toFixed(1)),
          currentStatus: status,
          utilizationRate: parseInt(utilizationRate.toFixed(0))
        };
      });
      
      // Transform department stats
      const departmentData = Object.entries(departments).map(([name, count]) => ({
        name,
        value: count
      }));
      
      // Transform priority stats
      const priorityData = Object.entries(priorities).map(([name, count]) => ({
        name: name === 'urgent' ? 'Urgent' : 'Normal',
        value: count
      }));
      
      setRoomMetrics(metricsData);
      setDepartmentDistribution(departmentData);
      setPriorityDistribution(priorityData);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-800">Analytics Dashboard</h2>
        <p className="text-secondary-500">Room utilization and patient flow statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {roomMetrics.map((room) => (
          <Card key={room.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Room {room.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Status:</span>
                  <span className={`font-medium ${
                    room.currentStatus === 'available' ? 'text-success' :
                    room.currentStatus === 'busy' ? 'text-warning' :
                    'text-danger'
                  }`}>
                    {room.currentStatus.charAt(0).toUpperCase() + room.currentStatus.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Patients:</span>
                  <span className="font-medium">{room.patientsServed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Avg. Wait:</span>
                  <span className="font-medium">{room.averageWaitTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Utilization:</span>
                  <span className="font-medium">{room.utilizationRate}%</span>
                </div>
                <div className="w-full bg-secondary-100 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      room.utilizationRate < 50 ? 'bg-success' :
                      room.utilizationRate < 80 ? 'bg-warning' :
                      'bg-danger'
                    }`}
                    style={{ width: `${room.utilizationRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Room Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roomMetrics}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patientsServed" name="Patients Served" fill="#0ea5e9" />
                  <Bar dataKey="averageWaitTime" name="Avg. Wait Time (min)" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
