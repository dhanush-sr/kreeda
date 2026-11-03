import { pipeline } from "@huggingface/transformers";

let extractor;

export async function embed(text) {
  extractor ??= pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" });
  const output = await (await extractor)(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
