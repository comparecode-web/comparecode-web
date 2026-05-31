const EXIF_TAGS: Record<number, string> = {
  0x010F: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x011A: "XResolution",
  0x011B: "YResolution",
  0x0128: "ResolutionUnit",
  0x0131: "Software",
  0x0132: "DateTime",
  0x013B: "Artist",
  0x013E: "WhitePoint",
  0x013F: "PrimaryChromaticities",
  0x0213: "YCbCrPositioning",
  0x8769: "ExifIFD",
  0x8825: "GPSIFD",
  0x9000: "ExifVersion",
  0x9003: "DateTimeOriginal",
  0x9004: "DateTimeDigitized",
  0x9201: "ShutterSpeedValue",
  0x9202: "ApertureValue",
  0x9203: "BrightnessValue",
  0x9204: "ExposureBiasValue",
  0x9205: "MaxApertureValue",
  0x9206: "SubjectDistance",
  0x9207: "MeteringMode",
  0x9208: "LightSource",
  0x9209: "Flash",
  0x920A: "FocalLength",
  0xA001: "ColorSpace",
  0xA002: "PixelXDimension",
  0xA003: "PixelYDimension",
  0xA402: "ExposureMode",
  0xA403: "WhiteBalance",
  0xA406: "SceneCaptureType",
  0x8827: "ISOSpeedRatings",
  0x829A: "ExposureTime",
  0x829D: "FNumber",
  0xA432: "LensSpecification",
  0xA434: "LensModel",
  0xA435: "LensSerialNumber",
  0xA420: "ImageUniqueID",
  0x013C: "HostComputer",
  0x8298: "Copyright",
};

function readUint16(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint16(offset, littleEndian);
}

function readUint32(view: DataView, offset: number, littleEndian: boolean): number {
  return view.getUint32(offset, littleEndian);
}

function readAsciiString(view: DataView, offset: number, length: number): string {
  let str = "";
  for (let i = 0; i < length - 1; i++) {
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}

function parseIFDEntries(
  view: DataView,
  ifdOffset: number,
  tiffStart: number,
  littleEndian: boolean,
  result: Record<string, string>
): void {
  try {
    const entryCount = readUint16(view, tiffStart + ifdOffset, littleEndian);

    for (let i = 0; i < entryCount; i++) {
      const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;

      const tag = readUint16(view, entryOffset, littleEndian);
      const type = readUint16(view, entryOffset + 2, littleEndian);
      const count = readUint32(view, entryOffset + 4, littleEndian);
      const valueOffset = entryOffset + 8;

      const tagName = EXIF_TAGS[tag];
      if (!tagName) continue;

      try {
        let value = "";

        if (type === 2) {
          // ASCII string
          if (count > 4) {
            const strOffset = tiffStart + readUint32(view, valueOffset, littleEndian);
            value = readAsciiString(view, strOffset, count);
          } else {
            value = readAsciiString(view, valueOffset, count);
          }
        } else if (type === 3) {
          // SHORT (16-bit unsigned)
          value = String(readUint16(view, valueOffset, littleEndian));
        } else if (type === 4) {
          // LONG (32-bit unsigned)
          value = String(readUint32(view, valueOffset, littleEndian));
        } else if (type === 5) {
          // RATIONAL (two 32-bit unsigned integers)
          const rationalOffset = tiffStart + readUint32(view, valueOffset, littleEndian);
          const numerator = readUint32(view, rationalOffset, littleEndian);
          const denominator = readUint32(view, rationalOffset + 4, littleEndian);
          if (denominator === 0) {
            value = "0";
          } else if (denominator === 1) {
            value = String(numerator);
          } else {
            value = `${numerator}/${denominator}`;
          }
        } else if (type === 10) {
          // SRATIONAL (two 32-bit signed integers)
          const rationalOffset = tiffStart + readUint32(view, valueOffset, littleEndian);
          const numerator = view.getInt32(rationalOffset, littleEndian);
          const denominator = view.getInt32(rationalOffset + 4, littleEndian);
          if (denominator === 0) {
            value = "0";
          } else if (denominator === 1) {
            value = String(numerator);
          } else {
            value = `${numerator}/${denominator}`;
          }
        } else {
          continue;
        }

        if (value) {
          result[tagName] = value;
        }

        // Recurse into Exif sub-IFD
        if (tag === 0x8769 || tag === 0x8825) {
          const subOffset = readUint32(view, valueOffset, littleEndian);
          parseIFDEntries(view, subOffset, tiffStart, littleEndian, result);
        }
      } catch {
        // Skip malformed entry
      }
    }
  } catch {
    // Ignore IFD parse errors
  }
}

export async function readExifData(file: File): Promise<Record<string, string> | null> {
  if (!file.type.includes("jpeg") && !file.type.includes("jpg") && !file.name.toLowerCase().endsWith(".jpg") && !file.name.toLowerCase().endsWith(".jpeg")) {
    return null;
  }

  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Check JPEG SOI marker
    if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) {
      return null;
    }

    let offset = 2;
    while (offset < view.byteLength - 2) {
      if (view.getUint8(offset) !== 0xFF) break;

      const marker = view.getUint8(offset + 1);
      const segmentLength = view.getUint16(offset + 2);

      if (marker === 0xE1) {
        // APP1 segment — check for "Exif\0\0"
        if (
          view.getUint8(offset + 4) === 0x45 && // E
          view.getUint8(offset + 5) === 0x78 && // x
          view.getUint8(offset + 6) === 0x69 && // i
          view.getUint8(offset + 7) === 0x66 && // f
          view.getUint8(offset + 8) === 0x00 &&
          view.getUint8(offset + 9) === 0x00
        ) {
          const tiffStart = offset + 10;

          // Check byte order
          const byteOrderMark = view.getUint16(tiffStart);
          const littleEndian = byteOrderMark === 0x4949; // II = little-endian, MM = big-endian

          // Read IFD0 offset
          const ifd0Offset = readUint32(view, tiffStart + 4, littleEndian);

          const result: Record<string, string> = {};
          parseIFDEntries(view, ifd0Offset, tiffStart, littleEndian, result);

          return Object.keys(result).length > 0 ? result : null;
        }
      }

      if (marker === 0xDA) break; // SOS — start of scan data, stop

      offset += 2 + segmentLength;
    }
  } catch {
    // Silently ignore errors in EXIF parsing
  }

  return null;
}

/** Compute a simple non-cryptographic hash string for display purposes.
 * Uses a djb2-like algorithm on the first 64KB of the file. */
export async function computeFileHash(file: File): Promise<string> {
  const chunk = file.slice(0, 65536);
  const buffer = await chunk.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let hash = 5381;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) + hash + bytes[i]) >>> 0;
  }

  return hash.toString(16).toUpperCase().padStart(8, "0");
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
