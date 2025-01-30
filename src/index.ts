/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { build } from "tsup";
import { Config } from "./config";
import { Readable } from "stream";
import { obfuscate } from "javascript-obfuscator";
import { globSync } from "glob";
import fs from "fs";
import path from "path";

function bundleBot(config: Config): Readable {
  const stream = new Readable({
    read() {},
  });

  if (config.files.length === 0) {
    stream.emit("error", new Error("No files to bundle"));
    return stream;
  }

  stream.emit("step", { id: "bundle", status: "start" });
  build({
    format: config.format || ["cjs"],
    outDir: config.dist || "dist",
    silent: config.log !== "debug",
    clean: config.clean || true,
    entryPoints: config.files,
    minify: config.minify || false,
  })
    .then(() => {
      stream.emit("step", { id: "bundle", status: "done" });
      if (config.obfuscation || typeof config.obfuscation === "object") {
        stream.emit("step", { id: "obfuscation", status: "start" });
        for (const file of globSync(`${config.dist || "dist"}/**/*.js`)) {
          const code = fs.readFileSync(file, "utf-8");
          const obfuscated = obfuscate(code, {
            target: "node",
            compact: true,
            controlFlowFlattening: true,
            stringArray: true,
            stringArrayThreshold: 1,
            stringArrayEncoding: ["rc4"],
            simplify: true,
          });
          fs.writeFileSync(file, obfuscated.getObfuscatedCode());

          // TODO: Finish implementing obfuscated file handling (only match with regex)

          //   const rex = [
          //     new RegExp(
          //       `^${config.dist || "dist"}[\\/]+interactions[\\/]+commands[\\/]+[a-z]+[\\/]+[a-z]+\\.js$`,
          //       "gm",
          //     ),
          //     new RegExp(
          //       `^${config.dist || "dist"}[\\/]+interactions[\\/]+buttons[\\/]+.*\\.js$`,
          //       "gm",
          //     ),
          //     new RegExp(
          //       `^${config.dist || "dist"}[\\/]+interactions[\\/]+modals[\\/]+.*\\.js$`,
          //       "gm",
          //     ),
          //     new RegExp(
          //       `^${config.dist || "dist"}[\\/]+interactions[\\/]+selects[\\/]+.*\\.js$`,
          //       "gm",
          //     ),
          //   ];

          //   if (rex.some((r) => r.test(file))) {
          //     console.log("renaming");
          //     const rdmName = Math.random().toString(36).substring(7);
          //     const newFileName = file.replace(
          //       path.basename(file),
          //       `${rdmName}.js`,
          //     );
          //     fs.renameSync(file, newFileName);
          //   }

          if (config.log === "extend")
            stream.emit("step", { id: "obfuscation", status: "work", file });
        }

        stream.emit("step", { id: "obfuscation", status: "done" });
      }
      if (config.artefact) {
        for (const art of config.artefact) {
          stream.emit("step", { id: "artefact", status: "start" });
          if (!fs.existsSync(art)) continue;
          fs.copyFileSync(
            art,
            `${config.dist || "dist"}/${art.replaceAll("src/", "")}`,
          );

          if (config.log === "extend")
            stream.emit("step", {
              id: "artefact",
              status: "work",
              file: `index.${art}`,
            });
          stream.emit("step", { id: "artefact", status: "done" });
        }
      }

      if (config.production) {
        stream.emit("step", { id: "production", status: "start" });
        const packageJson = JSON.parse(
          fs.readFileSync("package.json", "utf-8"),
        );
        delete packageJson.devDependencies;
        delete packageJson.scripts;
        packageJson.main = "index.js";
        packageJson.scripts = {
          start: "node index.js",
        };
        fs.writeFileSync(
          path.join(config.dist || "dist", "package.json"),
          JSON.stringify(packageJson, null, 2),
        );
        if (config.log === "extend")
          stream.emit("step", {
            id: "production",
            status: "work",
            file: "package.json",
          });

        stream.emit("step", { id: "production", status: "done" });
      }
      stream.emit("step", { id: "end", status: "done" });
      stream.emit("end");
    })
    .catch((error) => {
      stream.emit("error", error);
    });

  return stream;
}

export default bundleBot;
