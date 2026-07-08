# Contributing to the Catalog

Thank you for your interest in contributing to the catalog! This document outlines the standards and guidelines for contributing to this template repository.

## Overview

This catalog is built with JavaScript and relies on API calls to code, data, model, and spaces repositories to populate the web app in real time. It is deployed via GitHub Pages.

This is a template repository designed to be copied (with "Use this Template") and customized by different organizations to present their code, data, models, and spaces in a dynamic, searchable site.

## Getting Started

Follow [development guidance](README.md#development-prerequisites) for local setup and formatting expectations. 

### Testing Changes

Always test your changes locally with `npm test` before submitting a PR to ensure:

- Content renders correctly.
- Fetching, sorting, and filtering appear as intended.
- No build errors occur.

UI features should be tested locally through running a preview.

## Coding Style, Conventions, and Project Structure

Please refer to our [AGENTS.md](AGENTS.md). This also includes special notes on key differences with the Hugging Face API and important considerations for the templated design of this repository.

## Contribution Process

1. **Create an issue** describing the change or problem **in your own words**.
    - Check existing [issues](https://github.com/Imageomics/catalog/issues) first.
    - If you'd like to work on an existing issue, please comment on it to express interest or describe your potential fix.
2. **Create a feature branch** from `dev`. 
    - It is important that a repo fork includes the `dev` branch content since updates are staged there.
3. **Make your changes** following the standards above.
4. **Test locally** with `npm test`
5. **Run linter/formatter** to ensure formatting consistency
   - See [formatting standard](README.md#formatting-standard)
6. **Submit a pull request** with:
   - Clear description of changes **in your own words**.
   - Reference to related issue.
   - Screenshots if UI changes are involved.

> ![IMPORTANT]
> Please describe your changes or issues in your own words, not with AI-generated text. We understand that AI is sometimes used to help refine or improve writing; this is fine. AI has been used collaboratively in developing this template, and similar use is acceptable, though **AI use in PRs must be acknowledged and checked by the PR author**.

### Pull Request Guidelines

- Keep PRs focused on a single topic when possible.
- Included tests and documentation updates for changes, as needed.
- Follow commit message conventions (see below).
- Test that the site builds without errors.

### Commit Message Guidelines

Commit messages should be **descriptive** and the PR should be **self-contained** (code change accompanied by tests and documentation of new functionality). We use squash merges for this repository, so strict adherence to, e.g., the [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages is not necessary, but helpful for PR titles. 

### Content Review

When reviewing content:

- Verify functionality and local build without errors.
- Check for consistency with existing setup, especially for end-user consistency.
- Test compatibility with various filter and sort options.

## Code of Conduct

Following the [Imageomics core values](https://imageomics.github.io/Imageomics-guide/CODE_OF_CONDUCT/#values), we expect contributors to be respectful and kind.

---

Thank you for helping improve the Catalog! Your contributions help make research products more discoverable.
