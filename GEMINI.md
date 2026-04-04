# ⚡ Zenith: The Premium SvelteKit Vibe

**Current Context:** Tuesday, February 10, 2026
**Project Name:** Zenith (Boilerplate Auth Svelte)
**Mission:** Ship premium SaaS applications with speed and extreme visual quality.

## 💎 The "Zenith" Aesthetic (Vibe Coding)

*   **Visual Identity:** Modern, clean, and trustworthy. Think "Linear-style" but for Svelte.
*   **Scale & Spacing:** Use ample whitespace. Avoid dense, cluttered UIs. Use `gap-6` or `gap-8` for sections.
*   **Typography:** Hierarchy is king. Use font weights (black, bold, medium, normal) to create contrast.
*   **Color Palette:** Strictly adhere to Shadcn/Tailwind theme variables (`bg-primary`, `text-muted-foreground`). **NEVER** hardcode hex values.
    *   *Good:* `bg-primary/10 text-primary`
    *   *Bad:* `bg-blue-50 text-blue-600`
*   **Interactive Elements:**
    *   Buttons: `rounded-full` or `rounded-2xl` for a modern feel.
    *   Cards: Subtle borders (`border-border/60`), soft shadows (`shadow-xl`), and gentle hover effects (`hover:scale-[1.02]`).
    *   Gradients: Use subtle background gradients to add depth, not distraction.

## 🛠 Tech Stack & Strict Conventions

### 1. Framework: SvelteKit (Svelte 5)
*   **Runes Only:** Use `$state`, `$props`, `$derived`, `$effect`. **DO NOT** use legacy `export let` or `$:`.
*   **Snippets:** Use `{@render children()}` and snippets over slots.

### 2. Styling: Tailwind CSS v4
*   **Configuration:** 0-config. Use `@theme inline` in `app.css` if absolutely necessary.
*   **Opacity:** Use slash notation: `bg-black/50` (NOT `bg-opacity-50`).
*   **Animation:** Use `tailwindcss-animate` utilities (`animate-in`, `fade-in`, `slide-in-from-bottom`).

### 3. Internationalization: Paraglide JS
*   **Source of Truth:** `messages/en.json` (English), `messages/fr.json` (French).
*   **Usage Pattern:**
    *   Import: `import * as m from "$lib/paraglide/messages";`
    *   **CRITICAL RULE:** Keys are strings, accessed via brackets, and **CALLED AS FUNCTIONS**.
    *   ✅ Correct: `{m["homepage.title"]()}`
    *   ❌ Wrong: `{m.homepage_title}` or `{m["homepage.title"]}` (without parens)

### 4. Authentication: Better Auth
*   **Client:** `import { authClient } from "$lib/auth-client";`
*   **Server:** `event.locals.session` and `event.locals.user` in `+page.server.ts`.
*   **Methods:** Magic Link, Google, Apple (configured in `auth.ts`).

### 5. Database: Drizzle ORM
*   **Driver:** `postgres` (via Docker/Supabase/Neon).
*   **Schema:** `src/lib/server/db/schema.ts`.
*   **Access:** Direct DB calls in `load` functions or actions.

## 📂 Key File Structure

*   `src/lib/server/auth.ts`: Auth configuration (plugins, adapters).
*   `src/routes/+layout.svelte`: Global providers (Toaster, Paraglide, ModeWatcher).
*   `messages/`: Translation keys. **Check this before adding new text.**
*   `src/lib/components/ui/`: Shadcn components. **Reuse these.**

## 🚀 Development Workflow

1.  **UI Changes:**
    *   Check `messages/en.json` for existing text.
    *   If new text is needed, add to `en.json` AND `fr.json`.
    *   Implement in `.svelte` file using `m["key"]()`.
2.  **Database Changes:**
    *   Modify `schema.ts`.
    *   Run `npm run db:generate` then `npm run db:push` (local) or `db:migrate` (prod).
3.  **Auth Changes:**
    *   If changing auth config, run `npm run auth:schema` to update the database schema.

## ⛔ Anti-Patterns (Do Not Do)

*   Do not use standard HTML elements (`<button>`) when a UI component (`<Button>`) exists.
*   Do not create new CSS files. Use Tailwind utility classes.
*   Do not leave "TODO" comments without implementing the solution if it's within scope.
*   Do not hardcode English text in components. Always use Paraglide.