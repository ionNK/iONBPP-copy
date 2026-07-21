# System Architecture & Conceptual Model

## 1. Conceptual Data Model

This diagram illustrates the core entities involved in the Promotion Engine and their relationships. It represents how a **Promotion** is composed of modular configurations for eligibility, rewards, scheduling, and presentation.

```mermaid
erDiagram
    PROMOTION ||--|| ELIGIBILITY_RULES : defines
    PROMOTION ||--|| REWARD_MECHANICS : grants
    PROMOTION ||--|| SCHEDULE_CONFIG : follows
    PROMOTION ||--|| DISPLAY_SETTINGS : rendered_as
    PROMOTION ||--o{ ANALYTICS_METRICS : generates

    ELIGIBILITY_RULES {
        string[] markets "e.g., KE, ET"
        string[] channels "e.g., Mobile, Web"
        string segment "Target Audience"
        object[] triggers "Events triggering promo"
    }

    REWARD_MECHANICS {
        string type "Cashback, Bonus, etc."
        string calculation_mode "Flat vs Tiered"
        object[] tiers "Payout levels"
        int wagering_requirement
    }

    SCHEDULE_CONFIG {
        datetime start_date
        datetime end_date
        boolean is_recurring
        object limits "Budget caps, Claims/user"
    }

    DISPLAY_SETTINGS {
        string title
        string teaser
        string banner_url
        string terms_conditions
        string[] badges
    }

    DISPLAY_SETTINGS ||--o{ COMM_CHANNEL : notifies_via

    COMM_CHANNEL {
        string type "SMS, Push"
        string template "Message Content"
        boolean enabled
    }
```

## 2. Technical Architecture

This diagram details the application structure, highlighting the separation between the User Interface (Next.js), State Management (React Context), and the Data/API Layer.

```mermaid
graph TD
    subgraph "Client Layer (Browser)"
        User[CRM Manager]
        LocalStorage[(Browser Storage)]
    end

    subgraph "Application Layer (Next.js)"
        Router[App Router]
        
        subgraph "Promotion Wizard Module"
            WizardCtx[<WizardContext> Provider]
            Orchestrator[CreatePromotionWizard.tsx]
            
            subgraph "Steps Components"
                Step1[Basics]
                Step2[Eligibility]
                Step4[Rewards]
                Step5[Schedule]
                Step6[Display & Preview]
                Step7[Review]
            end
        end
        
        Dashboard[Dashboard Pages]
    end

    subgraph "API Layer (Server-Side)"
        RouteHandler[POST /api/promotions/create]
        Validator[Data Validation]
        MockDB[Mock DB Logic]
    end

    %% Flows
    User -->|Interacts| Orchestrator
    Orchestrator -->|Reads/Writes| WizardCtx
    WizardCtx -->|State| Step1
    WizardCtx -->|State| Step2
    WizardCtx -->|State| Step6
    
    Step6 -->|Live Preview| User
    Step6 -->|Uploads Image| WizardCtx
    
    Orchestrator -->|Publish| RouteHandler
    RouteHandler -->|Validate| Validator
    Validator -->|Persist| MockDB
    
    Orchestrator -->|Sync State| LocalStorage
    Dashboard -->|Read History| LocalStorage
```

### Component Breakdown

1.  **WizardContext (State Container)**:
    *   Acts as the single source of truth for the promotion being created.
    *   Manages nested state objects (`basics`, `eligibility`, `rewards`, `schedule`, `display`).
    *   Provides updater functions to step components.

2.  **Step Components**:
    *   **Isolated Logic**: Each step handles its own validation and UI logic (e.g., `Step6Display` handles image previews internally before updating Global State).
    *   **Step6Display (Dual Preview)**: Contains logic to render both Mobile and Web visualizations in real-time based on the Context data.

3.  **Data Persistence**:
    *   **Transitory**: `WizardContext` holds data while editing.
    *   **Persistent (Prototype)**: `LocalStorage` ('saved_promotions') acts as the client-side database to persist created promotions across reloads.
    *   **Backend (Mock)**: The API route simulates a server transaction, enforcing delays and basic validation to mimic a real production environment.
