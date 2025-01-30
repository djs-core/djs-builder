import bundleBot from "@djs-core/builder";
import { log } from "node:console";

async function main() {
  const stream = bundleBot({
    obfuscation: true,
    files: ["toBuild/**/*.ts"],
    minify: true,
    production: true,
    log: "extend"
  });
  stream.on("step", (step) => {
    log(step);
  });
  await new Promise((resolve) => stream.once("end", resolve));
  console.log("done");
}

main();
