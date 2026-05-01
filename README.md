# VoteWise – AI Election Assistant

VoteWise is an AI-powered platform designed to simplify the election process by providing clear, personalized, and actionable guidance to voters. By bridging the gap between complex election laws and the average citizen, VoteWise empowers users to navigate registration, eligibility, and voting procedures with confidence.

---

## 1. Chosen Vertical: Civic Tech / Election Assistance

VoteWise operates within the **Civic Tech** vertical, specifically focusing on **Election Assistance and Voter Education**. 

In many democratic nations, election information is often fragmented, written in complex legal language, and scattered across multiple government portals. This lack of clarity creates a significant barrier to entry, particularly for first-time voters, elderly citizens, and rural populations. By providing a centralized, AI-driven interface, VoteWise aims to increase voter turnout and ensure that every eligible citizen has the information they need to exercise their right to vote.

---

## 2. Approach and Logic

VoteWise is architected as a high-performance, single full-stack application that blends deterministic logic with generative AI.

### Core Architecture
The system utilizes a **Node.js and Express** backend that serves a lightweight, responsive frontend. This single-container approach ensures rapid deployment and high scalability, suitable for high-traffic periods during election cycles.

### Hybrid Decision Engine
The intelligence of VoteWise stems from a hybrid approach:
- **Context-Awareness Layer**: The system first captures essential user attributes, including age, geographic location (State/UT), and current registration status.
- **Rule-Based Decision Engine**: Before reaching the AI, user data passes through a logical layer that determines the user's primary "persona" (e.g., ineligible minor, unregistered eligible adult, or registered voter).
- **Intelligent Response Generation**: Using the **Google Gemini 1.5 Flash API**, the system synthesizes the user context and logical state into natural language responses. This ensures that instructions are not only accurate but also easy to understand.

### Cloud Integration
The platform integrates **Google Cloud Services** for reliable hosting and **Firebase** for secure data management and authentication. This ensures that user sessions are persistent and that the system can scale to meet regional demands.

---

## 3. How the Solution Works

VoteWise follows a streamlined, user-centric flow to provide immediate value:

1.  **Context Input**: The user provides basic details (age, state, registration status) via an intuitive onboarding interface.
2.  **Logic Evaluation**: The decision engine evaluates the input. For example, if a user is 21 and unregistered, the system identifies "Registration Assistance" as the priority.
3.  **Prompt Synthesis**: The system constructs a structured prompt containing the user’s specific context, legal requirements for their state, and the desired goal.
4.  **AI Inference**: The **Google Gemini 1.5 Flash API** processes the prompt and generates a step-by-step guide, such as "How to fill Form 6 on the National Voters' Service Portal."
5.  **Dynamic UI Delivery**: The response is streamed in real-time to the user interface, presenting the information in digestible, numbered steps with clear calls to action.

---

## 4. Assumptions Made

To ensure the reliability and focus of the application, the following assumptions were made:

-   **User Integrity**: It is assumed that users provide accurate information regarding their age and registration status for the guidance to be valid.
-   **Information Threshold**: Election timelines and registration procedures are based on standard national and state-level guidelines provided by the Election Commission.
-   **Guidance-Based Scope**: The assistant provides procedural guidance and educational information; it is not a substitute for official legal advice or government-issued mandates.
-   **Connectivity**: The solution assumes active internet connectivity for real-time AI inference and cloud service integration.
-   **Static Procedural Data**: High-level procedures (like Form 6 registration) are assumed to be static for the duration of an election cycle unless updated via a system-level configuration change.

---

## 5. Quick Start

### Local Development
1. **Clone the repository** and navigate to the project root.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment**:
   Create a `.env` file based on `.env.example` and add your `GOOGLE_API_KEY`.
4. **Start the server**:
   ```bash
   npm run dev
   ```
5. **Run tests**:
   ```bash
   npm test
   ```
6. **Access the app**: Open `http://localhost:8080` in your browser.

### Docker Deployment
1. **Build the image**:
   ```bash
   docker build -t votewise .
   ```
2. **Run the container**:
   ```bash
   docker run -p 8080:8080 --env-file .env votewise
   ```
