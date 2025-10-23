/**
 * Simple direct Vectorize test with query
 */

import { getPlatformProxy } from 'wrangler';

interface Env {
  VECTORIZE: VectorizeIndex;
  AI: any;
}

async function test() {
  console.log('🧪 Testing direct Vectorize query...\n');
  
  const { env, dispose } = await getPlatformProxy<Env>({
    configPath: './wrangler.jsonc',
  });
  
  // Generate embedding for query
  console.log('1. Generating embedding for "cyberattack"...');
  const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: 'cyberattack on financial systems'
  });
  
  const embedArray = embedding.data?.[0] || embedding;
  console.log(`   ✅ Got embedding with ${embedArray.length} dimensions\n`);
  
  // Query Vectorize WITHOUT namespace filter
  console.log('2. Querying Vectorize WITHOUT namespace filter...');
  const results = await env.VECTORIZE.query(embedArray, {
    topK: 3,
    returnMetadata: true
  });
  
  console.log(`   ✅ Found ${results.matches.length} matches:`);
  results.matches.forEach((match: any, i: number) => {
    console.log(`   ${i + 1}. Score: ${(match.score * 100).toFixed(1)}% - ${match.metadata?.title || match.id}`);
  });
  
  await dispose();
  console.log('\n✅ Test completed successfully!');
}

test().catch(console.error);
