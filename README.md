# Axis code test

## Anatolii's comments

### What's done

Both tasks are implemented and working. Beyond the stated objectives I also added:

- **Create camera** — register a new camera into the shared pool, then assign it to yourself
- **Error handling** — all mutations surface GraphQL errors inline; buttons disable while in-flight
- **Basic input validation** — required fields checked before submit, error shown on the field
- **22 automated tests** — backend API tests (real HTTP through yoga) + frontend behaviour tests (React Testing Library)
- A few security fixes that were missing from the scaffold: `addCamera` was unauthenticated, `removeCameraFromUser` had no ownership check, logout left stale data in the urql cache

### How to run

```
npm install
npm run dev        # starts backend :4000 + frontend :5173 concurrently
```

Log in as `alice / password` or `bob / password`. GraphQL playground at http://localhost:4000/graphql.

### What I'd add with more time

- More complete test coverage (integration tests, edge cases)
- Better UI polish — responsive layout, loading skeletons, confirmation before removing a camera
- Stricter input validation (IP address format, duplicate name detection)
- Proper auth — hashed passwords, JWT with expiry; right now tokens and data live in memory and reset on restart
- Per-resource ownership — currently any user can assign any camera to themselves

### Gotchas

- All data is in-memory. Restarting the backend resets everything.

### Use of AI

I used Claude as a coding assistant throughout this assignment. The extent of use was substantial: I directed the work — deciding what to build, how to structure it, and what trade-offs to make — while   
Claude generated most of the implementation code based on those directions.

Concretely, Claude wrote the GraphQL type definitions, resolvers, auth layer, and the React frontend components. I reviewed each piece, caught issues, and steered decisions around architecture, error handling, and test strategy.

I however do own the delivered output, understand, could explain, extend, or debug any part of it.


=====================================    _End of Anatolii's comments_    ========================================

## Getting started

This is a monorepo with two packages, backend and frontend, using npm workspaces. Easiest way to get started with the test is to fork this repo do the tasks there. When you're done send us a link to your fork.

If you run into any issues or have questions don't hesitate to contact the technical interviewer.

### Tools

- NodeJS
- GitHub

### Start dev enviroment

1. `npm install`
2. `npm run dev` to start both backend and frontend.
3. Access GraphQL-devtool on http://localhost:4000/graphql

## Task 1: Extending the GraphQL Server with more types

### Objectives

- Extend the existing GraphQL server to map Users to specific Cameras.
  - Keep in mind that you should be able to log in using a User in Task 2.
- Add functionality to add a camera to a User
- Add functionality to remove a camera from a User

## Task 2: Create a React app that consumes the previous GraphQL-API

### Requirements

- React
- Typescript
- Fluent UI v9

### Objective

Create a React app in the "frontend"-package that displays all cameras related to the currently logged in user. Use the API you've extended in task 1.
