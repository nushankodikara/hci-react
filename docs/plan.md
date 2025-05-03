# PULS3122 Coursework Development Plan (Compressed 1-Week Schedule - MODIFIED FOR JAVASCRIPT/WEBGL)

**\*\*\* CRITICAL WARNING \*\*\***
**This modified plan uses JavaScript, HTML Canvas, and WebGL (e.g., via Three.js). The coursework brief explicitly requires using Java and Swing APIs. Following this plan directly contradicts the requirements and, according to the brief, will likely result in ZERO MARKS for the project. Proceed only if you have explicit permission for this deviation or fully accept the grading consequences.**
**\*\*\* END WARNING \*\*\***

**Note:** This plan outlines an extremely aggressive 1-week schedule using web technologies. It requires intense focus, parallel work, and significant simplification compared to the original brief's ideal process. Scope reduction, particularly in user research, iterative design, and formal testing, is necessary. Meeting all original marking criteria perfectly under this constraint (especially given the language violation) will be very difficult.

## Day 1: Setup, Analysis & Basic Design

*   **(AM) Setup & Planning:**
    *   Confirm team, set up communication channel (e.g., Slack/Discord).
    *   Create GitHub repo, agree on simple branching (e.g., feature branches -> main).
    *   Quickly confirm Node.js/npm and IDE (e.g., VS Code) setup.
    *   Choose core libraries: **React with Next.js** as the primary framework/structure, 2D approach (HTML Canvas API recommended), 3D library (Three.js recommended for WebGL simplification). Install core dependencies (`npm install three @react-three/fiber @react-three/drei` if using React integration for Three.js).
    *   Assign initial high-level roles/areas (e.g., UI/React Components, 2D Canvas Logic, 3D WebGL/Three.js Integration, Data/State Management).
    *   **Rapid Review:** Team reads coursework brief (`coursework.md`) and Appendix A together, acknowledging the language requirement conflict.
*   **(PM) Rapid Analysis & Requirements:**
    *   Focus *only* on Appendix A requirements. Skip external requirement gathering.
    *   Quickly define 1-2 core user stories for the designer. Skip detailed personas.
    *   Document *essential* requirements for task tracking.
*   **(PM) Basic Design:**
    *   **Skip Low-Fidelity Prototyping.**
    *   Go directly to collaborative sketching or a *very* basic digital prototype (e.g., Figma) for core web page layouts (Login, Main Design View, Save/Load). Focus on layout and essential HTML controls.
    *   **Skip initial user feedback.** Rely on team consensus.

## Day 2: Core Structure & UI Shell

*   **Project Setup:** Initialize **Next.js project** (`npx create-next-app@latest`). Configure basic project structure (pages, components folders). Install dependencies (`npm install three`, etc. - ensure Three.js and potentially React-Three-Fiber are installed).
*   **Parallel Work:**
    *   **Team Member 1 (UI Lead):** Implement basic **React component structure within Next.js**. Create layout components, page routes (e.g., for Login, Main App). Build UI components (Login form, main layout containers, toolbars) using **React/JSX and CSS/Tailwind/CSS-in-JS**. Implement Login screen UI elements as React components.
    *   **Team Member 2 (2D):** Set up HTML Canvas element within a **React component**. Get 2D rendering context (potentially using `useRef` hook). Implement functions/hooks to draw simple shapes on the canvas based on props or state.
    *   **Team Member 3 (3D):** Set up WebGL canvas within a **React component**, likely using **React Three Fiber (`@react-three/fiber`)** and Drei (`@react-three/drei`) for easier integration. Initialize Three.js scene, camera, lights, and basic objects declaratively. Implement basic camera controls.
    *   **Team Member 4 (Data):** Define JavaScript objects/classes or interfaces for designs, rooms, furniture. Plan state management approach (**React Context API or Zustand/Redux** for simplicity). Plan browser storage mechanism (`localStorage`).
    *   **Team Member(s) 5/6:** Support others, start documenting Day 1 activities for the report, refine task board.
*   **Integration:** Integrate 2D and 3D canvas components into the main Next.js page/layout structure. Ensure basic data flow/state management setup is working.
*   **Version Control:** Frequent commits from all members.

## Day 3: Feature Implementation - Part 1

