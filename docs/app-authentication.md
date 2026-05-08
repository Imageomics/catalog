# App Authentication

For this app to run the full [weekly tag scan workflow](../.github/workflows/weekly-tag-scan.yml), it must be allowed to open and modify pull requests. GitHub recommends using [GitHub Apps](https://docs.github.com/en/apps/overview) for authentication, over Personal Access Tokens (PATs).

## Creating Your Catalog Automation App

This App is essentially a more secure, drop-in replacement for a PAT. It is used to create a transient token with which the tag scan workflow can create or modify a PR (as per the [tag grouping process](tag-grouping-process.md)). I mostly followed [this guide](https://aembit.io/blog/replacing-a-github-personal-access-token-with-a-github-application/) while "creating" the App (registering it), but will outline the decisions based on [GitHub's instructions for Registering a GitHub App for an Organization](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app#registering-a-github-app):

### "Create" a Private App

> [!NOTE]
> Only Organization Owners can complete this process.

1. Navigate to `Organization settings > Developer settings > GitHub Apps`

2. Select "New GitHub App" and give it a descriptive name, e.g., `ORGANIZATION_NAME Catalog Automation App`.
   This way it will be unique across GitHub.

4. Describe the App, for instance:
   ```
   App for automated ORGANIZATION_NAME Catalog workflows (weekly tag-scan PR).
   ```

5. Set the Homepage URL to your GitHub Organization (`https://github.com/ORGANIZATION_NAME`)

Skip all remaining sections until you get to "Permissions":

5. Expand the **Repository permissions** section and set the required permissions, specifically:
     - "Contents": "Read and write"
     - "Pull requests": "Read and write"
     - "Metadata" is set to "Read-only" by default. Do not touch this.

6. When asked "Where can this GitHub App be installed?", limit installation to your org by selecting "Only on this account".

7. Select "Create GitHub App".

**Congratulations, you've made an App for authentication!**

 The App has no associated code, no webhooks, and is private within the Organization.

### Install your App

Follow [GitHub's Instructions to install your App in your Org](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app).

> [!IMPORTANT]
> During installation, be sure to choose "Only select repositories" under "Repository Access", then select your Catalog repository from the dropdown.

### Authenticate with your App

Now that the App is installed in your Org with access to your Catalog repository, you need to provide the repository with the means to authenticate your App. For this to work, the App Client ID must be [stored as a variable](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables#defining-configuration-variables-for-multiple-workflows) and the App's private key as a [secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets?tool=webui#creating-secrets-for-a-repository).
Together that will allow for the [Authentication as an App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation), so the tag-scan PR is clearly automated.

#### Get App Identifiers

Navigate to your GitHub App settings and generate a private key ([GitHub's Instructions](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps#generating-private-keys)). This will automatically download a `.pem` file to your computer. ***Keep this secure; do not share it!*** (See also [GitHub's recommendations](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps#storing-private-keys) for managing private keys.)

Before leaving this page, copy your App's "Client ID".

#### Add Identifiers to Catalog Repo

In your Catalog repository, navigate to `Settings > Secrets and variables > Actions`.
- Under the "Variables" Tab, create a new **repository variable**:
    - Paste your App's Client ID into the "Value" box.
    - Name the variable `APP_CLIENT_ID`.
- Under "Secrets", create a new **repository secret**:
    - Name it "APP_PRIVATE_KEY".
    - Paste your private key in the "Secret" box. Be sure to include both the header (`-----BEGIN RSA PRIVATE KEY-----`) and footer (`-----END RSA PRIVATE KEY-----`).
> [!Important]
> ***Clear your clipboard after!***
