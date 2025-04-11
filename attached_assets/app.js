// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCt7JCmc3SL9w_TvHWAXTbs6uPH1RVkbKE",
    authDomain: "queue-management-system-86aec.firebaseapp.com",
    databaseURL: "https://queue-management-system-86aec-default-rtdb.firebaseio.com",
    projectId: "queue-management-system-86aec",
    storageBucket: "queue-management-system-86aec.firebasestorage.app",
    messagingSenderId: "690840302833",
    appId: "1:690840302833:web:78c1cec75396c7be62e550",
    measurementId: "G-B3BBKQWSTN"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Shared references
const counterRef = database.ref('counter');
const tokensRef = database.ref('patients/tokens');

// Initialize anonymous auth if available
if (firebase.auth) {
    firebase.auth().signInAnonymously()
        .then(() => console.log("Signed in anonymously"))
        .catch(error => {
            console.error("Auth error:", error);
            // Continue with the app anyway
        });
} else {
    console.warn("Firebase auth not available");
}

// RECEPTION PAGE FUNCTIONALITY
if (window.pageType === 'reception') {
    const patientForm = document.getElementById('patientForm');
    
    patientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('patientName').value;
        const department = document.getElementById('department').value;
        const isEmergency = document.getElementById('isEmergency').checked;
        
        // Generate token number
        counterRef.transaction((current) => {
            return (current || 0) + 1;
        }, (error, committed, snapshot) => {
            if (error) {
                console.error('Transaction failed', error);
                alert('Error generating token. Please try again.');
            } else if (committed) {
                const tokenNumber = snapshot.val();
                const tokenId = `T${tokenNumber}`;
                
                // Assign a room based on department
                let assignedRoom = null;
                if (department === 'General') {
                    assignedRoom = 'Consultation room 1';
                } else if (department === 'Consultation') {
                    assignedRoom = 'Consultation room 2';
                } else if (department === 'Emergency') {
                    assignedRoom = isEmergency ? 'Consultation room 3' : 'Consultation room 4';
                }
                
                // Create token data
                const tokenData = {
                    number: tokenNumber,
                    name: name,
                    department: department,
                    status: 'waiting',
                    priority: isEmergency ? 'urgent' : 'normal',
                    timestamp: Date.now(),
                    called: false,
                    assignedRoom: assignedRoom
                };
                
                // Save to database
                tokensRef.child(tokenId).set(tokenData)
                    .then(() => {
                        document.getElementById('lastToken').textContent = 
                            `Last token: ${tokenId}`;
                        patientForm.reset();
                    })
                    .catch(error => {
                        console.error('Error saving token:', error);
                        alert('Error saving token. Please try again.');
                    });
            }
        });
    });
    
    // Display real-time queue
    tokensRef.orderByChild('timestamp').on('value', (snapshot) => {
        const queueContainer = document.getElementById('queueContainer');
        const tokens = snapshot.val();
        
        queueContainer.innerHTML = '';
        
        if (tokens) {
            Object.entries(tokens).forEach(([tokenId, token]) => {
                const tokenElement = document.createElement('div');
                tokenElement.className = 'queue-item';
                if (token.called) tokenElement.classList.add('called');
                
                tokenElement.innerHTML = `
                    <strong>${tokenId}</strong>: ${token.name} 
                    (${token.department}) 
                    ${token.priority === 'urgent' ? '<span class="urgent">URGENT</span>' : ''}
                    ${token.assignedRoom ? `<span class="room">${token.assignedRoom}</span>` : ''}
                `;
                
                queueContainer.appendChild(tokenElement);
            });
        } else {
            queueContainer.innerHTML = '<p>No patients in queue</p>';
        }
    });
}

