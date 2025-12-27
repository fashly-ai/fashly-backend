/**
 * FASHN API Combined Outfit Test Script
 * 
 * Tests what happens when you send a single image containing both top + bottom
 * to the FASHN API with different category settings.
 * 
 * This helps determine if FASHN can handle outfit images like the ones shown
 * in fashion editorial layouts (e.g., Theory top + Isabel Marant skirt together).
 * 
 * Usage:
 *   npx ts-node scripts/test-fashn-combined-outfit.ts \
 *     --model "https://example.com/model.jpg" \
 *     --outfit "https://example.com/combined-outfit.jpg" \
 *     --seed 12345
 */

import Fashn from 'fashn';
import * as fs from 'fs';
import * as path from 'path';

const FASHN_API_KEY = process.env.FASHN_API_KEY || 'fa-1BU2kOVYJkAo-JLdNwP7LhsIDbYgPLksqE6R0';

interface TestResult {
  category: string;
  status: string;
  outputUrl?: string;
  error?: string;
  processingTime: number;
  predictionId?: string;
}

async function testWithCategory(
  client: Fashn,
  modelImageUrl: string,
  outfitImageUrl: string,
  category: 'auto' | 'tops' | 'bottoms' | 'one-pieces',
  seed: number,
  mode: 'performance' | 'balanced' | 'quality' = 'quality'
): Promise<TestResult> {
  console.log(`\n🧪 Testing with category: "${category}"`);
  console.log('-'.repeat(40));

  const startTime = Date.now();

  try {
    const response = await client.predictions.subscribe({
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: modelImageUrl,
        garment_image: outfitImageUrl,
        category: category,
        seed: seed,
        mode: mode,
        output_format: 'png',
      },
      onQueueUpdate: (status) => {
        process.stdout.write(`  Status: ${status.status}    \r`);
      },
    });

    const processingTime = Date.now() - startTime;

    if (response.status === 'completed' && response.output) {
      const outputUrl = Array.isArray(response.output) ? response.output[0] : response.output;
      console.log(`  ✅ Success in ${processingTime}ms`);
      console.log(`  📍 Prediction ID: ${response.id}`);
      console.log(`  🖼️  Output: ${outputUrl}`);

      return {
        category,
        status: 'success',
        outputUrl: outputUrl as string,
        processingTime,
        predictionId: response.id,
      };
    } else {
      console.log(`  ❌ Failed: ${response.error?.message || 'Unknown error'}`);
      return {
        category,
        status: 'failed',
        error: response.error?.message || 'Unknown error',
        processingTime,
        predictionId: response.id,
      };
    }
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.log(`  ❌ Error: ${error.message}`);
    return {
      category,
      status: 'error',
      error: error.message,
      processingTime,
    };
  }
}

async function main() {
  console.log('🚀 FASHN API Combined Outfit Test');
  console.log('='.repeat(60));
  console.log('Testing how FASHN handles a single image with both TOP + BOTTOM');
  console.log('='.repeat(60));

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
  const outfitImageUrl = argMap.outfit || '';
  const seed = parseInt(argMap.seed || '42', 10);
  const mode = (argMap.mode || 'quality') as 'performance' | 'balanced' | 'quality';
  const testAll = argMap.all === 'true';

  if (!modelImageUrl || !outfitImageUrl) {
    console.log('\n❌ Missing required arguments!');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/test-fashn-combined-outfit.ts \\');
    console.log('    --model "https://example.com/model-fullbody.jpg" \\');
    console.log('    --outfit "https://example.com/combined-outfit.jpg" \\');
    console.log('    --seed 12345 \\');
    console.log('    --mode quality \\');
    console.log('    --all true');
    console.log('\nOptions:');
    console.log('  --model   URL of the model/person full-body image (required)');
    console.log('  --outfit  URL of the combined outfit image with top+bottom (required)');
    console.log('  --seed    Random seed for reproducibility (default: 42)');
    console.log('  --mode    Quality mode: performance, balanced, quality (default: quality)');
    console.log('  --all     Test all categories: auto, tops, bottoms, one-pieces (default: false)');
    process.exit(1);
  }

  console.log('\n📋 Test Configuration:');
  console.log(`  Model Image:  ${modelImageUrl}`);
  console.log(`  Outfit Image: ${outfitImageUrl}`);
  console.log(`  Seed:         ${seed}`);
  console.log(`  Mode:         ${mode}`);
  console.log(`  Test All:     ${testAll}`);

  const client = new Fashn({ apiKey: FASHN_API_KEY });
  const results: TestResult[] = [];

  // Test with 'auto' category first (most interesting)
  results.push(await testWithCategory(client, modelImageUrl, outfitImageUrl, 'auto', seed, mode));

  // If --all flag is set, test all other categories too
  if (testAll) {
    results.push(await testWithCategory(client, modelImageUrl, outfitImageUrl, 'tops', seed, mode));
    results.push(await testWithCategory(client, modelImageUrl, outfitImageUrl, 'bottoms', seed, mode));
    results.push(await testWithCategory(client, modelImageUrl, outfitImageUrl, 'one-pieces', seed, mode));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));

  console.log('\n📸 Input Images:');
  console.log(`  Model:  ${modelImageUrl}`);
  console.log(`  Outfit: ${outfitImageUrl}`);
  console.log(`  Seed:   ${seed}`);

  console.log('\n📋 Results by Category:');
  for (const result of results) {
    const statusIcon = result.status === 'success' ? '✅' : '❌';
    console.log(`\n  ${statusIcon} category: "${result.category}"`);
    console.log(`     Status: ${result.status}`);
    console.log(`     Time: ${result.processingTime}ms`);
    if (result.outputUrl) {
      console.log(`     Output: ${result.outputUrl}`);
    }
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }

  // Save results to file
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(resultsDir, `fashn-combined-outfit-${timestamp}.json`);

  const jsonResults = {
    timestamp: new Date().toISOString(),
    config: {
      modelImageUrl,
      outfitImageUrl,
      seed,
      mode,
    },
    results,
    conclusion: results.find(r => r.category === 'auto')?.status === 'success'
      ? 'FASHN processed the combined outfit image. Check the output to see what garment type it detected.'
      : 'FASHN failed to process the combined outfit image.',
  };

  fs.writeFileSync(resultsFile, JSON.stringify(jsonResults, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);

  // Interpretation
  console.log('\n' + '='.repeat(60));
  console.log('🔍 INTERPRETATION');
  console.log('='.repeat(60));

  const autoResult = results.find(r => r.category === 'auto');
  if (autoResult?.status === 'success') {
    console.log(`
When using category: 'auto' with a combined outfit image:
- FASHN will AUTO-DETECT the garment type
- It likely treats the image as ONE garment (not both top AND bottom)
- Compare the output with your original model to see what was applied

To determine what FASHN detected:
1. Open the output image URL
2. Compare with the original model image
3. Check if only TOP, only BOTTOM, or BOTH were applied

If only one garment type was applied, you MUST use separate images
for top and bottom to achieve a full outfit try-on.
    `);
  } else {
    console.log(`
The combined outfit image failed with category: 'auto'.
This suggests FASHN requires individual garment images.

Recommended approach:
1. Use separate images for top and bottom garments
2. Run two sequential API calls (top first, then bottom)
3. Use the same seed for consistency
    `);
  }

  console.log('\n✅ Test completed!');
}

main();

