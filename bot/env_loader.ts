/**
 * Environment variable loader from .env file
 */

/**
 * Get the .env file path relative to project root
 * Works whether called from bot/ folder or project root
 */
function getEnvFilePath(): string {
  // Try project root first (when running from project root)
  const rootPath = ".env";
  try {
    Deno.statSync(rootPath);
    return rootPath;
  } catch {
    // If not found, try from bot folder perspective
    return "../.env";
  }
}

/**
 * Load environment variables from .env file
 */
export function loadEnvFile(): void {
  const envFilePath = getEnvFilePath();
  
  try {
    const envContent = Deno.readTextFileSync(envFilePath);
    const lines = envContent.split("\n");

    for (const line of lines) {
      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Parse KEY=VALUE format
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Only set if not already in environment (env vars take precedence)
      if (!Deno.env.get(key)) {
        Deno.env.set(key, value);
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(`⚠️  .env file not found at ${envFilePath}`);
      console.warn("   Using environment variables only.");
    } else {
      console.error(`❌ Error loading .env file: ${error}`);
    }
  }
}

