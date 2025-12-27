/**
 * FASHN API Order Comparison Test Script
 * 
 * This script tests the FASHN virtual try-on API with different garment order:
 * - Order A: Top first, then Bottom
 * - Order B: Bottom first, then Top
 * 
 * Uses the same seed for reproducible comparison.
 * 
 * Usage:
 *   npx ts-node scripts/test-fashn-order.ts \
 *     --model "https://example.com/model.jpg" \
 *     --top "https://example.com/top.jpg" \
 *     --bottom "https://example.com/bottom.jpg" \
 *     --seed 12345
 */

import Fashn from 'fashn';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const FASHN_API_KEY = process.env.FASHN_API_KEY || 'fa-1BU2kOVYJkAo-JLdNwP7LhsIDbYgPLksqE6R0';

interface TestConfig {
  modelImageUrl: string;
  topGarmentUrl: string;
  bottomGarmentUrl: string;
  seed: number;
  mode?: 'performance' | 'balanced' | 'quality';
}

interface TryOnResult {
  order: string;
  outputUrl: string;
  processingTime: number;
  step1Time: number;
  step2Time: number;
  step1PredictionId: string;
  step2PredictionId: string;
  creditsUsed: number;
}

async function runTryOn(
  client: Fashn,
  modelImageUrl: string,
  garmentImageUrl: string,
  category: 'tops' | 'bottoms',
  seed: number,
  mode: 'performance' | 'balanced' | 'quality' = 'quality'
): Promise<{
  outputUrl: string;
  predictionId: string;
  processingTime: number;
  creditsUsed: number;
}> {
  const startTime = Date.now();

  console.log(`  Running ${category} try-on with seed ${seed}...`);

  const response = await client.predictions.subscribe({
    model_name: 'tryon-v1.6',
    inputs: {
      model_image: modelImageUrl,
      garment_image: garmentImageUrl,
      category: category,
      seed: seed,
      mode: mode,
      output_format: 'png',
    },
    onQueueUpdate: (status) => {
      process.stdout.write(`  Status: ${status.status}\r`);
    },
  });

  const processingTime = Date.now() - startTime;

  if (response.status !== 'completed' || !response.output) {
    throw new Error(`Try-on failed: ${response.error?.message || 'Unknown error'}`);
  }

  const outputUrl = Array.isArray(response.output) ? response.output[0] : response.output;

  console.log(`  ✓ ${category} completed in ${processingTime}ms`);

  return {
    outputUrl: outputUrl as string,
    predictionId: response.id,
    processingTime,
    creditsUsed: response.creditsUsed || 1,
  };
}

async function testOrderA(
  client: Fashn,
  config: TestConfig
): Promise<TryOnResult> {
  console.log('\n📦 ORDER A: Top First, Then Bottom');
  console.log('='.repeat(50));

  const startTime = Date.now();

  // Step 1: Try on TOP
  console.log('\nStep 1: Applying TOP garment...');
  const step1 = await runTryOn(
    client,
    config.modelImageUrl,
    config.topGarmentUrl,
    'tops',
    config.seed,
    config.mode
  );

  // Step 2: Try on BOTTOM using result from step 1
  console.log('\nStep 2: Applying BOTTOM garment...');
  const step2 = await runTryOn(
    client,
    step1.outputUrl,
    config.bottomGarmentUrl,
    'bottoms',
    config.seed,
    config.mode
  );

  const totalTime = Date.now() - startTime;

  return {
    order: 'A (Top → Bottom)',
    outputUrl: step2.outputUrl,
    processingTime: totalTime,
    step1Time: step1.processingTime,
    step2Time: step2.processingTime,
    step1PredictionId: step1.predictionId,
    step2PredictionId: step2.predictionId,
    creditsUsed: step1.creditsUsed + step2.creditsUsed,
  };
}

async function testOrderB(
  client: Fashn,
  config: TestConfig
): Promise<TryOnResult> {
  console.log('\n📦 ORDER B: Bottom First, Then Top');
  console.log('='.repeat(50));

  const startTime = Date.now();

  // Step 1: Try on BOTTOM
  console.log('\nStep 1: Applying BOTTOM garment...');
  const step1 = await runTryOn(
    client,
    config.modelImageUrl,
    config.bottomGarmentUrl,
    'bottoms',
    config.seed,
    config.mode
  );

  // Step 2: Try on TOP using result from step 1
  console.log('\nStep 2: Applying TOP garment...');
  const step2 = await runTryOn(
    client,
    step1.outputUrl,
    config.topGarmentUrl,
    'tops',
    config.seed,
    config.mode
  );

  const totalTime = Date.now() - startTime;

  return {
    order: 'B (Bottom → Top)',
    outputUrl: step2.outputUrl,
    processingTime: totalTime,
    step1Time: step1.processingTime,
    step2Time: step2.processingTime,
    step1PredictionId: step1.predictionId,
    step2PredictionId: step2.predictionId,
    creditsUsed: step1.creditsUsed + step2.creditsUsed,
  };
}