// MEDICAL STAFF PAGE FUNCTIONALITY
else if (window.pageType === 'medical-staff') {
    const callNextBtn = document.getElementById('callNextBtn');
    const completeServiceBtn = document.getElementById('completeServiceBtn');
    const currentPatientCard = document.getElementById('currentPatientCard');
    
    let currentPatientId = null;
    
    // Call next patient
    callNextBtn.addEventListener('click', () => {
        // Find next waiting patient in this department
        tokensRef.orderByChild('status').equalTo('waiting').once('value')
            .then((snapshot) => {
                const tokens = snapshot.val();
                if (tokens) {
                    // Find first patient in this department
                    for (const [tokenId, token] of Object.entries(tokens)) {
                        if (token.department === window.staffDepartment) {
                            currentPatientId = tokenId;
                            tokensRef.child(tokenId).update({
                                status: 'in-service',
                                called: true
                            });
                            
                            currentPatientCard.innerHTML = `
                                <h3>${tokenId}</h3>
                                <p>${token.name}</p>
                                <p>${token.priority === 'urgent' ? 'URGENT' : ''}</p>
                            `;
                            
                            // Announce the token
                            if ('speechSynthesis' in window) {
                                const utterance = new SpeechSynthesisUtterance(
                                    `Token ${tokenId}, please proceed to ${window.staffDepartment}`
                                );
                                window.speechSynthesis.speak(utterance);
                            }
                            
                            break;
                        }
                    }
                } else {
                    alert('No patients waiting');
                }
            });
    });
    
    // Complete current service
    completeServiceBtn.addEventListener('click', () => {
        if (currentPatientId) {
            tokensRef.child(currentPatientId).update({
                status: 'completed'
            });
            
            currentPatientCard.innerHTML = '<p>No patient currently being served</p>';
            currentPatientId = null;
        }
    });
    
    // Display waiting queue
    tokensRef.orderByChild('timestamp').on('value', (snapshot) => {
        const waitingQueue = document.getElementById('waitingQueue');
        const tokens = snapshot.val();
        
        waitingQueue.innerHTML = '';
        
        if (tokens) {
            Object.entries(tokens).forEach(([tokenId, token]) => {
                if (token.status === 'waiting' && token.department === window.staffDepartment) {
                    const tokenElement = document.createElement('div');
                    tokenElement.className = 'queue-item';
                    tokenElement.innerHTML = `
                        <strong>${tokenId}</strong>: ${token.name}
                        ${token.priority === 'urgent' ? '<span class="urgent">URGENT</span>' : ''}
                    `;
                    waitingQueue.appendChild(tokenElement);
                }
            });
        }
        
        if (waitingQueue.children.length === 0) {
            waitingQueue.innerHTML = '<p>No patients waiting</p>';
        }
    });
}

