# SmartPatientFlow Documentation

## Overview

**SmartPatientFlow** is a hospital queue management system designed to streamline patient flow from reception to triage, consultation, and analytics. It offers dashboards for different staff roles (Reception, Triage Nurse, Doctor, Display) and supports real-time updates using Firebase.

---

## Main Features

- **Reception Dashboard:** Register incoming patients, assign tokens, and manage emergency cases.
- **Triage Dashboard:** Assess patients, assign consultation rooms, prioritize urgent cases.
- **Doctor Dashboard:** Call next patient, complete consultations, view current queue.
- **Display Board:** Show real-time patient queue for waiting areas.
- **Analytics Dashboard:** View statistics and performance metrics (implementation may vary).

---

## Technologies Used

### Frontend
- **React** (TypeScript)
- **Wouter** (Routing)
- **@tanstack/react-query** (Data fetching and caching)
- **Tailwind CSS** (Styling)
- **Font Awesome** (Icons)
- **SpeechSynthesis API** (Voice announcements for patient calls)

### Backend
- **Express.js** (Node.js server)
- **Vite** (Development and build tool)
- **CORS** (Cross-Origin Resource Sharing)

### Database & Authentication
- **Firebase Realtime Database**
- **Firebase Auth** (Anonymous authentication)

### Build Tools
- **Vite** (with plugins for React, theme management, runtime error overlays)

---

## Project Structure

- `client/` — React frontend application.
- `server/` — Node.js Express backend (API and serving client).
- `attached_assets/` — Standalone HTML/JS display dashboards for environments where React is not used.
- `shared/` — Shared code/types (if any).
- `vite.config.ts` — Vite configuration for building the project.

---

## How It Works

### Reception Flow
1. Staff registers a patient via the Reception dashboard.
2. The patient receives a token and is added to the queue in Firebase.

### Triage Flow
1. Triage nurse calls the next (urgent or oldest) patient.
2. Patient is assessed and assigned a consultation room.
3. Status is updated in Firebase.

### Doctor Flow
1. Doctor calls the next patient for consultation (prioritizing urgent cases and room assignments).
2. Completes consultation, updates status.

### Display Board
- Shows real-time queue status for patients in waiting areas, using Firebase for updates.

---

## Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eddiepeter75/SmartPatientFlow.git
   ```

2. **Install dependencies for client and server:**
   ```bash
   cd SmartPatientFlow/client
   npm install
   cd ../server
   npm install
   ```

3. **Setup Firebase:**
   - Add your Firebase config in `client/src/lib/firebase.ts` and `attached_assets/app.js` (already present in code).

4. **Run the development server:**
   ```bash
   # In the client directory:
   npm run dev

   # In the server directory:
   npm start
   ```

---

## Additional Information

- Patient queue logic and room assignment are handled via Firebase transactions.
- All queue operations (call next, complete service, assign room) trigger UI updates and can announce to patients via browser voice API.
- The system is modular: additional dashboards or features (like analytics) can be added easily.

---

## Contributors

- [eddiepeter75](https://github.com/eddiepeter75)

---

For further details, refer to the source code or open an issue in the repository.
