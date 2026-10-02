function base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
  
    let binary = "";
  
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
  
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  export function generateCodeVerifier(length = 64): string {
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
  
    return Array.from(randomValues)
      .map((value) => possible[value % possible.length])
      .join("");
  }
  
  export async function generateCodeChallenge(
    codeVerifier: string
  ): Promise<string> {
    const data = new TextEncoder().encode(codeVerifier);
  
    const digest = await crypto.subtle.digest(
      "SHA-256",
      data
    );
  
    return base64UrlEncode(digest);
  }