// TRIAGE PAGE FUNCTIONALITY
else if (window.pageType === 'triage') {
    const callTriageBtn = document.getElementById('callTriageBtn');
    const completeTriageBtn = document.getElementById('completeTriageBtn');
    const nextPatient = document.getElementById('nextPatient');
    const triageQueue = document.getElementById('triageQueue');
    
    let currentPatientId = null;
    
    // Call next patient for triage
    callTriageBtn.addEventListener('click', () => {
        // Find next waiting patient for triage
        tokensRef.orderByChild('status').equalTo('waiting').once('value')
            .then((snapshot) => {
                const tokens = snapshot.val();
                if (tokens) {
                    // First check for emergency patients
                    let foundPatient = false;
                    
                    // First pass: Look for urgent cases
                    for (const [tokenId, token] of Object.entries(tokens)) {
                        if (token.priority === 'urgent') {
                            currentPatientId = tokenId;
                            foundPatient = true;
                            updatePatientForTriage(tokenId, token);
                            break;
                        }
                    }
                    
                    // Second pass: If no urgent cases, take the oldest token
                    if (!foundPatient) {
                        const sortedTokens = Object.entries(tokens).sort((a, b) => 
                            a[1].timestamp - b[1].timestamp
                        );
                        
                        if (sortedTokens.length > 0) {
                            currentPatientId = sortedTokens[0][0];
                            updatePatientForTriage(currentPatientId, sortedTokens[0][1]);
                        }
                    }
                    
                    if (!foundPatient && !currentPatientId) {
                        alert('No patients waiting for triage');
                    }
                } else {
                    alert('No patients waiting');
                }
            });
    });
    
    function updatePatientForTriage(tokenId, token) {
        tokensRef.child(tokenId).update({
            status: 'in-triage',
            called: true
        });
        
        nextPatient.innerHTML = `
            <h3>${tokenId}</h3>
            <p>Name: ${token.name}</p>
            <p>Department: ${token.department}</p>
            <p>Priority: ${token.priority === 'urgent' ? '<span class="urgent">URGENT</span>' : 'Normal'}</p>
            <p>Room: ${token.assignedRoom || 'Not assigned'}</p>
        `;
        
        // Announce the token
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `Token ${tokenId}, please proceed to triage`
            );
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Complete triage for current patient
    completeTriageBtn.addEventListener('click', () => {
        if (currentPatientId) {
            // Get the current room assignment from the form
            const assignRoom = document.getElementById('assignRoom');
            const assignedRoom = assignRoom ? assignRoom.value : null;
            
            tokensRef.child(currentPatientId).update({
                status: 'waiting-consultation',
                assignedRoom: assignedRoom // Make sure to preserve the room assignment
            });
            
            nextPatient.innerHTML = '<p>No patient in triage</p>';
            currentPatientId = null;
        }
    });
    
    // Display waiting queue for triage
    tokensRef.orderByChild('timestamp').on('value', (snapshot) => {
        const tokens = snapshot.val();
        
        triageQueue.innerHTML = '';
        
        if (tokens) {
            // Group patients by priority
            const urgentPatients = [];
            const normalPatients = [];
            
            Object.entries(tokens).forEach(([tokenId, token]) => {
                if (token.status === 'waiting') {
                    if (token.priority === 'urgent') {
                        urgentPatients.push([tokenId, token]);
                    } else {
                        normalPatients.push([tokenId, token]);
                    }
                }
            });
            
            // Sort by timestamp
            urgentPatients.sort((a, b) => a[1].timestamp - b[1].timestamp);
            normalPatients.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            // Display urgent patients first
            if (urgentPatients.length > 0) {
                const urgentHeader = document.createElement('h3');
                urgentHeader.textContent = 'Urgent Cases';
                triageQueue.appendChild(urgentHeader);
                
                urgentPatients.forEach(([tokenId, token]) => {
                    addPatientToQueue(tokenId, token);
                });
            }
            
            // Then display normal patients
            if (normalPatients.length > 0) {
                const normalHeader = document.createElement('h3');
                normalHeader.textContent = 'Regular Cases';
                triageQueue.appendChild(normalHeader);
                
                normalPatients.forEach(([tokenId, token]) => {
                    addPatientToQueue(tokenId, token);
                });
            }
        }
        
        if (triageQueue.children.length === 0) {
            triageQueue.innerHTML = '<p>No patients waiting</p>';
        }
    });
    
    function addPatientToQueue(tokenId, token) {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'queue-item';
        if (token.priority === 'urgent') tokenElement.classList.add('urgent-item');
        
        tokenElement.innerHTML = `
            <strong>${tokenId}</strong>: ${token.name}
            <span class="department">${token.department}</span>
            <span class="timestamp">Waiting since: ${new Date(token.timestamp).toLocaleTimeString()}</span>
            ${token.assignedRoom ? `<span class="room">${token.assignedRoom}</span>` : ''}
        `;
        
        triageQueue.appendChild(tokenElement);
    }
}

