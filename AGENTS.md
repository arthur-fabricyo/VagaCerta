# VagaCerta contributor instructions

These conventions apply to new code and to code being refactored throughout the repository.

## Language

- Write code and technical identifiers in English. This includes entities, database models and fields, backend route paths, request and response fields, filenames, classes, methods, variables, tests, and code comments.
- Keep user-facing copy in the language required by the feature.
- When renaming existing routes or database fields, plan for current callers and persisted data. Include the migrations or compatibility changes needed for the rename.

## Backend architecture

Use MVC with separate controller, service, and repository layers. Dependencies flow from controller to service to repository.

- **Controller** handles the HTTP boundary. Validate request input, call the service, and map the result to a response. Next.js Route Handlers serve as the controller entry points.
- **Service** owns use cases and business rules. It coordinates repositories and returns domain results for the controller to translate into HTTP responses.
- **Repository** owns persistence and queries. Keep Prisma and SQL access in this layer and expose operations that express what the service needs.

## Code quality and object-oriented design

- Follow Clean Code and SOLID. Use descriptive names, focused methods, and classes with a single responsibility and cohesive behavior.
- When creating classes, encapsulate their state and behavior. Pass dependencies through constructors when a class needs them, and introduce interfaces where they establish a meaningful boundary.
- Prefer composition when combining behaviors. Use inheritance where the subclass can honor the full contract of its parent.
- Keep pure logic in functions when a class would add no state or behavior to encapsulate.
