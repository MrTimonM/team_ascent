from pydantic import BaseModel, Field

NodeCategory = str

VALID_CATEGORIES = {
    "main",
    "subtopic",
    "definition",
    "example",
    "code",
    "error",
    "exam",
}


class MindMapNode(BaseModel):
    id: str
    label: str
    category: NodeCategory = "subtopic"
    description: str = ""


class MindMapEdge(BaseModel):
    source: str
    target: str
    relationship: str = "related"


class MindMap(BaseModel):
    nodes: list[MindMapNode] = Field(default_factory=list)
    edges: list[MindMapEdge] = Field(default_factory=list)

    def pruned(self) -> "MindMap":
        """Drop edges pointing at nodes that do not exist.

        The model regularly invents a target id it never emits as a node, and
        react-force-graph throws on a dangling link rather than skipping it.
        """
        known = {node.id for node in self.nodes}
        return MindMap(
            nodes=self.nodes,
            edges=[e for e in self.edges if e.source in known and e.target in known],
        )