// DOCTOR PAGE FUNCTIONALITY
else if (window.pageType === 'doctor') {
    const callDoctorBtn = document.getElementById('callDoctorBtn');
    const completeConsultBtn = document.getElementById('completeConsultBtn');
    const currentPatient = document.getElementById('currentPatient');
    const doctorQueue = document.getElementById('doctorQueue');
    
    let currentPatientId = null;
    
    // Call next patient for consultation
    callDoctorBtn.addEventListener('click', () => {
        // Get the room name for this doctor
        const roomName = `Consultation room ${window.doctorId.replace('dr', '')}`;
        
        // Find next waiting patient for consultation
        tokensRef.orderByChild('status').equalTo('waiting-consultation').once('value')
            .then((snapshot) => {
                const tokens = snapshot.val();
                
                if (tokens) {
                    console.log(`Looking for patients in room: ${roomName}`);
                    console.log("Available patients:", tokens);
                    
                    // Filter for patients assigned to this room
                    const eligiblePatients = Object.entries(tokens).filter(([_, token]) => {
                        const isMatch = token.assignedRoom === roomName;
                        console.log(`Patient ${token.name} in room ${token.assignedRoom}, match: ${isMatch}`);
                        return isMatch;
                    });
                    
                    console.log(`Found ${eligiblePatients.length} eligible patients`);
                    
                    if (eligiblePatients.length > 0) {
                        // First pass: Look for urgent cases
                        const urgentPatients = eligiblePatients.filter(([_, token]) => 
                            token.priority === 'urgent'
                        );
                        
                        if (urgentPatients.length > 0) {
                            // Sort by timestamp (oldest first)
                            urgentPatients.sort((a, b) => a[1].timestamp - b[1].timestamp);
                            currentPatientId = urgentPatients[0][0];
                            updatePatientForConsultation(currentPatientId, urgentPatients[0][1]);
                        } else {
                            // Sort normal patients by timestamp
                            eligiblePatients.sort((a, b) => a[1].timestamp - b[1].timestamp);
                            currentPatientId = eligiblePatients[0][0];
                            updatePatientForConsultation(currentPatientId, eligiblePatients[0][1]);
                        }
                    } else {
                        alert(`No patients waiting for ${roomName}`);
                    }
                } else {
                    alert('No patients waiting for consultation');
                }
            });
    });
    
    function updatePatientForConsultation(tokenId, token) {
        tokensRef.child(tokenId).update({
            status: 'in-consultation',
            doctor: window.doctorId,
            consultationStartTime: Date.now()
        });
        
        currentPatient.innerHTML = `
            <h3>${tokenId}</h3>
            <p>Name: ${token.name}</p>
            <p>Department: ${token.department}</p>
            <p>Priority: ${token.priority === 'urgent' ? '<span class="urgent">URGENT</span>' : 'Normal'}</p>
            <p>Room: ${token.assignedRoom || 'General'}</p>
        `;
        
        // Announce the token
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `Token ${tokenId}, please proceed to consultation room ${window.doctorId.replace('dr', '')}`
            );
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Complete consultation for current patient
    completeConsultBtn.addEventListener('click', () => {
        if (currentPatientId) {
            tokensRef.child(currentPatientId).update({
                status: 'completed',
                consultationEndTime: Date.now()
            });
            
            currentPatient.innerHTML = '<p>No patient in consultation</p>';
            currentPatientId = null;
        } else {
            alert('No active patient to complete');
        }
    });
    
    // Update doctor room
    function updateDoctorRoom() {
        const roomName = `Consultation room ${window.doctorId.replace('dr', '')}`;
        const roomDisplay = document.getElementById('currentRoomDisplay');
        if (roomDisplay) {
            roomDisplay.textContent = `Room ${window.doctorId.replace('dr', '')}`;
        }
        
        // Update the queue display
        updateDoctorQueue(roomName);
    }
    
    // Function to update the doctor's queue display
    function updateDoctorQueue(roomName) {
        tokensRef.orderByChild('status').equalTo('waiting-consultation').once('value')
            .then((snapshot) => {
                const tokens = snapshot.val();
                
                doctorQueue.innerHTML = '';
                
                if (tokens) {
                    // Filter patients by room assignment
                    const waitingPatients = Object.entries(tokens)
                        .filter(([_, token]) => token.assignedRoom === roomName)
                        .map(([tokenId, token]) => [tokenId, token]);
                    
                    console.log(`Found ${waitingPatients.length} patients for ${roomName}`);
                    
                    if (waitingPatients.length === 0) {
                        doctorQueue.innerHTML = '<p>No patients waiting for this consultation room</p>';
                        return;
                    }
                    
                    // Group patients by priority
                    const urgentPatients = waitingPatients.filter(([_, token]) => token.priority === 'urgent');
                    const normalPatients = waitingPatients.filter(([_, token]) => token.priority !== 'urgent');
                    
                    // Sort by timestamp
                    urgentPatients.sort((a, b) => a[1].timestamp - b[1].timestamp);
                    normalPatients.sort((a, b) => a[1].timestamp - b[1].timestamp);
                    
                    // Display urgent patients first
                    if (urgentPatients.length > 0) {
                        const urgentHeader = document.createElement('h3');
                        urgentHeader.textContent = 'Urgent Cases';
                        doctorQueue.appendChild(urgentHeader);
                        
                        urgentPatients.forEach(([tokenId, token]) => {
                            addPatientToConsultQueue(tokenId, token);
                        });
                    }
                    
                    // Then display normal patients
                    if (normalPatients.length > 0) {
                        const normalHeader = document.createElement('h3');
                        normalHeader.textContent = 'Regular Cases';
                        doctorQueue.appendChild(normalHeader);
                        
                        normalPatients.forEach(([tokenId, token]) => {
                            addPatientToConsultQueue(tokenId, token);
                        });
                    }
                } else {
                    doctorQueue.innerHTML = '<p>No patients waiting for consultation</p>';
                }
            });
    }
    
    function addPatientToConsultQueue(tokenId, token) {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'queue-item';
        if (token.priority === 'urgent') tokenElement.classList.add('urgent-item');
        
        // Calculate waiting time
        const waitingMinutes = Math.floor((Date.now() - token.timestamp) / 60000);
        
        tokenElement.innerHTML = `
            <strong>${tokenId}</strong>: ${token.name}
            <span class="department">${token.department}</span>
            <span class="timestamp">Waiting ${waitingMinutes} min</span>
            <span class="room">${token.assignedRoom || 'Not assigned'}</span>
        `;
        
        doctorQueue.appendChild(tokenElement);
    }
    
    // Initial room setup
    updateDoctorRoom();
    
    // Listen for room change
    document.addEventListener('doctorRoomChanged', updateDoctorRoom);
    
    // Listen for all token changes to update the queue
    tokensRef.on('value', () => {
        const roomName = `Consultation room ${window.doctorId.replace('dr', '')}`;
        updateDoctorQueue(roomName);
    });
}

