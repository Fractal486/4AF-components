import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

export const dynamic = "force-static";

// Export the index once; Fumadocs searches it in the browser.
export const { staticGET: GET } = createFromSource(source);
