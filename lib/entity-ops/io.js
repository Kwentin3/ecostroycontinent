import fs from "node:fs/promises";
import path from "node:path";

const UTF8_BOM = [0xEF, 0xBB, 0xBF];
const UTF16LE_BOM = [0xFF, 0xFE];
const UTF16BE_BOM = [0xFE, 0xFF];

function bufferStartsWith(buffer, signature) {
  if (buffer.length < signature.length) {
    return false;
  }

  return signature.every((value, index) => buffer[index] === value);
}

function stripLeadingBom(text) {
  return text.startsWith("\uFEFF") ? text.slice(1) : text;
}

function swapUtf16ByteOrder(buffer) {
  const byteLength = buffer.length - (buffer.length % 2);
  const swapped = Buffer.allocUnsafe(byteLength);

  for (let index = 0; index < byteLength; index += 2) {
    swapped[index] = buffer[index + 1];
    swapped[index + 1] = buffer[index];
  }

  return swapped;
}

function measureParityNullRatio(buffer) {
  const sampleLength = Math.min(buffer.length, 96);
  let evenTotal = 0;
  let oddTotal = 0;
  let evenZeros = 0;
  let oddZeros = 0;

  for (let index = 0; index < sampleLength; index += 1) {
    if ((index % 2) === 0) {
      evenTotal += 1;
      evenZeros += buffer[index] === 0 ? 1 : 0;
      continue;
    }

    oddTotal += 1;
    oddZeros += buffer[index] === 0 ? 1 : 0;
  }

  return {
    even: evenTotal > 0 ? evenZeros / evenTotal : 0,
    odd: oddTotal > 0 ? oddZeros / oddTotal : 0
  };
}

function looksLikeUtf16Le(buffer) {
  const parity = measureParityNullRatio(buffer);

  return parity.odd >= 0.3 && parity.even <= 0.1;
}

function looksLikeUtf16Be(buffer) {
  const parity = measureParityNullRatio(buffer);

  return parity.even >= 0.3 && parity.odd <= 0.1;
}

export function decodeEntityOpsTextBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError("decodeEntityOpsTextBuffer expects a Buffer.");
  }

  if (bufferStartsWith(buffer, UTF8_BOM)) {
    return stripLeadingBom(buffer.subarray(UTF8_BOM.length).toString("utf8"));
  }

  if (bufferStartsWith(buffer, UTF16LE_BOM)) {
    return stripLeadingBom(buffer.subarray(UTF16LE_BOM.length).toString("utf16le"));
  }

  if (bufferStartsWith(buffer, UTF16BE_BOM)) {
    return stripLeadingBom(swapUtf16ByteOrder(buffer.subarray(UTF16BE_BOM.length)).toString("utf16le"));
  }

  if (looksLikeUtf16Le(buffer)) {
    return stripLeadingBom(buffer.toString("utf16le"));
  }

  if (looksLikeUtf16Be(buffer)) {
    return stripLeadingBom(swapUtf16ByteOrder(buffer).toString("utf16le"));
  }

  return stripLeadingBom(buffer.toString("utf8"));
}

export async function readEntityOpsInputFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  const bytes = await fs.readFile(resolvedPath);

  return decodeEntityOpsTextBuffer(bytes);
}

export function resolveEntityOpsOutputFormat(options = {}) {
  const format = options.json
    ? "json"
    : String(options.format || "text").trim().toLowerCase();

  if (format !== "text" && format !== "json") {
    throw new Error(`Unsupported output format: ${format}. Use "text" or "json".`);
  }

  return format;
}

export function formatEntityOpsTextReport(report) {
  const lines = [
    `Mode: ${report.execute ? "execute" : "dry-run"}`,
    `Total: ${report.total}`,
    `Summary: ${JSON.stringify(report.summary)}`
  ];

  for (const item of report.items) {
    const status = item.ok ? item.action : "error";
    const target = item.entityId ? ` (${item.entityId})` : "";
    const scope = item.kind === "display_mode" ? "display_mode" : (item.entityType || item.kind);
    lines.push(`- [${status}] ${scope} :: ${item.label}${target}`);

    if (item.reason) {
      lines.push(`  reason: ${item.reason}`);
    }

    const diffKeys = Object.keys(item.previewDiff || {});

    if (diffKeys.length > 0) {
      lines.push(`  diff: ${diffKeys.join(", ")}`);
    }

    if (Array.isArray(item.changedFields) && item.changedFields.length > 0) {
      lines.push(`  saved: ${item.changedFields.join(", ")}`);
    }

    if (Array.isArray(item.deletedIds) && item.deletedIds.length > 0) {
      lines.push(`  deleted: ${item.deletedIds.join(", ")}`);
    }

    if (item.currentMode) {
      lines.push(`  currentMode: ${item.currentMode}`);
    }

    if (item.filePath) {
      lines.push(`  file: ${item.filePath}`);
    }

    if (item.message) {
      lines.push(`  message: ${item.message}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function serializeEntityOpsReport(report, options = {}) {
  const format = resolveEntityOpsOutputFormat(options);

  if (format === "json") {
    return `${JSON.stringify(report, null, 2)}\n`;
  }

  return formatEntityOpsTextReport(report);
}

export function writeUtf8(stream, text) {
  if (typeof stream?.setDefaultEncoding === "function") {
    try {
      stream.setDefaultEncoding("utf8");
    } catch {
      // Ignore stream implementations that do not expose or allow changing encoding.
    }
  }

  stream.write(Buffer.from(String(text), "utf8"));
}