// DISPLAY SCREEN FUNCTIONALITY
else if (window.pageType === 'display') {
    const nowServing = document.getElementById('currentToken');
    const currentPatient = document.getElementById('currentPatientName');
    const currentRoom = document.getElementById('currentRoom');
    const generalQueueList = document.getElementById('generalQueueList');
    const consultationQueueList1 = document.getElementById('consultationQueueList1');
    const consultationQueueList2 = document.getElementById('consultationQueueList2');
    const consultationQueueList3 = document.getElementById('consultationQueueList3');
    const consultationQueueList4 = document.getElementById('consultationQueueList4');
    const updateTime = document.getElementById('updateTime');
    
    // Stats elements 
    const generalWaiting = document.getElementById('generalWaiting');
    const generalUrgent = document.getElementById('generalUrgent');
    const room1Waiting = document.getElementById('room1Waiting');
    const room1Current = document.getElementById('room1Current');
    const room2Waiting = document.getElementById('room2Waiting');
    const room2Current = document.getElementById('room2Current');
    const room3Waiting = document.getElementById('room3Waiting');
    const room3Current = document.getElementById('room3Current');
    const room4Waiting = document.getElementById('room4Waiting');
    const room4Current = document.getElementById('room4Current');
    
    // Update all displays
    function updateDisplays(tokens) {
        if (!tokens) {
            resetDisplays();
            return;
        }
        
        // Find currently serving patient
        let currentlyServing = null;
        Object.entries(tokens).forEach(([tokenId, token]) => {
            if (token.status === 'in-consultation' || token.status === 'in-triage') {
                if (!currentlyServing || token.timestamp > currentlyServing.timestamp) {
                    currentlyServing = { token: tokenId, ...token };
                }
            }
        });
        
        // Update "Now Serving" display
        if (currentlyServing) {
            nowServing.textContent = currentlyServing.token;
            currentPatient.textContent = currentlyServing.name;
            currentRoom.textContent = currentlyServing.assignedRoom || "Consultation Area";
        } else {
            resetDisplays();
        }
        
        // Queue counts
        let generalCount = 0;
        let urgentCount = 0;
        let room1Count = 0;
        let room2Count = 0;
        let room3Count = 0;
        let room4Count = 0;
        
        let room1CurrentPatient = "---";
        let room2CurrentPatient = "---";
        let room3CurrentPatient = "---";
        let room4CurrentPatient = "---";
        
        // Filter and count patients for each area
        Object.entries(tokens).forEach(([tokenId, token]) => {
            // Count general waiting
            if (token.department === 'General' && token.status === 'waiting') {
                generalCount++;
                if (token.priority === 'urgent') urgentCount++;
            }
            
            // Count by room
            if (token.assignedRoom === 'Consultation room 1') {
                if (token.status === 'waiting-consultation') {
                    room1Count++;
                } else if (token.status === 'in-consultation') {
                    room1CurrentPatient = token.name;
                }
            } else if (token.assignedRoom === 'Consultation room 2') {
                if (token.status === 'waiting-consultation') {
                    room2Count++;
                } else if (token.status === 'in-consultation') {
                    room2CurrentPatient = token.name;
                }
            } else if (token.assignedRoom === 'Consultation room 3') {
                if (token.status === 'waiting-consultation') {
                    room3Count++;
                } else if (token.status === 'in-consultation') {
                    room3CurrentPatient = token.name;
                }
            } else if (token.assignedRoom === 'Consultation room 4') {
                if (token.status === 'waiting-consultation') {
                    room4Count++;
                } else if (token.status === 'in-consultation') {
                    room4CurrentPatient = token.name;
                }
            }
        });
        
        // Update count displays
        generalWaiting.textContent = generalCount;
        generalUrgent.textContent = urgentCount;
        room1Waiting.textContent = room1Count;
        room1Current.textContent = room1CurrentPatient;
        room2Waiting.textContent = room2Count;
        room2Current.textContent = room2CurrentPatient;
        room3Waiting.textContent = room3Count;
        room3Current.textContent = room3CurrentPatient;
        room4Waiting.textContent = room4Count;
        room4Current.textContent = room4CurrentPatient;
        
        // Update queue displays
        updateQueueList(generalQueueList, tokens, 'General');
        updateQueueList(consultationQueueList1, tokens, 'Consultation room 1');
        updateQueueList(consultationQueueList2, tokens, 'Consultation room 2');
        updateQueueList(consultationQueueList3, tokens, 'Consultation room 3');
        updateQueueList(consultationQueueList4, tokens, 'Consultation room 4');
        
        // Update timestamp
        updateTime.textContent = new Date().toLocaleTimeString();
    }
    
    function resetDisplays() {
        nowServing.textContent = '---';
        currentPatient.textContent = 'Please wait for your turn';
        currentRoom.textContent = '';
        generalWaiting.textContent = '0';
        generalUrgent.textContent = '0';
        room1Waiting.textContent = '0';
        room1Current.textContent = '---';
        room2Waiting.textContent = '0';
        room2Current.textContent = '---';
        room3Waiting.textContent = '0';
        room3Current.textContent = '---';
        room4Waiting.textContent = '0';
        room4Current.textContent = '---';
    }
    
    function updateQueueList(element, tokens, room) {
        element.innerHTML = '';
        
        // Filter patients for this room
        const roomPatients = Object.entries(tokens)
            .filter(([_, token]) => 
                (token.assignedRoom === room || (room === 'General' && token.department === 'General')) && 
                (token.status === 'waiting' || token.status === 'waiting-consultation' || token.status === 'in-consultation')
            )
            .map(([tokenId, token]) => ({ tokenId, ...token }))
            .sort((a, b) => {
                // Urgent first, then by timestamp
                if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
                if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
                return a.timestamp - b.timestamp;
            });
        
        if (roomPatients.length === 0) {
            element.innerHTML = '<div class="empty-queue">No patients waiting</div>';
            return;
        }
        
        // Create patient items
        roomPatients.forEach(patient => {
            const patientItem = document.createElement('div');
            patientItem.className = 'token-item';
            
            if (patient.status === 'in-consultation') {
                patientItem.classList.add('called-token');
            }
            
            if (patient.priority === 'urgent') {
                patientItem.classList.add('urgent-token');
            }
            
            // Calculate waiting time
            const waitingTime = Math.floor((Date.now() - patient.timestamp) / 60000); // in minutes
            
            patientItem.innerHTML = `
                <div class="token-number">${patient.tokenId}</div>
                <div class="token-info">
                    <div class="token-name">${patient.name}</div>
                    <div class="token-meta">
                        ${patient.priority === 'urgent' ? '<span class="urgent-badge">URGENT</span>' : ''}
                        <span class="waiting-time">${waitingTime} min</span>
                    </div>
                </div>
            `;
            
            element.appendChild(patientItem);
        });
    }
    
    // Listen for changes
    tokensRef.on('value', (snapshot) => {
        updateDisplays(snapshot.val());
    });
    
    // Initial update
    updateTime.textContent = new Date().toLocaleTimeString();
}