import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import fs from 'fs';
import jsYaml from 'js-yaml';
import { validateConfig } from './src/validateConfig.js'; 

let CONFIG_PATH = './public/config.yaml';
let parsedConfig;

// Run config validation before starting the dev server
try {
    const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
    parsedConfig = jsYaml.load(fileContents);
} catch (error) {
    console.error(`\n❌ [CONFIG ERROR] Failed to read or parse config.yaml: ${error.message}\n`);
    process.exit(1); // Stop Vite immediately if the file is completely unreadable or broken YAML
}

// Any errors will be collected in the 'errors' array, to be printed out and cause a safe crash if not empty.
const errors = validateConfig(parsedConfig); 
if (errors && errors.length > 0) {
    console.error('\n❌ [CONFIG ERROR] Vite failed to start due to the following configuration errors:\n');
    
    errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
    });
    
    console.error(`\n Aborting deployment. Please fix these issues in ${CONFIG_PATH} and try again.\n`);
    process.exit(1); // Safely kills the npm run dev terminal process
}

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  base: repoName ? `/${repoName}/` : '/',
  plugins: [
    tailwindcss(),
  ],
})
