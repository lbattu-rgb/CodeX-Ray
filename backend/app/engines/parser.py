from __future__ import annotations

import ast
from collections import defaultdict
from dataclasses import dataclass
from typing import Any


@dataclass
class ParserContext:
    source: str
    tree: ast.AST
    function_names: set[str]


class StructuralVisitor(ast.NodeVisitor):
    def __init__(self, source: str) -> None:
        self.source = source
        self.function_names: set[str] = set()
        self.functions: list[dict[str, Any]] = []
        self.nodes: list[dict[str, Any]] = []
        self.calls: list[dict[str, Any]] = []
        self.dependencies: dict[int, set[str]] = defaultdict(set)
        self.parent_stack: list[str] = []
        self.loop_depth = 0

    def add_node(self, node: ast.AST, node_type: str, **extra: Any) -> str:
        node_id = f"node_{len(self.nodes) + 1}"
        payload = {
            "id": node_id,
            "type": node_type,
            "line": getattr(node, "lineno", None),
            "end_line": getattr(node, "end_lineno", getattr(node, "lineno", None)),
            "parent_id": self.parent_stack[-1] if self.parent_stack else None,
            "loop_depth": self.loop_depth,
        }
        payload.update(extra)
        self.nodes.append(payload)
        return node_id

    def visit_FunctionDef(self, node: ast.FunctionDef) -> Any:
        self.function_names.add(node.name)
        fn_id = self.add_node(node, "function", name=node.name, args=[arg.arg for arg in node.args.args])
        self.functions.append(
            {
                "id": fn_id,
                "name": node.name,
                "line_start": node.lineno,
                "line_end": getattr(node, "end_lineno", node.lineno),
            }
        )
        self.parent_stack.append(fn_id)
        self.generic_visit(node)
        self.parent_stack.pop()

    def visit_For(self, node: ast.For) -> Any:
        loop_id = self.add_node(
            node,
            "loop",
            kind="for",
            target=ast.unparse(node.target),
            iterator=ast.unparse(node.iter),
            nested=self.loop_depth > 0,
        )
        self.parent_stack.append(loop_id)
        self.loop_depth += 1
        self.generic_visit(node)
        self.loop_depth -= 1
        self.parent_stack.pop()

    def visit_While(self, node: ast.While) -> Any:
        loop_id = self.add_node(
            node,
            "loop",
            kind="while",
            condition=ast.unparse(node.test),
            nested=self.loop_depth > 0,
        )
        self.parent_stack.append(loop_id)
        self.loop_depth += 1
        self.generic_visit(node)
        self.loop_depth -= 1
        self.parent_stack.pop()

    def visit_If(self, node: ast.If) -> Any:
        branch_id = self.add_node(node, "branch", condition=ast.unparse(node.test))
        self.parent_stack.append(branch_id)
        self.generic_visit(node)
        self.parent_stack.pop()

    def visit_Return(self, node: ast.Return) -> Any:
        self.add_node(node, "return", value=ast.unparse(node.value) if node.value else None)
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> Any:
        target = ast.unparse(node.func)
        parent_id = self.parent_stack[-1] if self.parent_stack else None
        self.calls.append(
            {
                "line": getattr(node, "lineno", None),
                "function": target,
                "parent_id": parent_id,
                "in_loop": self.loop_depth > 0,
            }
        )
        self.add_node(node, "call", function=target, in_loop=self.loop_depth > 0)
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> Any:
        targets = [ast.unparse(target) for target in node.targets]
        assign_id = self.add_node(node, "assignment", targets=targets, value=ast.unparse(node.value))
        for target in targets:
            self.dependencies[node.lineno].add(target)
        self.parent_stack.append(assign_id)
        self.generic_visit(node)
        self.parent_stack.pop()

    def visit_AugAssign(self, node: ast.AugAssign) -> Any:
        target = ast.unparse(node.target)
        self.add_node(node, "aug_assignment", target=target, op=node.op.__class__.__name__)
        self.dependencies[node.lineno].add(target)
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> Any:
        if isinstance(node.ctx, ast.Load):
            self.dependencies[getattr(node, "lineno", -1)].add(node.id)


def build_cfg(tree: ast.AST) -> list[dict[str, Any]]:
    edges: list[dict[str, Any]] = []
    numbered = [node for node in ast.walk(tree) if hasattr(node, "lineno")]
    numbered.sort(key=lambda node: (getattr(node, "lineno", 0), getattr(node, "col_offset", 0)))
    for current, nxt in zip(numbered, numbered[1:]):
        edges.append(
            {
                "from_line": getattr(current, "lineno", None),
                "to_line": getattr(nxt, "lineno", None),
                "kind": "sequential",
            }
        )
    return edges


def parse_source(source: str) -> dict[str, Any]:
    tree = ast.parse(source)
    visitor = StructuralVisitor(source)
    visitor.visit(tree)

    recursion_candidates: list[dict[str, Any]] = []
    function_names = {fn["name"] for fn in visitor.functions}
    for call in visitor.calls:
        parent_id = call["parent_id"]
        parent_name = next((fn["name"] for fn in visitor.functions if fn["id"] == parent_id), None)
        if parent_name and call["function"] == parent_name:
            recursion_candidates.append(
                {
                    "function": parent_name,
                    "line": call["line"],
                    "type": "direct",
                }
            )
        elif call["function"] in function_names:
            recursion_candidates.append(
                {
                    "function": call["function"],
                    "line": call["line"],
                    "type": "possible_indirect",
                }
            )

    return {
        "ast_summary": {
            "node_count": len(list(ast.walk(tree))),
            "function_count": len(visitor.functions),
            "call_count": len(visitor.calls),
        },
        "functions": visitor.functions,
        "nodes": visitor.nodes,
        "calls": visitor.calls,
        "recursion_candidates": recursion_candidates,
        "cfg": build_cfg(tree),
        "data_dependencies": {line: sorted(list(names)) for line, names in visitor.dependencies.items() if line >= 0},
    }
