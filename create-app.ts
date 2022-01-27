import chalk from "chalk"
import fs from "fs"
import os from "os"
import path from "path"
import cpy from "cpy"
import { isFolderEmpty } from "./helpers/is-folder-empty"
import { getOnline } from "./helpers/is-online"
import { isWriteable } from "./helpers/is-writeable"
import { makeDir } from "./helpers/make-dir"
import { shouldUseYarn } from "./helpers/should-use-yarn"
import { install } from "./helpers/install"
import { tryGitInit } from "./helpers/git"

export async function createApp({
    appPath,
    useNpm,
}: {
    appPath: string
    useNpm: boolean
}): Promise<void> {
    const template = 'default'

    const root = path.resolve(appPath)
    const templatesPath = path.join(__dirname, '..', 'templates')

    if (!(await isWriteable(path.dirname(root)))) {
        console.error(
            'The application path is not writable, please check folder permissions and try again.'
        )
        console.error(
            'It is likely you do not have write permissions for this folder.'
        )
        process.exit(1)
    }

    const appName = path.basename(root)

    await makeDir(root)
    if (!isFolderEmpty(root, appName)) {
        process.exit(1)
    }

    if (tryGitInit(root)) {
        console.log('Initialized a git repository.')
        console.log()
    }

    const useYarn = useNpm ? false : shouldUseYarn()
    const isOnline = !useYarn || (await getOnline())
    const originalDirectory = process.cwd()

    const displayedCommand = useYarn ? 'yarn' : 'npm'
    console.log(`Creating a new barebone app in ${chalk.green(root)}.`)
    console.log()

    await makeDir(root)
    process.chdir(root)

    console.log(chalk.bold(`Using ${displayedCommand}.`))

    /**
     * Get the package.json data from the template.
     */
    let packageJson = require(
        path.join(templatesPath, template, 'package.json')
    )

    packageJson = {
        name: appName,
        private: true,
        version: "0.1.0",
        ...packageJson
    }

    /**
     * Write it to disk.
     */
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJson, null, 2) + os.EOL
    )

    /**
     * These flags will be passed to `install()`.
     */
    const installFlags = { useYarn, isOnline }

    /**
     * Default dependencies.
     */
    const dependenciesNames = Object.keys(packageJson.dependencies)
    const dependenciesVersions = Object.values<string>(packageJson.dependencies)

    /**
     * Default devDependencies.
     */
    const devDependenciesNames = Object.keys(packageJson.devDependencies)
    const devDependenciesVersions = Object.values<string>(packageJson.devDependencies)

    /**
     * Install package.json dependencies if they exist.
     */
    if (dependenciesNames.length) {
        console.log()
        console.log('Installing dependencies:')
        for (const dependency of dependenciesNames) {
            console.log(`- ${chalk.cyan(dependency)}`)
        }
        console.log()

        await install(root, dependenciesNames, installFlags, dependenciesVersions)
    }

    /**
     * Install package.json devDependencies if they exist.
     */
    if (devDependenciesNames.length) {
        console.log()
        console.log('Installing devDependencies:')
        for (const devDependency of devDependenciesNames) {
            console.log(`- ${chalk.cyan(devDependency)}`)
        }
        console.log()

        const devInstallFlags = { devDependencies: true, ...installFlags }
        await install(root, devDependenciesNames, devInstallFlags, devDependenciesVersions)
    }

    console.log()

    /**
     * Copy the template files to the target directory.
     */
    await cpy('**', root, {
        parents: true,
        cwd: path.join(__dirname, '..', 'templates', template),
        ignore: ['package.json'],
        rename: (name) => {
            switch (name) {
                case 'gitignore':
                case 'npmrc':
                case 'eslintrc.json':
                case 'prettierrc': {
                    return '.'.concat(name)
                }
                // README.md is ignored by webpack-asset-relocator-loader used by ncc:
                // https://github.com/vercel/webpack-asset-relocator-loader/blob/e9308683d47ff507253e37c9bcbb99474603192b/src/asset-relocator.js#L227
                case 'README-template.md': {
                    return 'README.md'
                }
                default: {
                    return name
                }
            }
        },
    })


    let cdpath: string
    if (path.join(originalDirectory, appName) === appPath) {
        cdpath = appName
    } else {
        cdpath = appPath
    }

    console.log(`${chalk.green('Success!')} Created ${appName} at ${appPath}`)
    console.log('Inside that directory, you can run several commands:')
    console.log()
    console.log(chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}dev`))
    console.log('    Starts the development server.')
    console.log()
    console.log(chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}build`))
    console.log('    Builds the app for production.')
    console.log()
    console.log(chalk.cyan(`  ${displayedCommand} start`))
    console.log('    Runs the built app in production mode.')
    console.log()
    console.log('We suggest that you begin by typing:')
    console.log()
    console.log(chalk.cyan('  cd'), cdpath)
    console.log(
        `  ${chalk.cyan(`${displayedCommand} ${useYarn ? '' : 'run '}dev`)}`
    )
    console.log()
}