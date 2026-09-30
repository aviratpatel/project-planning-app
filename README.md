# Project Planning & Timeline Generator App

A full-stack web application built with **Node.js, Express.js, React (TypeScript), and Vite** that processes application development effort estimates from a CSV file and dynamically generates estimation timelines and Gantt charts based on team bandwidth and working calendar constraints.

---

## 🌟 Key Features

1. **CSV Effort Parser**:
   - Parses application development efforts listing **Application**, **Screen**, **Feature**, and **Efforts in Days**.
   - Handles invisible UTF-8 Byte Order Marks (BOM) and provides flexible, case-insensitive CSV header mapping.

2. **Resource Allocation Engine**:
   - **1 Developer per Feature Constraint**: Ensures each feature is assigned as an atomic unit to a single developer from start to finish without splitting task effort across multiple developers.
   - **Automatic Resource Scheduling**: Dynamically schedules incoming features to whichever developer becomes available earliest in the resource pool.

3. **Business Days & Calendar Logic**:
   - Skips Saturdays and Sundays when computing working day windows.
   - Automatically rolls forward to Monday if a project or task start date falls on a weekend.

4. **Multi-Level Microsoft Excel Timeline Export (`.xlsx`)**:
   - Exports formatted Microsoft Excel spreadsheets featuring **two interactive Gantt chart worksheets**:
     - **Worksheet 1 (`Feature Detailed Gantt`)**: Granular breakdown per feature, screen, assigned developer resource, and execution timeline bars.
     - **Worksheet 2 (`Application Summary Gantt`)**: High-level timeline summary grouped by application (`APP1`, `APP2`, `APP3`, etc.).

---

## 🏗️ Architecture & High-Level Explanation

### Backend (`/backend`)
- **Framework**: Express.js running on Node.js.
- **File Parsing**: `multer` handles multipart file uploads; `csv-parser` processes CSV streams with header sanitization.
- **Service Layer (`plannerService.js`)**:
  - Implements a worker-pool scheduling algorithm that tracks availability dates per developer.
  - Computes date ranges using business-day calendar arithmetic (skipping weekends).
- **Excel Generation (`ExcelJS`)**: Constructs styled Excel workbooks with merged title blocks, custom color fills (`#1F4E78`, `#2F5597`, `#206095`), weekend shading (`#F2F2F2`), and daily timeline columns.

### Frontend (`/frontend`)
- **Framework**: React with TypeScript created via Vite (`react-ts` template).
- **Type Safety**: Strictly typed interfaces defined in `types.ts` (`PlanResponse`, `ScheduleItem`, `AppBreakdown`, `PlanSummary`).
- **Components**:
  - `FileUpload.tsx`: Input configurator for uploading CSV files, specifying team size (number of developers), selecting project start date, and triggering Excel downloads.
  - `TimelineView.tsx`: Displays summary cards (total workload days, developer count, target completion date), application effort breakdowns, and an interactive schedule table.

---

## 📁 Project Structure

project-planning-app/
├── README.md
├── backend/
│   ├── package.json
│   ├── .env
│   ├── uploads/                  # Temporary upload storage
│   └── src/
│       ├── server.js             # Express entry point
│       ├── routes/
│       │   └── planRoutes.js     # API route definitions (/upload, /export-excel)
│       ├── controllers/
│       │   └── planController.js # Upload processing & Excel generation
│       └── services/
│           └── plannerService.js # CSV parsing & business day scheduling logic
│
└── frontend/
├── package.json
├── index.html
├── tsconfig.json
└── src/
	├── main.tsx              # React entry point
	├── App.tsx               # Primary layout component
	├── types.ts              # TypeScript interface definitions
	├── index.css             # Global styles
	└── components/
		├── FileUpload.tsx    # Upload & configuration form
		└── TimelineView.tsx  # Timeline summary & schedule table



---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

---

### 1. Backend Setup

``bash
cd backend

# Install dependencies
npm install

# Start the development server (runs on http://localhost:5000)
npm run dev


# Backend Dependencies Installed:
express: Web server framework

cors: Enables Cross-Origin Resource Sharing for frontend requests

multer: Middleware for file uploads

csv-parser: Fast CSV parsing stream

exceljs: Spreadsheet generation and styling engine

dotenv: Environment variable management


2. Frontend Setup

# express: Web server framework

cors: Enables Cross-Origin Resource Sharing for frontend requests

multer: Middleware for file uploads

csv-parser: Fast CSV parsing stream

exceljs: Spreadsheet generation and styling engine

dotenv: Environment variable management

### 2. Frontend Setup
``bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev

# 📖 Usage Instructions
# 1. Prepare your CSV file (Project_Efforts_Sample.csv):
Ensure your CSV file contains columns for Application, Screen, Feature, and Efforts in Days:

Code snippet
Application,Screen,Feature,Efforts in Days
APP1,SCR1,FC1,5
APP1,SCR1,FC2,4
APP1,SCR2,FC1,9
APP2,SCR1,FC1,2
APP3,SCR1,FC1,3

# 2. Configure Timeline Parameters:

Open http://localhost:5173 in your browser.

Choose your CSV file.

Set Total Developers (e.g., 2).

Select the Project Start Date using the date picker.

# 3. Generate Timeline:

Click Generate Timeline Plan to render the breakdown and resource allocation schedule directly on screen.

# 4. Export to Microsoft Excel:

Click 📊 Save Timeline to Excel to download the styled .xlsx file containing both feature-level and application-level Gantt chart worksheets.