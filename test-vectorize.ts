/**
 * Simple Vectorize Test Script
 * Tests embedding generation and vector insertion
 */

import { getPlatformProxy } from 'wrangler';

interface Env {
  VECTORIZE: VectorizeIndex;
  AI: any;
  DB: D1Database;
}

async function testVectorize() {
  console.log('🧪 Testing Vectorize Setup...\n');
  
  try {
    // Get local bindings
    const { env, dispose } = await getPlatformProxy<Env>({
      configPath: './wrangler.jsonc',
    });
    
    console.log('✅ Platform proxy initialized');
    console.log('✅ Bindings available:', {
      VECTORIZE: !!env.VECTORIZE,
      AI: !!env.AI,
      DB: !!env.DB
    });
    
    // Test 1: Generate embedding
    console.log('\n📊 Test 1: Generate embedding...');
    const testText = 'Ransomware attack targeting financial institutions';
    const embeddingResult = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: testText
    });
    
    const embedding = embeddingResult.data?.[0] || embeddingResult;
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map((v: number) => v.toFixed(4)).join(', ')}...]`);
    
    // Test 2: Insert test vectors
    console.log('\n📊 Test 2: Insert test vectors...');
    const testVectors = [
      {
        id: 'test_1',
        values: embedding,
        namespace: 'test',
        metadata: {
          text: testText,
          type: 'test',
          timestamp: new Date().toISOString()
        }
      }
    ];
    
    const insertResult = await env.VECTORIZE.insert(testVectors);
    console.log('✅ Vectors inserted:', insertResult);
    
    // Test 3: Query similar vectors
    console.log('\n📊 Test 3: Query for similar vectors...');
    const queryText = 'Cybersecurity incident in banking sector';
    const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: queryText
    });
    
    const searchResults = await env.VECTORIZE.query(
      queryEmbedding.data?.[0] || queryEmbedding,
      {
        topK: 5,
        returnMetadata: true,
        namespace: 'test'
      }
    );
    
    console.log(`✅ Found ${searchResults.matches.length} similar vectors:`);
    searchResults.matches.forEach((match: any, idx: number) => {
      console.log(`   ${idx + 1}. Score: ${(match.score * 100).toFixed(1)}% - ${match.metadata?.text || match.id}`);
    });
    
    // Test 4: Check database connection
    console.log('\n📊 Test 4: Check D1 database...');
    const risksCount = await env.DB.prepare('SELECT COUNT(*) as count FROM risks').first();
    const incidentsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM incidents').first();
    
    console.log('✅ Database records found:');
    console.log(`   Risks: ${risksCount?.count || 0}`);
    console.log(`   Incidents: ${incidentsCount?.count || 0}`);
    
    console.log('\n✅ All tests passed! Vectorize is working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run batch indexer to populate vectors');
    console.log('   2. Test semantic search via API');
    console.log('   3. Deploy to production');
    
    await dispose();
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testVectorize();
