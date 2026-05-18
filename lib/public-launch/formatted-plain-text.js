const ORDERED_ITEM_PATTERN = /^\s*(\d+)[.)]\s+(.+)$/;

function pushParagraph(blocks, lines) {
  if (lines.length === 0) {
    return;
  }

  blocks.push({
    type: "paragraph",
    text: lines.join("\n")
  });
  lines.length = 0;
}

function pushList(blocks, items) {
  if (items.length === 0) {
    return;
  }

  blocks.push({
    type: "orderedList",
    items: [...items]
  });
  items.length = 0;
}

export function buildFormattedPlainTextBlocks(value) {
  if (typeof value !== "string") {
    return [];
  }

  const normalized = value.replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const blocks = [];
  const paragraphLines = [];
  const orderedItems = [];

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      pushParagraph(blocks, paragraphLines);
      pushList(blocks, orderedItems);
      continue;
    }

    const orderedMatch = line.match(ORDERED_ITEM_PATTERN);

    if (orderedMatch) {
      pushParagraph(blocks, paragraphLines);
      orderedItems.push({
        number: Number(orderedMatch[1]),
        text: orderedMatch[2].trim()
      });
      continue;
    }

    if (orderedItems.length > 0) {
      const lastItem = orderedItems[orderedItems.length - 1];
      lastItem.text = `${lastItem.text}\n${line}`;
      continue;
    }

    paragraphLines.push(line);
  }

  pushParagraph(blocks, paragraphLines);
  pushList(blocks, orderedItems);

  return blocks;
}
