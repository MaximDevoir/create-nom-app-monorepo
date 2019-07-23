# Deploy Docs

> Build and deploy a Docusaurus project to GitHub Pages.

## Usage

<img src="https://user-images.githubusercontent.com/10104630/61741640-3335f180-ad46-11e9-9e6b-04318829a80f.png" align="right" width=250/>

```bash
action "Build and deploy" {
  uses = "./.github/actions/deploy-docs"
  secrets = ["DOCS_DEPLOY_TOKEN"]
  env = {
    WEBSITE_DIR = "docs/website"
  }
}
```

## Secrets

| **Secret** | **Description** |
|------------|-----------------|
| `DOCS_DEPLOY_TOKEN` | This token must have full access to the repository. See this guide from GitHub on how to create a [personal access token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line). |

<img src="https://user-images.githubusercontent.com/10104630/61743118-704fb300-ad49-11e9-8a3c-73ef7dc4ffbb.png" align="right" />

### Creating Your Personal Access Token

The personal access token (PAT) must have full access to the repository (the
`repo` box must be checked during token generation).

Create Nom App has no official instructions on creating a PAT :(

You may view Docusaurus' guide on [creating a
PAT](https://github.com/facebook/docusaurus/blob/master/docs/getting-started-publishing.md#using-circleci-20), ignore the steps not relevant to creating PATs.

## Environment

| **Name** | **Description** |
|------------|-----------------|
| `WEBSITE_DIR` | The `WEBSITE_DIR` points to the directory, relative to your repository root, containing the `siteConfig.js` file from Docusaurus. See the Docusaurus section on [directory structure](https://docusaurus.io/docs/en/site-preparation#directory-structure) for more information. |

## Arguments

None

## License

The [MIT](LICENSE) license