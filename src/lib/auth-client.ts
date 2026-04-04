import { createAuthClient } from "better-auth/svelte";
import { magicLinkClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
    plugins: [
        magicLinkClient(),
        lastLoginMethodClient(),
        stripeClient()
    ]
});
