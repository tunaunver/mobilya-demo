const fs = require('fs');

const html = fs.readFileSync('admin.html', 'utf8');
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g);
const inlineScript = scripts[scripts.length - 1].replace('<script>', '').replace('</script>', '');

// We mock the DOM globally to intercept at what point execution crashes.
global.document = {
  querySelectorAll: () => [],
  getElementById: () => ({ addEventListener: () => {} }),
  addEventListener: () => {}
};
global.window = {
  supabase: { createClient: () => ({}) }
};
global.alert = () => {};

try {
  eval(inlineScript);
  console.log("Mock Eval OK");
} catch(e) {
  console.log("Mock Eval Crashed at:", e);
}
