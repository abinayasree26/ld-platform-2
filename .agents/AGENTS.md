# Workspace Architectural Rules & Directives

## User Roles Scope
- The application supports **ONLY TWO ROLES**:
  1. **Admin** (`super_admin`, `admin`, `school_admin`)
  2. **Student** (`student`)
- Do NOT include, mention, or render Teacher or Parent roles in UI navigation bars, labels, filters, or documentation.

## AI Engine Model
- The platform uses **Gemma** on-device AI model exclusively for student chat assistance.
- Do NOT use or reference Anthropic Claude AI keys or APIs.
