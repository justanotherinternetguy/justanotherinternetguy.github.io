export default function rehypeImageCaption() {
  return (tree) => {
    visitImages(tree);
    return tree;
  };
}

function visitImages(node) {
  if (!node || !Array.isArray(node.children)) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child?.type === "element" && child.tagName === "img") {
      const title = child.properties?.title;
      if (title) {
        node.children[i] = {
          type: "element",
          tagName: "figure",
          properties: { className: ["image-figure"] },
          children: [
            child,
            {
              type: "element",
              tagName: "figcaption",
              properties: {},
              children: parseInline(title),
            },
          ],
        };
      }
    } else {
      visitImages(child);
    }
  }
}

// Parses a subset of inline markdown (links, bold, italic, code) into hast nodes.
function parseInline(str) {
  const nodes = [];
  // Ordered by precedence: code > bold > italic > link
  const re = /(`[^`]+`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]*)\]\(([^)]*)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = re.exec(str)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: str.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // inline code
      nodes.push({
        type: "element",
        tagName: "code",
        properties: {},
        children: [{ type: "text", value: match[1].slice(1, -1) }],
      });
    } else if (match[2]) {
      // bold
      nodes.push({
        type: "element",
        tagName: "strong",
        properties: {},
        children: [{ type: "text", value: match[3] }],
      });
    } else if (match[4]) {
      // italic
      nodes.push({
        type: "element",
        tagName: "em",
        properties: {},
        children: [{ type: "text", value: match[5] }],
      });
    } else if (match[6]) {
      // link
      nodes.push({
        type: "element",
        tagName: "a",
        properties: { href: match[8], target: "_blank", rel: "noopener noreferrer" },
        children: [{ type: "text", value: match[7] }],
      });
    }

    lastIndex = re.lastIndex;
  }

  if (lastIndex < str.length) {
    nodes.push({ type: "text", value: str.slice(lastIndex) });
  }

  return nodes;
}
