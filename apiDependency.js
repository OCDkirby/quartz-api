import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { satisfies } from 'semver'

import { createRequire } from "module";
const require = createRequire(import.meta.url);

let pkgPath = process.argv[1] // full path of postinstall script being executed, presumably buried in node_modules in your app
pkgPath = pkgPath.split('node_modules')[0] + 'package.json' // take only the part preceding node_modules
import pkg from "./package.json" with { type: "json" } // require the package.json in that folder

function fallbackToGit(searchPath) {
  const git_dependency = pkg["quartzPeerDependencies"]["quartz"].git
  const semver_dependency = pkg["quartzPeerDependencies"]["quartz"].semver
  console.log(semver_dependency)
  console.log(git_dependency)

  let quartzProjectPackage = searchPath + "package.json"
  if (existsSync(quartzProjectPackage)) {
    let quartzProjectInfo = require(quartzProjectPackage)

    // If the search path is a Quartz install,
    //   check that it satisfies the semver required by this version of the API.
    // If so, quartz's inherent self-dependency will be used when bundling
    //   the plugin that depends on this API
    if (quartzProjectInfo["name"] === "@jackyzha0/quartz") {
      if (!satisfies(quartzProjectInfo["version"], semver_dependency)) {
        throw new Error("quartz-api: ERR: quartz root is version " 
          + quartzProjectInfo["version"]
          + ", does not satisfy quartz-api requirement "
          + semver_dependency)
      }

      return true
    }
  }

  // Otherwise, get a copy from git for development purposes
  spawnSync("npm", ["install", "--save-peer", "--install-strategy=shallow", git_dependency])
  return false
}

const installed = fallbackToGit("../../../") // true if run from quartz/node_modules/@quartz-md/api
if (installed) {
  console.log("Found quartz in dependency tree, depending on semver")
}
else {
  console.log("Developing with quartz-api, using quartz from Git")
}
