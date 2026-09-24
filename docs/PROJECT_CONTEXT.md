# Project Context — AI Interview Prep Kit (Trao Assessment)

## Overview
The AI Interview Prep Kit is a full-stack web application and batch CLI pipeline that transforms a job description (JD), company website URL, and target preparation duration (days until interview) into a personalized, structured interview preparation kit.

## Key Capabilities
- **Authentication**: User registration, login, logout, and isolated ownership of kits.
- **Input & Retrieval**: Crawling company website for about/hiring pages, searching public interview discussions, with rate-limiting, error recovery, and SSRF defense.
- **Requirement Extraction**: Structured parsing of JD into `must` / `nice` priority requirements across `technical`, `behavioural`, and `domain` kinds.
- **Multi-Stage Pipeline**: Modular execution (Extraction -> Research -> Question Gen -> Flashcard Gen -> Coverage Check -> Gap Gen -> Deterministic Scheduling).
- **Deterministic Invariants**: Gap analysis, pass limits, stable ID generation, schedule allocation, and schema compliance are executed deterministically in application code, NOT by the LLM.
- **Second-Pass Coverage Loop**: Bounded 2-pass generation ensuring 100% coverage of `must` requirements.
- **Reshapeable Builder**: Granular editing, adding/deleting questions/cards, reordering, category moving, and single-section regeneration that strictly preserves user edits.
- **Practice Mode**: Confidence-weighted flashcard review tracking covered/uncovered status.
- **Batch Entry Point**: Mandatory `npm run evaluate -- --input <cases.json> --output <kits.json>` supporting parallel processing, failure isolation, and local URLs.
