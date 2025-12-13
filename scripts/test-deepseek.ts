import fs from 'fs';
import path from 'path';
import https from 'https';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';
let baseUrl = 'https://api.deepseek.com';

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('DEEPSEEK_API_KEY=')) {
      apiKey = line.split('=')[1].trim();
    }
    if (line.startsWith('DEEPSEEK_BASE_URL=')) {
      baseUrl = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('Error reading .env.local:', error);
  process.exit(1);
}

if (!apiKey) {
  console.error('DEEPSEEK_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('Testing DeepSeek API...');
console.log('URL:', `${baseUrl}/chat/completions`);
console.log('Model:', 'deepseek-chat');

const data = JSON.stringify({
  model: 'deepseek-chat',
  messages: [
    { role: 'user', content: 'Hello, are you working? Please reply with "Yes, I am DeepSeek V3".' }
  ],
  stream: false
});

const url = new URL(`${baseUrl}/chat/completions`);

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    try {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        const json = JSON.parse(responseBody);
        console.log('Response:', json.choices[0].message.content);
        console.log('✅ DeepSeek API connection successful!');
      } else {
        console.error('❌ API Request failed:', responseBody);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      console.log('Raw response:', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.write(data);
req.end();
