import { ModuleGraph, ModuleNode, Plugin, parseAst } from "vite";
import { exec } from "node:child_process";
import { kill } from "node:process";

export default function prismaHmrPlugin(
  generator?: string,
  refresh?: boolean
): Plugin {
  const dependents = new Set<string>();
  return {
    name: "prisma-hmr-plugin",

    ...(refresh && {
      transform(code, id) {
        if (dependents.has(id)) return;

        const program = parseAst(code);
        const hasImport = program.body.some(
          node =>
            node.type === "ImportDeclaration" &&
            node.source.value === "@prisma/client"
        );

        if (hasImport) dependents.add(id);
      },
    }),

    async handleHotUpdate(ctx) {
      if (ctx.file.endsWith("prisma/schema.prisma")) {
        await Promise.all([killPrismaBinaries(), ctx.read()]);

        await generatePrismaClient(generator);

        return mapIdsToModules(ctx.server.moduleGraph, dependents);
      }

      return undefined;
    },
  };
}

function mapIdsToModules(
  moduleGraph: ModuleGraph,
  ids: Set<string>
): ModuleNode[] {
  const modules: ModuleNode[] = [];
  for (const id of ids.values()) {
    const module = moduleGraph.getModuleById(id);
    if (module) modules.push(module);
  }
  return modules;
}

async function generatePrismaClient(generator?: string) {
  const stdout = await new Promise<string>((res, rej) =>
    exec(
      `yarpm exec prisma generate${generator ? ` --generator ${generator}` : ""}`,
      (err, output) => (err ? rej(err) : res(output))
    )
  );

  // eslint-disable-next-line no-console
  console.log(
    stdout
      .split("\n")
      .filter(el => el.includes("✔ Generated"))
      .join("\n")
  );
}

async function killPrismaBinaries() {
  const processes = await getProcesses();

  for (const pid of processes) {
    kill(pid);
  }
}

const isWin = process.platform === "win32";
const execOpts = isWin ? { shell: "powershell.exe" } : {};
const processListCommand = isWin ? "ps" : "pgrep";
function getProcesses() {
  return new Promise<number[]>((res, rej) =>
    exec(`${processListCommand} query-engine-*`, execOpts, (err, out) =>
      err ? rej(err) : res(findProcesses(out))
    )
  );
}

function findProcesses(searchOut: string): number[] {
  return searchOut
    .split("\n")
    .map(line => {
      let pid: string | undefined;
      if (isWin) {
        const parts = line.split(/\s+/i);
        if (parts.length === 10) {
          pid = parts[6];
        } else {
          console.warn("didn't find prisma process id", parts);
        }
      } else {
        pid = line;
      }

      return pid && parseInt(pid);
    })
    .filter(el => el) as number[];
}
