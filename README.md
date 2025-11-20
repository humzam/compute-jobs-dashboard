# Compute Jobs Dashboard

[![CI](https://img.shields.io/github/actions/workflow/status/humzam/job-dashboard/job-dashboard-ci.yaml?branch=main&style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/humzam/job-dashboard/actions/workflows/job-dashboard-ci.yaml)

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

A computational job management system built with React and Django.

## 🌐 Live Demo

**🚀 View Live Application → [humzashouldgetthisjob.com](https://humzashouldgetthisjob.com)**

The application is deployed in production with:
- ✅ HTTPS/SSL encryption (Let's Encrypt)
- ✅ Custom domain with DNS configuration  
- ✅ Docker containerization
- ✅ Nginx reverse proxy
- ✅ PostgreSQL database with seeded data

For more details on things like API endpoints, other helpful Makefile targets, or debugging help, please see: [DOCUMENTATION.md](DOCUMENTATION.md).

<img width="1264" height="895" alt="Screenshot 2025-11-18 at 3 09 26 PM" src="https://github.com/user-attachments/assets/f76579be-bd61-47a8-92f3-88e364707d89" />


## 👇 Prerequisites

- Docker
- Docker Compose v2
- Make
- Bash

## 📝 Quick Start

```bash
# Build the Docker images
make build

# Start the application
make up

# (optional) Seed the database with test data
make seed

# Run E2E tests (playwright)
make test

# Stop the application
make stop

# Clean up containers and volumes
make clean
```

## 🧑‍💻 Development

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 🧪 Testing

The test suite includes 6 E2E tests covering critical user flows:
- Job creation and management
- Status updates
- Basic functionality

Tests run in isolated Docker containers with mocked APIs.

## ⚡ Performance Considerations

### Docker Optimization
- **Multi-stage builds**: Separate development and production Docker images to minimize production footprint
- **Layer caching**: Optimized Dockerfile layer ordering for faster rebuilds
- **Health checks**: Implemented container health checks for reliable service startup and monitoring

### Testing Performance
- **Isolated E2E tests**: Tests run in dedicated containers with API mocking to eliminate backend dependencies
- **Containerized testing**: Complete test isolation using Docker profiles for consistent, reproducible results

### Frontend Optimization
- **Vite development server**: Fast HMR and optimized bundling for development
- **Docker networking**: Configured allowedHosts for efficient container-to-container communication
- **Static asset serving**: Production setup uses Nginx for optimized static file delivery

### Database Performance
- **Connection pooling**: PostgreSQL configured with appropriate connection limits
- **Health monitoring**: Database health checks prevent premature application startup
- **Volume persistence**: Optimized data storage with named Docker volumes

## ✨ Prompt Engineering Writeup

Almost all the code generated in this repo was written with the help of AI agents. In total, **this project took me about ~4.5 hours**, start to finish.

### 1. Requirements Extraction

My first task was to extract out a core requirements spec document out of the PDF I was given for this project. I didn't want to simply dump the whole PDF and try letting it consume it all (especially since there's things not relevant to the initial build, and stretch goals we don't need to tackle initially.)

- **a)** Its known that AIs do well with consuming markdown, so I copied out the requirements from the PDF and asked ChatGPT to create an AI-friendly version in markdown, to make it easier for the AI to consume when it comes time to build. See this file at [./ai/job_dashboard_spec.md](./ai/job_dashboard_spec.md).

- **b)** Even this simple task took a few tries with ChatGPT to get the nicely prepared formatting I was after. The key lesson here, which is a reoccurring theme: don't trust what AI spits out. Its best practice to verify at each stage, before you get too far with some unusable slop.

**Prompt (ChatGPT 5):**
> Please take this raw text representing the core requirements for my application, and transform into a AI-friendly spec to consume in markdown format.

### 2. System Prompt Creation

I am using Claude Opus for planning the architecture, and Claude Sonnet for implementation. This is because Opus is known for its reasoning and deep-thinking capability. Sonnet is more of a work-horse coding agent, better for debugging, iteration, and chatting about code tweaks (and much less pricey!). 

Next, I created 2 carefully crafted system prompts, to tailor each AI towards being an expert engineer in the area we are working on for this project. I didn't create this by hand either, I used an AI (ChatGPT 5.1) to do so. I created one for Opus at [./ai/opus_system_prompt.md](./ai/opus_system_prompt.md) and one for Sonnet at [./ai/sonnet_system_prompt.md](./ai/sonnet_system_prompt.md).

**Prompt (ChatGPT 5):**
> I'm using Claude Opus for design and Claude Sonnet for implementation of my Django/React/Postgres project. Please create system prompt files for each of these models for my Django/React project.

### 3. Architecture Planning

I switched to Claude Opus and pasted in my Opus System Prompt. Then, I prompted Opus with:

**Prompt (Claude Opus):**
> Generate the full architecture and implementation plan for my Django + React Job Dashboard app. Reference the spec file at [./ai/job_dashboard_spec.md](./ai/job_dashboard_spec.md). Save your output into markdown files under the `./ai` directory. The implementation roadmap is for another AI to use. Please generate the implementation roadmap, using numbered milestones that is consumable for an AI.

### 4. Milestone-Based Implementation

Once that was completed and I verified the plan looked roughly right, I switched back to Claude Sonnet for coding. AIs can get overwhelmed with too much context and requests given at once. For that reason, I do not want to prompt the AI to build the whole app in a single shot. 

Rather, I will leverage the intentionally milestones created in the [./ai/implementation-roadmap.md](ai/implementation-roadmap.md) and prompt it to tackle those, 1 at a time. This is much more time-consuming for me obviously, but it will ensure higher quality code as the context window won't get overloaded with looking at or editing too many files at once. Its also easier to verify for me, and easier for the AI agent to iterate on individual stages.

**Prompt (Claude Sonnet):**
> [Paste in Sonnet system prompt]

> Implement Milestone #1

**(Milestone 1 allegedly done)**
> How can I test this myself locally?

**(Was told to use docker compose with some flags)**
> [I found a docker compose error and let AI fix it]

**(Agent updated some code)**
> [I found a new Dockerfile error and let AI fix it]

**(At this point, another Docker error surfaced so I figured something had gone wrong during Docker implementation. Lets take a step back and have the the Agent revist all of its work at this stage and verify itself)**
> Please re-review all the Docker setup you've done, ensure it makes sense, and ensure it passes any appropriate tests at this stage.

**(Magically, now I could confirm that docker compose works)**
> Implement Milestone #2

**(rinse and repeat the above cycle)**
