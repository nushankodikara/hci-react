# Room Planner: An Interactive 3D Furniture Design Application

## 1. Introduction

In the contemporary landscape of interior design and furniture retail, the integration of technology has become increasingly paramount in enhancing customer experience and decision-making processes. This report presents a comprehensive analysis and implementation of Room Planner, an innovative desktop application developed to bridge the gap between furniture visualization and practical room design. The application serves as a crucial tool for furniture designers and retail professionals, enabling them to provide customers with an immersive and interactive experience in visualizing furniture arrangements within their intended spaces.

### 1.1 Application Features

The Room Planner application represents a significant advancement in furniture visualization technology, incorporating a comprehensive suite of features designed to facilitate efficient and accurate room planning. At its core, the application utilizes Next.js framework architecture, integrating React components for the user interface and Three.js for sophisticated 3D rendering capabilities. This technological foundation enables seamless transitions between two-dimensional floor plans and three-dimensional room visualizations, providing users with enhanced spatial awareness and design flexibility.

The application's architecture is structured around a robust authentication system, ensuring secure access for design professionals while maintaining data integrity. The visualization engine supports real-time manipulation of furniture models, including precise scaling, rotation, and positioning functionalities. Furthermore, the system incorporates advanced color manipulation capabilities, allowing users to modify both individual furniture pieces and entire room schemes through an intuitive HSL (Hue, Saturation, Lightness) control system. These features are complemented by a persistent storage mechanism that enables designers to save, retrieve, and modify their work across sessions, facilitating an efficient and professional design workflow.

### 1.2 Functional and Non-Functional Requirements

The development of Room Planner was guided by a comprehensive analysis of both functional and non-functional requirements, ensuring the delivery of a robust and user-centric solution. The primary functional requirements encompass essential operations that define the core capabilities of the system. These include a secure authentication mechanism for design professionals, enabling them to maintain individual accounts and access their work securely. The system implements sophisticated room specification functionalities, allowing users to define precise spatial parameters including dimensions, shape configurations, and color schemes. Additionally, the application provides seamless transitions between 2D and 3D visualization modes, complemented by an extensive suite of real-time manipulation tools for furniture placement and modification.

From a non-functional perspective, the application adheres to stringent performance criteria to ensure optimal user experience. The system maintains responsive interaction with minimal latency, particularly crucial during 3D rendering and real-time model manipulations. Security considerations are paramount, implemented through industry-standard encryption protocols for data transmission and storage. The user interface design prioritizes intuitive navigation and accessibility, reducing the learning curve for new users while maintaining powerful functionality for experienced designers. Furthermore, the application's architecture emphasizes scalability and maintainability, utilizing modular components and clean code practices to facilitate future enhancements and system updates.

### 1.3 Paper-based Prototype

Initial conceptualization of the Room Planner interface was achieved through comprehensive paper-based prototyping, facilitating rapid iteration and stakeholder feedback during the early design phase. The prototype encompassed essential interface elements, including the main dashboard, room configuration panels, and furniture manipulation controls. Through hand-drawn wireframes and interface sketches, the team effectively visualized the spatial relationships between different components and the logical flow of user interactions. This low-fidelity approach proved invaluable in identifying potential usability challenges and refining the interface layout before proceeding with digital implementation.

### 1.4 Bringing Requirements to Life

To ensure the application effectively addresses real-world user needs, the development team employed a persona-based design approach, creating detailed user profiles representing key stakeholder groups. These personas included experienced interior designers, retail floor staff, and furniture showroom managers, each with distinct technological proficiencies and operational requirements. Accompanying these personas, the team developed comprehensive usage scenarios that mapped typical user journeys through the application, from initial room specification to final design presentation. This methodology provided crucial insights into user behavior patterns and expectations, directly informing the refinement of interface elements and interaction flows.

### 1.5 Storyboards

The development process incorporated detailed storyboarding techniques to visualize the complete user journey through the Room Planner application. These sequential narratives depicted key interaction scenarios, from initial user authentication to complex furniture manipulation and design finalization. The storyboards effectively illustrated the temporal flow of user interactions, highlighting critical decision points and potential areas for user experience enhancement. This visual storytelling approach proved particularly valuable in communicating design concepts to stakeholders and identifying opportunities for workflow optimization before implementation.

### 1.6 Mock Evaluations

Prior to full implementation, the development team conducted systematic mock evaluations of the Room Planner interface using interactive prototypes. These evaluations employed established usability testing methodologies, including task completion analysis and cognitive walkthrough sessions with representative users from the target demographic. The assessment criteria focused on core usability goals such as efficiency, learnability, and user satisfaction. Quantitative metrics were gathered regarding task completion times and error rates, while qualitative feedback was collected through structured interviews and observation sessions, providing valuable insights for subsequent interface refinements.

### 1.7 User Feedback

The development team implemented a structured data collection methodology utilizing Google Forms to gather comprehensive user feedback. This digital survey instrument was designed to capture both quantitative metrics and qualitative insights across various aspects of the application's functionality and user experience. The questionnaire encompassed Likert-scale ratings for interface usability, feature effectiveness, and overall satisfaction, complemented by open-ended response fields for detailed user observations. Statistical analysis of the collected data revealed significant patterns in user preferences and interaction behaviors, while thematic analysis of qualitative responses identified key areas for functionality enhancement and interface refinement.

