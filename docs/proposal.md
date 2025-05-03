# PULS3122 Furniture Design Application Proposal (1-Week Scope)

## Introduction

This document outlines the proposal for a **web application** designed for a furniture company's in-store designers, developed within an accelerated one-week timeframe as per the PULS3122 coursework requirements. The primary goal is to create a functional tool enabling designers to quickly visualize basic furniture layouts within customer-defined room parameters. Given the severe time constraint, this proposal focuses on delivering the core functionality outlined in Appendix A, necessarily simplifying or omitting aspects like extensive user research, iterative prototyping, and formal usability testing described in the full coursework brief. **Please note:** While the official coursework brief mandates the use of Java and Swing, this proposal, following recent discussions and the updated development plan (`plan.md`), outlines development using JavaScript and WebGL. It is crucial to understand that this deviation may have significant implications for academic marking according to the coursework guidelines.

## Functionality

The application will allow authenticated designers (via a simple login mechanism) to create and manage furniture layout designs. Designers will first define the basic parameters of a customer's room, including its dimensions (size and shape) and potentially a base color scheme. Within this defined room context, designers can add predefined 2D shapes representing common furniture items (e.g., chairs, tables). These shapes can be positioned and potentially scaled within the 2D representation of the room. The core visualization features will include rendering the 2D layout and providing a basic 3D perspective view of the arrangement. Designers will be able to apply color changes to the entire design or selected furniture items. A simple shading effect might be implemented in the 3D view if time permits, but is a secondary goal. Essential data management features will include the ability to save the current design layout (e.g., using **browser local storage** or the **File System Access API**) and subsequently load saved designs for review or modification. Basic functionality to delete or manage saved designs will also be included.

## User Interface Pages/Screens

The user interface will be kept straightforward to facilitate rapid development using **React components within the Next.js framework**, styled with standard CSS or a chosen library (like Tailwind CSS).

1.  **Login Screen:** A simple **React component** representing the login form, likely managed as a separate page route in Next.js. Authentication will be basic client-side validation.
2.  **Main Design Workspace:** This central view, likely the main Next.js page, will feature **React components** wrapping the **HTML Canvas elements** for 2D and 3D views. Input fields, toolbars, and buttons will also be implemented as **React components**.

## Technical Details

The application will be developed using modern web technologies: **Next.js** as the **React framework** for structure, routing, and tooling, **React** for building the user interface components, **JavaScript (ES6+)**, **HTML5**, and **CSS3** (or a utility/component library like Tailwind CSS). The **HTML Canvas API (2D context)**, likely managed within a React component using hooks like `useRef` and `useEffect`, will be used for rendering the 2D shapes and managing the interactive design canvas. For the 3D visualization, **WebGL** will be employed, integrated into React using libraries like **React Three Fiber (`@react-three/fiber`)** and **Drei (`@react-three/drei`)** to simplify scene setup, rendering, and interaction declaratively. State management will be handled using React's built-in mechanisms (like Context API or `useState`) or a simple external library (like Zustand) if needed. Design persistence will be handled using **browser-based storage mechanisms**, such as `localStorage`. Version control will be managed using **Git**, with the codebase hosted on **GitHub**.

## Non-Technical Details

The **target user** remains the in-store furniture designer. Due to the 1-week constraint, the **development process** will follow a highly condensed agile approach, focusing on rapid implementation of core features identified in Appendix A using the specified web technologies. Formal requirements gathering beyond Appendix A, persona development, multiple prototyping stages (low/high fidelity), and external user testing (formative/summative) will be omitted. **Evaluation** will rely solely on internal testing by the development team (testing in web browsers) to ensure core functionality operates as expected. **Deliverables** will include the functional **web application** source code, a GitHub repository containing the source code (with commit history reflecting the week's work and a README with setup/run instructions), a concise final report (approx. 2000 words where feasible) documenting the streamlined process and implementation, and a short YouTube video (7-12 mins) demonstrating the application running in a browser and briefly explaining the code and design choices.

## Payments and Deliverables

**Cost and Payment Terms:** The total cost for the development of this furniture design application, encompassing all deliverables outlined below, is Rs. 30,000/=. To initiate the project, an advance payment of 50% (Rs. 15,000/=) of the total cost is required. The remaining 50% will be due upon final delivery of the software and documentation.

**Deliverables:** Upon completion and final payment, the following items will be delivered:
1.  The complete source code for the **web application** (Next.js/React project), managed within a Git repository.
2.  Clear instructions within the repository's README file on how to set up and run the web application locally (e.g., using `npm install` and `npm run dev`).
3.  The final project report (as described in the Non-Technical Details section) documenting the development process, design, implementation, and internal evaluation.

**Intellectual Property:** Upon receipt of the final payment, all intellectual property rights for the custom-developed source code and the application described in this proposal will be transferred to the client (the furniture company). The development team retains the right to use the underlying technologies and general knowledge gained during the project for future endeavors. 