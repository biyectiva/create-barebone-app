# Create Barebone App

The easiest way to get started with your barebone app is by using `create-barebone-app`. This CLI tool enables you to quickly start building a new barebone application, with everything set up for you. You can create a new app using the default template. To get started, use the following command:

```bash
# Using npm 
npx create-barebone-app

# Using yarn 
yarn create barebone-app
```

To create a new app in a specific folder, you can send a name as an argument. For example, the following command will create a new barebone app called `blog-app` in a folder with the same name:

```bash
npx create-barebone-app blog-app
```

## Options

`create-barebone-app` comes with the following options:

- **--use-npm** - Explicitly tell the CLI to bootstrap the app using npm. To bootstrap using yarn we recommend to run `yarn create barebone-app`