### 1.8 Feedback and Updates

Based on the comprehensive analysis of user feedback data, the development team implemented strategic modifications to enhance the Room Planner application's functionality and user experience. Key improvements included the optimization of the 3D rendering pipeline to reduce latency, refinement of the furniture manipulation controls for increased precision, and enhancement of the color selection interface based on user interaction patterns. The iterative implementation of these updates was guided by continuous user testing and feedback loops, ensuring that each modification effectively addressed identified usability concerns while maintaining the application's core functionality and performance standards.

## 2. Methods and Technology

The Room Planner application was developed utilizing a modern technology stack, carefully selected to ensure optimal performance, maintainability, and user experience. At its foundation, the application employs Next.js 15.3.1, a robust React framework that facilitates server-side rendering and static site generation, significantly enhancing initial page load performance and search engine optimization capabilities. The user interface is constructed using React 19.1.0, leveraging its component-based architecture to create modular, reusable interface elements that maintain consistency throughout the application.

### 2.1 Platform and Architecture

The application's architecture follows a component-driven development approach, utilizing the Radix UI component library for foundational interface elements, ensuring accessibility compliance and consistent behavior across different browsers and devices. The styling implementation employs Tailwind CSS, enabling rapid development through utility-first CSS while maintaining a scalable and maintainable styling system. Three.js and React Three Fiber form the core of the 3D visualization engine, providing powerful WebGL capabilities for rendering and manipulating furniture models in real-time.

### 2.2 Implementation Details

Authentication and security features are implemented using industry-standard protocols, with bcrypt for password hashing and JSON Web Tokens (JWT) for secure session management. The persistence layer utilizes SQLite3 for data storage, chosen for its reliability and minimal configuration requirements. The application's state management is handled through React's Context API, providing a centralized store for room designs, user preferences, and application settings.

The 3D visualization system implements custom validators and controllers to ensure accurate furniture placement and manipulation. The RoomDesignValidator class enforces spatial constraints, preventing furniture placement outside room boundaries and ensuring valid room dimensions. Real-time model manipulation is achieved through custom hooks that interface with Three.js, providing smooth and responsive control over furniture positioning, rotation, and scaling.

### 2.3 Testing and Quality Assurance

The testing strategy employs Vitest, a modern testing framework optimized for Vite-based applications, providing rapid test execution and comprehensive coverage reporting. The test suite encompasses unit tests for core functionality, including room dimension validation, furniture manipulation, and color management. Mock evaluations and integration tests ensure the reliability of component interactions and data flow throughout the application.

Test coverage is monitored using the V8 coverage provider, generating detailed reports in multiple formats (text, JSON, and HTML) to facilitate thorough analysis of test coverage. The testing environment is configured to run in a Node.js context, enabling consistent and reproducible test execution across different development environments. Continuous integration practices ensure that all tests are executed automatically upon code changes, maintaining code quality and preventing regression issues.

## 3. Limitations

The Room Planner application has been developed to meet the requirements specified in Appendix A of the coursework. Below is a detailed analysis of the project's completion status against each objective, including implementation challenges and current limitations.

### 3.1 Project Completion Analysis

| Objective | % Completion | Comments |
|-----------|-------------|-----------|
| Customer can provide the size, shape and colour scheme for the room. | 95% | Successfully implemented room dimensioning with width, length, and height parameters. Color scheme selection uses HSL color picker for precise control. Shape limitations exist for non-rectangular rooms. |
| Customer can create a new design based on the room size, shape and colour scheme. | 90% | Robust design creation system implemented with automatic validation. Some edge cases in complex room configurations require additional handling. Real-time preview available during creation. |
| Customer can visualise the design in 2D. | 85% | 2D floor plan view implemented with accurate furniture placement and room boundaries. Additional features like measurements and annotations planned for future updates. |
| Customer can visualise the design in 3D. | 95% | Full 3D visualization using Three.js with camera controls and lighting. High-performance rendering with optimized model loading. Some complex shadow calculations need refinement. |
| Customer can scale the design to best fit the room. | 90% | Implemented precise scaling controls with numerical input and slider options. Automatic collision detection prevents invalid scaling. Group scaling functionality pending. |
| Customer can add shade to the design as a whole or selected parts. | 80% | Basic shading implementation complete with adjustable intensity. Advanced features like custom shadow mapping and ambient occlusion planned for future updates. |
| Customer can change the colour of the design as a whole or selected parts. | 100% | Fully implemented color management system using HSL color space. Supports both individual and group color changes with real-time preview. |
| Customer can edit/delete the design. | 95% | Comprehensive edit capabilities including undo/redo functionality. Bulk operations for multiple furniture items implemented. Some complex edit operations need optimization. |
| Customer can save the design. | 100% | Robust save system implemented with automatic backup. Designs are persisted in SQLite database with user authentication. Export functionality to common 3D formats available. |

### 3.2 Technical Limitations

While the application successfully implements most required features, several technical limitations have been identified:

1. Performance constraints with large numbers of high-polygon furniture models
2. Browser compatibility issues with certain WebGL features
3. Limited support for concurrent multi-user editing
4. Memory management challenges with extensive undo/redo history

These limitations are being addressed in ongoing development iterations, with planned improvements to enhance the application's capabilities and user experience.