*   **Parallel Work (Focus on Core Functionality):**
    *   **UI:** Implement room parameter input components (React controlled components). Connect inputs to global/local state using chosen state management. Implement basic toolbar/menu actions triggering state updates.
    *   **2D:** Implement drawing shapes on the canvas based on application state. Implement selecting shapes via mouse events on the canvas component, updating state.
    *   **3D:** Implement basic 3D view rendering based on application state using React Three Fiber. Link 3D view updates to state changes.
    *   **Data:** Implement basic "Save Design" functionality using `localStorage.setItem(key, JSON.stringify(data))`.
    *   **Documentation:** Continue documenting progress, design decisions (especially technology choices), and implementation snippets.
*   **Integration & Team Check-in:** Ensure UI controls modify data, and 2D/3D views update accordingly. Test saving.

## Day 4: Feature Implementation - Part 2

*   **Parallel Work (Adding Detail):**
    *   **UI/2D:** Implement changing color/scaling of selected shapes by updating state and re-rendering the canvas component.
    *   **3D:** Refine 3D view using R3F components. Implement color/scale changes reflected in 3D objects based on state. Implement basic shading using R3F materials.
    *   **Data:** Implement "Load Design" functionality (reading from `localStorage` and updating state). Implement "Edit/Delete Design" (managing designs in state and updating `localStorage`).
    *   **Login:** Connect login UI component to basic client-side authentication logic (updating state upon successful pseudo-login).
    *   **Documentation:** Keep documenting.
*   **Integration & Code Review:** Review key JS functions and component interactions.

## Day 5: Refinement & Internal Testing

*   **Bug Fixing:** Address critical bugs found during development using browser developer tools.
*   **Refinement:** Polish UI interactions and visual consistency where possible. Ensure core requirements from Appendix A are met functionally within the web app.
*   **Internal Testing:**
    *   **Skip formal user testing.**
    *   Team members test the web application thoroughly in a browser, focusing on the main user stories (Create, View 2D/3D, Scale, Color, Save, Load).
    *   Log bugs/issues on the task board.
*   **Code Freeze (End of Day):** Aim to have core functionality stable in the web application.

## Day 6: Documentation & Video

*   **(AM) Final Bug Fixing:** Address critical bugs found during internal testing.
*   **(AM) GitHub:** Clean up repository, ensure `README.md` is present with clear setup (`npm install`, `npm run dev`) and run instructions, and credits (if any). Ensure history is reasonable.
*   **(PM) Report Writing:**
    *   Collaboratively write the report sections. **Crucially, acknowledge the deviation from the required language (Java/Swing) in the introduction/implementation sections and explain the rationale if applicable (though this may not mitigate the marking penalty).**
    *   Focus on concisely describing what was done using JS/WebGL/Canvas. Keep it close to 2000 words *if possible*, but prioritize clarity.
    *   Add GitHub link.
*   **(Late PM / Evening) Video Recording:**
    *   Plan a quick run-through: Screen capture the web application. Demo login, creating a simple design, showing 2D/3D views, color/scale changes, save/load.
    *   *Quickly* explain key JavaScript code sections/design choices (e.g., Three.js setup, Canvas drawing logic, event handling).
    *   Ensure all members appear briefly (e.g., via webcam overlay or quick intro).
    *   Record in required format (MP4, 720p+). Check audio quality.
    *   Upload to YouTube, get public link. Add link to report.

## Day 7: Final Checks & Submission

*   **(AM) Final Review:**
    *   Test the web application one last time in the target browser(s).
    *   Read through the report one last time.
    *   Check *all* links (GitHub, YouTube) are correct, public, and working.
    *   Verify the video meets length/format requirements.
    *   Confirm application runs following `README.md` instructions.
*   **(Submission):** Submit the single PDF report via DLE well before the deadline.

## Timeline Overview (1 Week - JS/WebGL Version)

*   **Day 1:** Setup (**Next.js/React**, Node/JS/WebGL Libs), Plan, Analyze, Basic Web Design
*   **Day 2:** Core Structure (**Next.js/React Components**) & Canvas/WebGL Shell Implementation
*   **Day 3:** Feature Implementation (Part 1 - Draw, Select, 3D Basic, Save)
*   **Day 4:** Feature Implementation (Part 2 - Color, Scale, Load, Edit/Delete, Login)
*   **Day 5:** Refinement & Internal Testing (Browser)
*   **Day 6:** Bug Fixing, Documentation (Report & GitHub - Acknowledge Deviation), Video Recording/Upload
*   **Day 7:** Final Checks & Submission

This schedule is extremely demanding and carries significant risk due to the violation of the core language requirement. Success depends on excellent teamwork, clear communication, rapid decision-making, familiarity with web technologies, and accepting necessary compromises. Good luck! 