import { listenAndServe } from "https://deno.land/std@0.113.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.113.0/http/file_server.ts";
import * as path from "https://deno.land/std@0.113.0/path/mod.ts";
import { expandGlob } from "https://deno.land/std@0.113.0/fs/mod.ts";
import { parse } from "https://deno.land/std@0.113.0/encoding/yaml.ts";

console.log("http://localhost:8000/");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
};

const assetsDirectory = path.join(
  path.dirname(path.fromFileUrl(import.meta.url)),
  "assets",
);

listenAndServe(":8000", async (request) => {
  const requestUrl = new URL(request.url);
  const url = new URL(
    `${
      request.headers.has("host")
        ? `${request.headers.get("x-forwarded-proto") ?? "http"}://${
          request.headers.get("host")
        }`
        : requestUrl.origin
    }${requestUrl.href.slice(requestUrl.origin.length)}`,
  );
  console.log(`${request.method.toUpperCase()} ${url.pathname}`);

  if (url.pathname === "/query") {
    const extensions: any[] = [];

    for await (
      const entry of expandGlob("*.config.yml", { root: assetsDirectory })
    ) {
      extensions.push({
        scriptUrl: new URL(
          `/assets/${entry.name.replace(/\.config\.yml$/, ".js")}`,
          url,
        ).href,
        socketUrl: undefined,
        extensionPoints: (parse(await Deno.readTextFile(entry.path)) as {
          extension_points: any[];
        }).extension_points,
      });
    }

    return new Response(
      JSON.stringify({
        queryUrl: url.href,
        extensions,
      }),
      {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } else if (
    url.pathname.startsWith("/assets/") && url.pathname.endsWith(".js")
  ) {
    try {
      const response = await serveFile(
        request,
        path.join(assetsDirectory, url.pathname.replace("/assets/", "")),
      );

      response.headers.set("Cache-Control", "no-store");

      for (const [header, value] of Object.entries(CORS_HEADERS)) {
        response.headers.set(header, value);
      }

      return response;
    } catch {
      return new Response(null, { status: 404, headers: CORS_HEADERS });
    }
  } else {
    return new Response(null, { status: 404 });
  }
});
