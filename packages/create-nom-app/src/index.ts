#!/usr/bin/env node

import './validators/validateNodeVersion'

import chalk from 'chalk'
import commander from 'commander'
import path from 'path'

import logger from './logger'
import writeHelp from './writeHelp'
import writeEnvInfo from './writeEnvInfo'
import validateProjectName from './validators/validateProjectName'
import validateProjectDirectory from './validators/validateProjectDirectory'
import validateNPMVersion from './validators/validateNPMVersion'
import validateYarnVersion from './validators/validateYarnVersion'
import CreateNomApp from './CreateNomApp'
import packageManagers from './package-managers'
import git from './discover-git'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json')

function main(args = process.argv): void {
  const cwd = process.cwd()
  let projectDirectory = ''
  let projectName: undefined | string

  const program = new commander.Command('create-nom-app')
    .arguments('<project-name>')
    .usage(`${chalk.blue('<project-name>')} [options]`)
    .action(name => {
      projectName = (name || '') as string
      projectDirectory = path.join(cwd, projectName)
    })
    .on('--help', () => {
      writeHelp()
    })
    .option('--info', 'print environment info')
    .option('--use-npm')
    .option('--use-yarn')
    .option('-v, --version', `output the version number ${version}`, () => {
      console.log(`v${version}`)
      process.exit(0)
    })
    .option('-V', '', () => {
      console.log(`v${version}`)
      process.exit(0)
    })

  /**
   * The first and second element in process.argv are `process.execPath` and the
   * path of the JavaScript file being executed, respectively. When functionally
   * interacting with the Create Nom App, any arguments passed must be appended
   * to an array of elements mocking the structure of `process.argv`. This is
   * required so that Commander can correctly parse the arguments.
   *
   * Learn more at:
   *   - https://nodejs.org/docs/latest/api/process.html#process_process_argv
   */
  const argsToParse =
    args === process.argv
      ? process.argv
      : ['__mocked_process_exec_path__', '__mocked_cna_binary_exec_path__'].concat(args)
  program.parse(argsToParse)

  if (program.info) {
    return void writeEnvInfo()
  }

  if (typeof projectName !== 'string') {
    console.log(`${chalk.green('create-nom-app')} ${chalk.blue('<project-name>')} [options]`)
    writeHelp()
    process.exit(1)
  }

  if (program.useNpm && program.useYarn) {
    console.error(chalk.red('Unable to create the project because you have --use-npm and --use-yarn.'))
    console.error(chalk.red('You must remove one of the options.'))
    process.exit(1)
  }

  packageManagers.discoverCommon()

  const preferredPackageManager = ((): false | 'npm' | 'yarn' => {
    if (program.useNpm) {
      return 'npm'
    }

    if (program.useYarn) {
      return 'yarn'
    }

    return false
  })()

  const pkgManagerDefaultPreference = ['yarn', 'npm']
  /**
   * If the user has a preference (via --use-{package-manager}) then it will
   * load that manager. If the preferred manager does not exist, an error will
   * be provided and the process will quit.
   *
   * If the user has no preference, then it will search through a list of
   * package managers and return the first existing manager on the system.
   *
   * If no package manager exists on the system, an error is logged and the
   * process quits.
   */
  // eslint-disable-next-line consistent-return
  const usePackageManager = ((): void | 'npm' | 'yarn' => {
    if (preferredPackageManager) {
      if (packageManagers.hasManager(preferredPackageManager)) {
        return preferredPackageManager
      }

      console.error(
        chalk.red(`Your preferred package manager, ${preferredPackageManager}, was not found on your system.`)
      )
      console.error(chalk.red('You can install the package manager, or remove any preference.'))
      process.exit(1)
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const manager of pkgManagerDefaultPreference) {
      if (packageManagers.hasManager(manager)) {
        return manager as 'npm' | 'yarn'
      }
    }
  })()

  if (typeof usePackageManager !== 'string') {
    console.error(chalk.red('Unable to find any package managers on your system.'))
    console.error(chalk.red(`Searched for ${pkgManagerDefaultPreference.join(', ')}.`))
    console.error(chalk.red('Please install a package manager.'))
    process.exit(1)
  }
  const packageManagerBinary = packageManagers.getManager(usePackageManager).binary

  logger.debug('pref', preferredPackageManager, ';using', usePackageManager, ';binary', packageManagerBinary)

  if (usePackageManager === 'npm') {
    validateNPMVersion(packageManagers.getManager('npm').version)
  }

  if (usePackageManager === 'yarn') {
    validateYarnVersion(packageManagers.getManager('yarn').version)
  }

  validateProjectName(projectName)
  validateProjectDirectory(projectDirectory)

  git.discoverGit()

  const { gitBinary } = git.gitInfo
  logger.debug('gitInfo', git.gitInfo)

  const app = new CreateNomApp(projectName, {
    projectDirectory,
    packageManager: {
      manager: usePackageManager,
      binary: packageManagerBinary
    },
    gitBinary
  })

  logger.debug('createNomApp', app)

  app.ensureProjectDir()
  app.installPackages()
  app.handoff()

  return undefined
}

if (process.env.SKIP_DEFAULT_CREATE_NOM_APP_CLI_ACTION !== 'true') {
  main()
}

export default main
