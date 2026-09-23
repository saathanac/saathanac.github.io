# SYDE 572 Portfolio

A small React website built with Vite, hosted at `saathanac.github.io`.

## Local development

Use Node.js 24 and npm:

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal. Edit `src/App.jsx` for the homepage,
`src/pages/Assignment1.jsx` for Assignment 1, and `src/styles.css` for styling.
Use the development server instead of opening `index.html` directly.

## Adding assignments

Create a component in `src/pages/`, import it in `src/App.jsx`, add a `Route`,
and add a `Link` on the homepage. Routes use a hash, such as
`/#/assignments/1`, so direct links and refreshes work on GitHub Pages.
Put downloadable files and images in `public/` and reference them by paths
such as `/report.pdf`.

## Production build

```sh
npm run build
npm run preview
```

The build is written to `dist/`.

## GitHub Pages

In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
Commit and push the project to `main`; the included workflow builds and deploys
`dist/`. The Vite base path is `/` for this `saathanac.github.io` repository.

Build and hosting setup follows the [Vite deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).
