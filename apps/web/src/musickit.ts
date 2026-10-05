export interface MusicKitInstance {
  authorize(): Promise<string>;
  unauthorize(): Promise<void>;

  api: {
    music(
      path: string,
      queryParameters?: Record<
        string,
        string | number | string[]
      >,
      options?: {
        fetchOptions?: RequestInit;
      }
    ): Promise<unknown>;
  };
}

interface MusicKitGlobal {
  configure(configuration: {
    developerToken: string;
    app: {
      name: string;
      build: string;
    };
  }): Promise<MusicKitInstance>;

  getInstance(): MusicKitInstance;
}

declare global {
  interface Window {
    MusicKit?: MusicKitGlobal;
  }
}

const API_URL = "http://127.0.0.1:3001";

async function waitForMusicKit(): Promise<MusicKitGlobal> {
  if (window.MusicKit) {
    return window.MusicKit;
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener(
        "musickitloaded",
        handleLoaded
      );

      reject(
        new Error(
          "MusicKit JS did not load."
        )
      );
    }, 10_000);

    function handleLoaded() {
      window.clearTimeout(timeout);

      if (!window.MusicKit) {
        reject(
          new Error(
            "MusicKit loaded but is unavailable."
          )
        );

        return;
      }

      resolve(window.MusicKit);
    }

    window.addEventListener(
      "musickitloaded",
      handleLoaded,
      {
        once: true,
      }
    );
  });
}

async function getAppleDeveloperToken(): Promise<string> {
  const response = await fetch(
    `${API_URL}/api/apple/developer-token`
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Failed to get Apple developer token (${response.status}): ${body}`
    );
  }

  const data = (await response.json()) as {
    token?: string;
  };

  if (!data.token) {
    throw new Error(
      "Apple developer token is missing."
    );
  }

  return data.token;
}

let musicKitInstance:
  | MusicKitInstance
  | null = null;

export async function getMusicKit(): Promise<MusicKitInstance> {
  if (musicKitInstance) {
    return musicKitInstance;
  }

  const MusicKit =
    await waitForMusicKit();

  const developerToken =
    await getAppleDeveloperToken();

  musicKitInstance =
    await MusicKit.configure({
      developerToken,

      app: {
        name: "PlaylistBridge",
        build: "1.0.0",
      },
    });

  return musicKitInstance;
}

export async function authorizeAppleMusic(): Promise<{
  musicKit: MusicKitInstance;
  musicUserToken: string;
}> {
  const musicKit =
    await getMusicKit();

  const musicUserToken =
    await musicKit.authorize();

  if (!musicUserToken) {
    throw new Error(
      "Apple Music authorization did not return a Music User Token."
    );
  }

  return {
    musicKit,
    musicUserToken,
  };
}