import { exec } from "child_process";
import dotenv from "dotenv";

import { stdin as input, stdout as output } from "process";
import readline from "readline/promises";

const envFiles = [
  ".env",
  ".env.local",
  `.env.${process.env.NODE_ENV === "production" ? "production" : "development"}`,
];
dotenv.config({ path: envFiles });

const accessToken = process.env.GITHUB_TOKEN ?? "";
if (accessToken.length === 0) {
  console.error("⚠️ GITHUB_TOKEN is not defined");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });

const shouldExit = (value) => {
  const v = value.trim().toLowerCase();
  return v === "q" || v === "quit";
};
const safeExit = () => {
  rl.close();
  process.exit(0);
};

const ask = async (q) => {
  try {
    const answer = await rl.question(`${q} ['q'/'quit' to exit]: `);

    if (shouldExit(answer)) safeExit();
    return answer.trim();
  } catch (error) {
    if (error.name === "AbortError") safeExit();
    throw error;
  }
};

const repo = await ask("Repository (owner/repo)");
const lang = await ask("Language (en/ko)");

rl.close();

const labelFile = `${lang}_labels.json`;

exec(
  `pnpm github-label-sync --access-token ${accessToken} --labels ${labelFile} ${repo}`,
  (error, _, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`❌ Stderr: ${stderr}`);
      return;
    }

    console.log("✅ Synchronized successfully!");
  },
);
