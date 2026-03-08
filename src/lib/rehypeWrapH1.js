export default function rehypeWrapH1() {
  return (tree) => {
    if (!tree || !Array.isArray(tree.children)) return tree;

    const newChildren = [];
    const children = tree.children;
    let i = 0;
    while (i < children.length) {
      const node = children[i];

      const isH1 = node && node.type === "element" && node.tagName === "h1";
      if (isH1) {
        const sectionChildren = [];
        sectionChildren.push(node);
        i++;
        while (i < children.length) {
          const next = children[i];
          const nextIsH1 =
            next && next.type === "element" && next.tagName === "h1";
          if (nextIsH1) break;
          sectionChildren.push(next);
          i++;
        }
        newChildren.push({
          type: "element",
          tagName: "section",
          properties: { className: ["glass"] },
          children: sectionChildren,
        });
      } else {
        newChildren.push(node);
        i++;
      }
    }

    tree.children = newChildren;
    return tree;
  };
}
