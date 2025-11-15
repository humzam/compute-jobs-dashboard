## AI Approach


1. My first task was to extract out a core requirements spec document out of the PDF I was given for this project. I didn't want to simply dump the whole PDF and try letting it consume it all (especially since there's things not relevant to the initial build, and stretch goals we don't need to tackle initially.)
  a) Its known that AIs do well with consuming markdown, so I copied out the requirements from the PDF and asked ChatGPT to create an AI-friendly version in markdown, to make it easier for the AI to consume when it comes time to build. See this file at `./ai/job_dashboard_spec.md`.
  b) Note: Even this simple task took a few tries with ChatGPT to get the nicely prepared formatting I was after. The key lesson here is: don't trust with AI spits out. Its best practice to verify at each stage, before you get too far with some unusable slop. 

Prompt (ChatGPT 5):
> Please take this raw text representing the core requirements for my application, and transform into a AI-friendly spec to consume in markdown format.

2. I am using Claude Opus for planning the work, and Claude Sonnet for implementation. This is because Opus is known for its reasoning, deep-thinking capability and Sonnet is more of a work-horse coding agent, better for debugging, iteration, and chatting. So next I created 2 carefully crafted system prompts, to tailor each AI towards being an expert engineer in the area we are working on for this project. I didn't create this by hand either, I used an AI (ChatGPT 5.1) to do so. I created one for Opus at `./ai/opus_system_prompt.md` and one for Sonnet at `./ai/sonnet_system_prompt.md`.

Prompt (ChatGPT 5): 
> I'm using Claude Opus for design and Claude Sonnet for implementation of my Django/React/Postgres project. Please create system prompt files for each of these models for my Django/React project.

3. I switched to Claude Opus and pasted in my Opus System Prompt. Then, I prompted Opus with:
Prompt (Claude Opus)
> Generate the full architecture and implementation plan for my Django + React Job Dashboard app. Reference the spec file at `./ai/job_dashboard_spec.md`. Save your output into markdown files under the `./ai` directory. The implementation roadmap is for another AI to use. Please generate the implementation roadmap, using numbered milestones that is consumable for an AI.

4. Once that was completed and I verified it, I switched back to Claude Sonnet for coding. AIs can get overwhelmed with too much context and requests given at once. For that reason, I do not want to prompt the AI to build the whole app in a single shot. Rather, I will leverage the milestones created in the `implementation-roadmap.md` and prompt it to tackle 1 at a time. This is more work for me obviously, but it will ensure higher quality code as the context window won't get overloaded with looking at or editing too many files at once. Its also easier to verify for me, and easier to iterate on individual stages. 

Prompt (Claude Sonnet):
> [Paste in Sonnet system prompt]
> Implement Milestone #1
(Once complete, I tested with a docker compose command, which failed)
> [Pasted docker compose error and let AI fix it]
> [Pasted a new Dockerfile error and let AI fix it]
(At this point, another Docker error so I figured something gone wrong during Docker implementation)
> Please re-review all the Docker setup you've done, and ensure it makes sense. 
(Confirmed that docker compose works)