function printResults(resultA: TryOnResult, resultB: TryOnResult, config: TestConfig) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPARISON RESULTS');
  console.log('='.repeat(70));

  console.log('\n📸 Input Images:');
  console.log(`  Model:  ${config.modelImageUrl}`);
  console.log(`  Top:    ${config.topGarmentUrl}`);
  console.log(`  Bottom: ${config.bottomGarmentUrl}`);
  console.log(`  Seed:   ${config.seed}`);
  console.log(`  Mode:   ${config.mode || 'quality'}`);

  console.log('\n⏱️  Processing Times:');
  console.log(`  Order A (Top → Bottom): ${resultA.processingTime}ms total`);
  console.log(`    - Step 1 (Top):    ${resultA.step1Time}ms`);
  console.log(`    - Step 2 (Bottom): ${resultA.step2Time}ms`);
  console.log(`  Order B (Bottom → Top): ${resultB.processingTime}ms total`);
  console.log(`    - Step 1 (Bottom): ${resultB.step1Time}ms`);
  console.log(`    - Step 2 (Top):    ${resultB.step2Time}ms`);

  console.log('\n💳 Credits Used:');
  console.log(`  Order A: ${resultA.creditsUsed} credits`);
  console.log(`  Order B: ${resultB.creditsUsed} credits`);
  console.log(`  Total:   ${resultA.creditsUsed + resultB.creditsUsed} credits`);

  console.log('\n🖼️  Output URLs:');
  console.log(`  Order A (Top → Bottom):`);
  console.log(`    ${resultA.outputUrl}`);
  console.log(`  Order B (Bottom → Top):`);
  console.log(`    ${resultB.outputUrl}`);

  console.log('\n📝 Prediction IDs:');
  console.log(`  Order A: ${resultA.step1PredictionId} → ${resultA.step2PredictionId}`);
  console.log(`  Order B: ${resultB.step1PredictionId} → ${resultB.step2PredictionId}`);

  // Save results to file
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(resultsDir, `fashn-order-test-${timestamp}.json`);

  const jsonResults = {
    timestamp: new Date().toISOString(),
    config: {
      modelImageUrl: config.modelImageUrl,
      topGarmentUrl: config.topGarmentUrl,
      bottomGarmentUrl: config.bottomGarmentUrl,
      seed: config.seed,
      mode: config.mode || 'quality',
    },
    orderA: resultA,
    orderB: resultB,
  };

  fs.writeFileSync(resultsFile, JSON.stringify(jsonResults, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);
}

async function main() {
  console.log('🚀 FASHN API Order Comparison Test');
  console.log('='.repeat(70));

  // Parse command line arguments
  const args = process.argv.slice(2);
  const argMap: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      argMap[key] = value;
    }
  }

  // Default test images (you can replace these with your own)
  const config: TestConfig = {
    modelImageUrl: argMap.model || '',
    topGarmentUrl: argMap.top || '',
    bottomGarmentUrl: argMap.bottom || '',
    seed: parseInt(argMap.seed || '42', 10),
    mode: (argMap.mode as 'performance' | 'balanced' | 'quality') || 'quality',
  };

  // Validate inputs
  if (!config.modelImageUrl || !config.topGarmentUrl || !config.bottomGarmentUrl) {
    console.log('\n❌ Missing required arguments!');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/test-fashn-order.ts \\');
    console.log('    --model "https://example.com/model.jpg" \\');
    console.log('    --top "https://example.com/top.jpg" \\');
    console.log('    --bottom "https://example.com/bottom.jpg" \\');
    console.log('    --seed 12345 \\');
    console.log('    --mode quality');
    console.log('\nOptions:');
    console.log('  --model   URL of the model/person image (required)');
    console.log('  --top     URL of the top garment image (required)');
    console.log('  --bottom  URL of the bottom garment image (required)');
    console.log('  --seed    Random seed for reproducibility (default: 42)');
    console.log('  --mode    Quality mode: performance, balanced, quality (default: quality)');
    process.exit(1);
  }

  // Initialize FASHN client
  const client = new Fashn({ apiKey: FASHN_API_KEY });

  console.log('\n📋 Test Configuration:');
  console.log(`  Model Image: ${config.modelImageUrl}`);
  console.log(`  Top Garment: ${config.topGarmentUrl}`);
  console.log(`  Bottom Garment: ${config.bottomGarmentUrl}`);
  console.log(`  Seed: ${config.seed}`);
  console.log(`  Mode: ${config.mode}`);

  try {
    // Run Order A: Top first, then Bottom
    const resultA = await testOrderA(client, config);

    // Run Order B: Bottom first, then Top
    const resultB = await testOrderB(client, config);

    // Print comparison results
    printResults(resultA, resultB, config);

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();


