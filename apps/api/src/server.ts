import "dotenv/config";

import cors from "cors";
import express from "express";
import { readFile } from "node:fs/promises";
import { importPKCS8, SignJWT } from "jose";

const app = express();

const port = Number(process.env.PORT ?? 3001);

const APPLE_MUSIC_API_URL =
  "https://api.music.apple.com/v1";

app.use(
  cors({
    origin: "http://127.0.0.1:5173",
  })
);

app.use(express.json());

async function createAppleDeveloperToken() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKeyPath =
    process.env.APPLE_PRIVATE_KEY_PATH;

  if (!teamId) {
    throw new Error("Missing APPLE_TEAM_ID");
  }

  if (!keyId) {
    throw new Error("Missing APPLE_KEY_ID");
  }

  if (!privateKeyPath) {
    throw new Error(
      "Missing APPLE_PRIVATE_KEY_PATH"
    );
  }

  const privateKeyPem = await readFile(
    privateKeyPath,
    "utf8"
  );

  const privateKey = await importPKCS8(
    privateKeyPem,
    "ES256"
  );

  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({
      alg: "ES256",
      kid: keyId,
    })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60)
    .sign(privateKey);
}

async function appleMusicRequest<T>(
  endpoint: string
): Promise<T> {
  const token =
    await createAppleDeveloperToken();

  const response = await fetch(
    `${APPLE_MUSIC_API_URL}${endpoint}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Apple Music API request failed (${response.status}): ${body}`
    );
  }

  return response.json() as Promise<T>;
}

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "playlist-bridge-api",
  });
});

app.get(
  "/api/apple/developer-token",
  async (_request, response) => {
    try {
      const token =
        await createAppleDeveloperToken();

      response.json({ token });
    } catch (error) {
      console.error(
        "Failed to create Apple developer token:",
        error
      );

      response.status(500).json({
        error:
          "Failed to create Apple developer token.",
      });
    }
  }
);

app.get(
  "/api/apple/test",
  async (_request, response) => {
    try {
      const result =
        await appleMusicRequest(
          "/catalog/fr/search?term=Linkin%20Park&types=songs&limit=5"
        );

      response.json(result);
    } catch (error) {
      console.error(
        "Apple Music API test failed:",
        error
      );

      response.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Apple Music API test failed.",
      });
    }
  }
);

app.get(
  "/api/apple/search",
  async (request, response) => {
    try {
      const term = request.query.term;

      if (
        typeof term !== "string" ||
        term.trim().length === 0
      ) {
        response.status(400).json({
          error: "Missing search term.",
        });
        return;
      }

      const params = new URLSearchParams({
        term: term.trim(),
        types: "songs",
        limit: "10",
      });

      const result =
        await appleMusicRequest(
          `/catalog/fr/search?${params.toString()}`
        );

      response.json(result);
    } catch (error) {
      console.error(
        "Apple Music search failed:",
        error
      );

      response.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Apple Music search failed.",
      });
    }
  }
);

app.listen(port, "127.0.0.1", () => {
  console.log(
    `PlaylistBridge API running on http://127.0.0.1:${port}`
  );
});