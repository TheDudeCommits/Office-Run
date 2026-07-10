import type { AvatarProfile } from "@/game/types";

const ACCENTS = ["#63d9ff", "#67e8a5", "#ffd447", "#ff82c8", "#9d7bff"];
const TITLES = [
  "Spreadsheet Sprinter",
  "Calendar Escape Artist",
  "Inbox Zero Hero",
  "Meeting Mirage",
  "Deck-Building Dissident",
  "Senior Vibe Analyst",
  "Deadline Acrobat",
  "Synergy Survivor",
];

export function quantizeChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value / 51) * 51));
}

export function hashPixels(pixels: Uint8ClampedArray) {
  let hash = 2166136261;
  for (let index = 0; index < pixels.length; index += 4) {
    hash ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function profileFromHash(hash: number) {
  return {
    accent: ACCENTS[hash % ACCENTS.length],
    title: TITLES[(hash >>> 3) % TITLES.length],
  };
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The photo could not be read."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The selected file is not a readable image."));
    image.src = source;
  });
}

export async function createPixelAvatar(file: File): Promise<AvatarProfile> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPG, PNG, or WebP photo.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Keep the photo under 8 MB.");
  }

  const source = await readFile(file);
  const image = await loadImage(source);
  const sample = document.createElement("canvas");
  sample.width = 18;
  sample.height = 18;
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Avatar rendering is unavailable in this browser.");

  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - side) / 2;
  const sourceY = Math.max(0, (image.naturalHeight - side) / 2 - side * 0.08);
  context.imageSmoothingEnabled = true;
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, 18, 18);

  const imageData = context.getImageData(0, 0, 18, 18);
  const hash = hashPixels(imageData.data);
  for (let index = 0; index < imageData.data.length; index += 4) {
    imageData.data[index] = quantizeChannel(imageData.data[index]);
    imageData.data[index + 1] = quantizeChannel(imageData.data[index + 1]);
    imageData.data[index + 2] = quantizeChannel(imageData.data[index + 2]);

    const pixel = index / 4;
    const x = pixel % 18;
    const y = Math.floor(pixel / 18);
    const corner = (x < 2 || x > 15) && (y < 2 || y > 15);
    if (corner) imageData.data[index + 3] = 0;
  }
  context.putImageData(imageData, 0, 0);

  const output = document.createElement("canvas");
  output.width = 72;
  output.height = 72;
  const outputContext = output.getContext("2d");
  if (!outputContext) throw new Error("Avatar rendering is unavailable in this browser.");
  outputContext.imageSmoothingEnabled = false;
  outputContext.drawImage(sample, 0, 0, 72, 72);

  const profile = profileFromHash(hash);
  return {
    dataUrl: output.toDataURL("image/png"),
    accent: profile.accent,
    title: profile.title,
    custom: true,
  };
}
