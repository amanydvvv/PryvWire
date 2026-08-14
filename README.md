# PryvWire

An ultra-low-latency, zero-retention PII sanitization middleware and secure LLM routing gateway.

### Core Capabilities
- **Sub-50ms Named Entity Recognition (NER):** Intercepts and redacts sensitive entities (Names, Emails, Phone Numbers, SSNs) using Microsoft Presidio and Spacy before dispatching payloads to external LLM providers (Groq LLaMA 3.1).
- **Zero-Retention Compliance:** Enforces a strict fail-closed architecture with zero persistent storage of raw personal data.
- **Asynchronous Audit Telemetry:** Tracks interception counts, latency, and entity metadata via background tasks and SQLAlchemy ORM.
- **Minimalist Developer Console:** High-contrast React dashboard with live telemetry and visual threat badges.
