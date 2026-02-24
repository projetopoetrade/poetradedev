// Fetch skilltree data and check what node 54447 is

async function main() {
  const res = await fetch(
    "https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json",
    { headers: { "User-Agent": "PathOfTrade/1.0" } },
  );
  const data = await res.json();

  const nodes = data.nodes as Record<
    string,
    {
      name: string;
      isKeystone?: boolean;
      isMastery?: boolean;
      isNotable?: boolean;
    }
  >;

  // Check the nodes from PoB
  const pobNodes = ["11420", "1957", "57264", "739", "33296", "18866", "54447"];

  console.log("=== PoB Nodes Analysis ===\n");
  for (const nodeId of pobNodes) {
    const node = nodes[nodeId];
    if (node) {
      console.log(`Node ${nodeId}:`, {
        name: node.name,
        isKeystone: node.isKeystone,
        isMastery: node.isMastery,
        isNotable: node.isNotable,
      });
    } else {
      console.log(
        `Node ${nodeId}: NOT FOUND in official data (might be PoE2 specific)`,
      );
    }
  }

  console.log("\n=== Node 54447 details ===");
  const node54447 = nodes["54447"];
  if (node54447) {
    console.log(JSON.stringify(node54447, null, 2));
  } else {
    console.log("Node 54447 not in PoE1 skilltree data - likely a PoE2 node");
  }

  // Check if it's an ascendancy node
  console.log("\n=== Checking if 54447 is in ascendancy positions ===");
  for (const [id, node] of Object.entries(nodes)) {
    if (node.name && node.name.toLowerCase().includes("ascend")) {
      console.log(`Found ascendancy-related: ${id} - ${node.name}`);
    }
  }
}

main().catch(console.error);
