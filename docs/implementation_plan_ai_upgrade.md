# AI Assistant Upgrade Plan: From Mock to Intelligent Agent

## 1. Problem Diagnosis
The current implementation utilizes naive string matching:
```javascript
if (input.includes('promotion')) return help_create_promotion;
```
**Issue:** This approach lacks *specificity*. A user asking "How to **edit** a promotion" triggers the "promotion" keyword but gets the "create" answer because the logic doesn't weigh "edit" significantly.

## 2. Solution Architecture

We will implement a client-side **Intent Recognition System** and a **Global Context Provider**.

### Phase 1: Intelligent Intent Engine (The Brain)
Instead of `if/else`, we will use a **Scored Keyword Matching** system.

**Data Structure:**
```typescript
type Intent = {
  id: string;
  keywords: { word: string; weight: number }[]; // 'edit': 5, 'promotion': 2
  required?: string[]; // Must respond to 'how' or 'where'
  response: string | (context: any) => string;
}
```

**Logic:**
1. Tokenize user input.
2. Score input against all defined Intents.
3. If `Score > Threshold`, return the best match.
4. If `Score < Threshold`, return a fallback/clarification ("I'm not sure, did you mean...?").

### Phase 2: System-Wide Availability (The Body)
The AI should not live in `Settings`. It should be a global companion.

**Implementation:**
1. **`AIProvider`**: A React Context to hold `chatHistory`, `isOpen`, and `minimize/maximize` state.
2. **`GlobalAssistantWidget`**: A floating component (bottom-right) rendered in the main `layout.tsx`.
3. **Persistance**: Save history to `localStorage` so the chat doesn't clear on page reload.

### Phase 3: Context Injection (The Awareness)
The AI needs to know "Where am I?".

**Logic:**
1. Hook into `usePathname()` from Next.js.
2. When the user opens the chat, inject a system prompt: `User is currently on ${pageName}`.
3. If the user asks "What do I do here?", the AI uses the Page ID to look up page-specific help.

## 3. Implementation Roadmap

| Step | Task | Complexity | Description |
|------|------|------------|-------------|
| **1** | **Refine Logic** | Low | Replace nested `if/else` in `SupportCenter.tsx` with a `ResponseEngine.ts` utility that handles "Edit vs Create". |
| **2** | **Global Context** | Medium | Create `src/context/AIContext.tsx` and wrap the app. |
| **3** | **Floating UI** | Medium | Create `GlobalChatWidget.tsx` and add to `RootLayout`. |
| **4** | **Page Context** | High | Map routes to "Page Descriptions" for the AI to reference. |

## 4. Immediate Next Step
I recommend starting with **Step 1 (Refining Logic)** to fix the current broken experience in the Settings page, then moving to **Step 2 & 3** to make it global.
