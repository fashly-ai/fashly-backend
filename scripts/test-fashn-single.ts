/**
 * FASHN API Single Try-On Test Script
 * 
 * Quick test for a single garment try-on.
 * 
 * Usage:
 *   npx ts-node scripts/test-fashn-single.ts \
 *     --model "https://example.com/model.jpg" \
 *     --garment "https://example.com/garment.jpg" \
 *     --category "tops" \
 *     --seed 12345
 */

import Fashn from 'fashn';

const FASHN_API_KEY = process.env.FASHN_API_KEY || 'fa-1BU2kOVYJkAo-JLdNwP7LhsIDbYgPLksqE6R0';

async function main() {
  console.log('🚀 FASHN API Single Try-On Test');
  console.log('='.repeat(50));

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

  const modelImageUrl = argMap.model || '';
  const garmentImageUrl = argMap.garment || '';
  const category = (argMap.category || 'auto') as 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  const seed = parseInt(argMap.seed || '42', 10);
  const mode = (argMap.mode || 'quality') as 'performance' | 'balanced' | 'quality';

  if (!modelImageUrl || !garmentImageUrl) {
    console.log('\n❌ Missing required arguments!');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/test-fashn-single.ts \\');
    console.log('    --model "https://example.com/model.jpg" \\');
    console.log('    --garment "https://example.com/garment.jpg" \\');
    console.log('    --category "tops" \\');
    console.log('    --seed 12345');
    console.log('\nOptions:');
    console.log('  --model     URL of the model/person image (required)');
    console.log('  --garment   URL of the garment image (required)');
    console.log('  --category  Garment type: auto, tops, bottoms, one-pieces (default: auto)');
    console.log('  --seed      Random seed for reproducibility (default: 42)');
    console.log('  --mode      Quality mode: performance, balanced, quality (default: quality)');
    process.exit(1);
  }

  console.log('\n📋 Configuration:');
  console.log(`  Model Image: ${modelImageUrl}`);
  console.log(`  Garment Image: ${garmentImageUrl}`);
  console.log(`  Category: ${category}`);
  console.log(`  Seed: ${seed}`);
  console.log(`  Mode: ${mode}`);

  const client = new Fashn({ apiKey: FASHN_API_KEY });
  const startTime = Date.now();

  try {
    console.log('\n⏳ Running try-on...');

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
        console.log(`  Status: ${status.status}`);
      },
    });

    const processingTime = Date.now() - startTime;

    if (response.status === 'completed' && response.output) {
      const outputUrl = Array.isArray(response.output) ? response.output[0] : response.output;

      console.log('\n✅ Try-on completed successfully!');
      console.log('='.repeat(50));
      console.log(`  Processing Time: ${processingTime}ms`);
      console.log(`  Prediction ID: ${response.id}`);
      console.log(`  Credits Used: ${response.creditsUsed || 1}`);
      console.log(`\n🖼️  Output URL:`);
      console.log(`  ${outputUrl}`);
    } else {
      console.log('\n❌ Try-on failed!');
      console.log(`  Error: ${response.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();


