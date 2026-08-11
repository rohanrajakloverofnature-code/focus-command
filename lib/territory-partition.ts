import { INDIA_INTERIOR_CELL_COUNT, INDIA_INTERIOR_CELL_SIZE, INDIA_INTERIOR_CELLS } from "./india-interior-mask";

export interface TerritoryPartitionSubject {
  subject: string;
  capture: number;
}

export interface DynamicTerritory {
  subject: string;
  capture: number;
  cellCount: number;
  targetCellCount: number;
  path: string;
  labelX: number;
  labelY: number;
}

export function getTerritoryLabelLines(value: string): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [value.trim()];
  const lines = ["", ""];
  words.forEach((word) => {
    const target = lines[0].length <= lines[1].length ? 0 : 1;
    lines[target] = lines[target] ? `${lines[target]} ${word}` : word;
  });
  return lines.filter(Boolean);
}

interface Cell {
  x: number;
  y: number;
}

const MINIMUM_WEIGHT = 0.14;

function subjectHash(value: string) {
  return [...value.toLocaleLowerCase()].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0) >>> 0;
}

function pointKey(x: number, y: number) {
  return `${x}:${y}`;
}

function edgeKey(from: Cell, to: Cell) {
  return `${pointKey(from.x, from.y)}>${pointKey(to.x, to.y)}`;
}

function distanceSquared(first: Cell, second: Cell) {
  const x = first.x - second.x;
  const y = first.y - second.y;
  return x * x + y * y;
}

function readCells(): Cell[] {
  const cells: Cell[] = [];
  for (let index = 0; index < INDIA_INTERIOR_CELLS.length; index += 2) {
    cells.push({ x: INDIA_INTERIOR_CELLS[index]!, y: INDIA_INTERIOR_CELLS[index + 1]! });
  }
  return cells;
}

function calculateTargets(subjects: TerritoryPartitionSubject[], totalCells: number) {
  const minimumCells = Math.max(1, Math.min(Math.floor(totalCells / Math.max(subjects.length * 11, 1)), 14));
  const reservedCells = minimumCells * subjects.length;
  const remainingCells = Math.max(0, totalCells - reservedCells);
  const weights = subjects.map((subject) => MINIMUM_WEIGHT + Math.max(0, Math.min(1, subject.capture)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const fractions = weights.map((weight) => remainingCells * weight / totalWeight);
  const targets = fractions.map((fraction) => minimumCells + Math.floor(fraction));
  let remainder = totalCells - targets.reduce((sum, target) => sum + target, 0);
  [...subjects.keys()]
    .sort((left, right) => (fractions[right]! % 1) - (fractions[left]! % 1) || subjectHash(subjects[left]!.subject) - subjectHash(subjects[right]!.subject))
    .forEach((subjectIndex) => {
      if (remainder > 0) {
        targets[subjectIndex] += 1;
        remainder -= 1;
      }
    });
  return targets;
}

function selectSeeds(subjects: TerritoryPartitionSubject[], cells: Cell[]) {
  const seedIndexes: number[] = [];
  subjects.forEach((subject, subjectIndex) => {
    if (subjectIndex === 0) {
      seedIndexes.push(subjectHash(subject.subject) % cells.length);
      return;
    }
    let bestIndex = 0;
    let bestScore = -Infinity;
    cells.forEach((candidate, candidateIndex) => {
      if (seedIndexes.includes(candidateIndex)) return;
      const nearestSeedDistance = Math.min(...seedIndexes.map((seedIndex) => distanceSquared(candidate, cells[seedIndex]!)));
      const stableTieBreaker = (subjectHash(`${subject.subject}:${candidateIndex}`) % 997) / 997_000;
      const score = nearestSeedDistance + stableTieBreaker;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = candidateIndex;
      }
    });
    seedIndexes.push(bestIndex);
  });
  return seedIndexes;
}

function territoryPath(cellIndexes: number[], cells: Cell[]) {
  const edges = new Map<string, { from: Cell; to: Cell }>();
  cellIndexes.forEach((cellIndex) => {
    const cell = cells[cellIndex]!;
    const x = cell.x;
    const y = cell.y;
    const size = INDIA_INTERIOR_CELL_SIZE;
    const vertices = [{ x, y }, { x: x + size, y }, { x: x + size, y: y + size }, { x, y: y + size }];
    vertices.forEach((from, edgeIndex) => {
      const to = vertices[(edgeIndex + 1) % vertices.length]!;
      const forward = edgeKey(from, to);
      const reverse = edgeKey(to, from);
      if (edges.has(reverse)) edges.delete(reverse);
      else edges.set(forward, { from, to });
    });
  });

  const outgoing = new Map<string, string[]>();
  edges.forEach((edge, key) => {
    const from = pointKey(edge.from.x, edge.from.y);
    const list = outgoing.get(from) ?? [];
    list.push(key);
    outgoing.set(from, list);
  });

  const loops: Cell[][] = [];
  while (edges.size) {
    const firstEntry = edges.entries().next().value as [string, { from: Cell; to: Cell }] | undefined;
    if (!firstEntry) break;
    const [firstKey, firstEdge] = firstEntry;
    edges.delete(firstKey);
    const loop = [firstEdge.from, firstEdge.to];
    let current = firstEdge.to;
    const startKey = pointKey(firstEdge.from.x, firstEdge.from.y);
    let guard = 0;
    while (pointKey(current.x, current.y) !== startKey && guard < 10_000) {
      const candidateKeys = outgoing.get(pointKey(current.x, current.y)) ?? [];
      const nextKey = candidateKeys.find((candidate) => edges.has(candidate));
      if (!nextKey) break;
      const nextEdge = edges.get(nextKey)!;
      edges.delete(nextKey);
      loop.push(nextEdge.to);
      current = nextEdge.to;
      guard += 1;
    }
    if (loop.length > 3) loops.push(loop.slice(0, -1));
  }

  return loops.map((loop) => {
    const last = loop[loop.length - 1]!;
    const first = loop[0]!;
    const startX = (last.x + first.x) / 2;
    const startY = (last.y + first.y) / 2;
    let path = `M${startX.toFixed(2)} ${startY.toFixed(2)}`;
    loop.forEach((point, index) => {
      const next = loop[(index + 1) % loop.length]!;
      const endX = (point.x + next.x) / 2;
      const endY = (point.y + next.y) / 2;
      path += ` Q${point.x.toFixed(2)} ${point.y.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`;
    });
    return `${path} Z`;
  }).join(" ");
}

/**
 * Produces a compact, contiguous and completion-weighted land partition. Every
 * available India cell belongs to exactly one subject; all visible regions are
 * constrained again by the geographic SVG clip at render time.
 */
export function getDynamicTerritories(subjects: TerritoryPartitionSubject[]): DynamicTerritory[] {
  const normalized = [...subjects]
    .map((subject) => ({ subject: subject.subject.trim() || "General", capture: Math.max(0, Math.min(1, subject.capture)) }))
    .sort((left, right) => subjectHash(left.subject) - subjectHash(right.subject));
  if (!normalized.length) return [];

  const cells = readCells();
  const targets = calculateTargets(normalized, cells.length);
  const seeds = selectSeeds(normalized, cells);
  const indexByPoint = new Map(cells.map((cell, index) => [pointKey(cell.x, cell.y), index]));
  const neighbors = cells.map((cell) => [
    indexByPoint.get(pointKey(cell.x + INDIA_INTERIOR_CELL_SIZE, cell.y)),
    indexByPoint.get(pointKey(cell.x - INDIA_INTERIOR_CELL_SIZE, cell.y)),
    indexByPoint.get(pointKey(cell.x, cell.y + INDIA_INTERIOR_CELL_SIZE)),
    indexByPoint.get(pointKey(cell.x, cell.y - INDIA_INTERIOR_CELL_SIZE)),
  ].filter((index): index is number => index !== undefined));
  const assignments = Array.from({ length: cells.length }, () => -1);
  const owned = normalized.map((): number[] => []);
  const frontiers = normalized.map(() => new Set<number>());
  const centroids = seeds.map((seed) => ({ ...cells[seed]! }));

  const updateFrontier = (owner: number, cellIndex: number) => {
    neighbors[cellIndex]!.forEach((neighbor) => {
      if (assignments[neighbor] === -1) frontiers[owner]!.add(neighbor);
    });
  };
  const assign = (owner: number, cellIndex: number) => {
    if (assignments[cellIndex] !== -1) return;
    assignments[cellIndex] = owner;
    owned[owner]!.push(cellIndex);
    frontiers.forEach((frontier) => frontier.delete(cellIndex));
    const cell = cells[cellIndex]!;
    const count = owned[owner]!.length;
    centroids[owner] = {
      x: (centroids[owner]!.x * (count - 1) + cell.x) / count,
      y: (centroids[owner]!.y * (count - 1) + cell.y) / count,
    };
    updateFrontier(owner, cellIndex);
  };

  seeds.forEach((seed, owner) => assign(owner, seed));
  let remaining = cells.length - seeds.length;
  while (remaining > 0) {
    const eligible = normalized
      .map((_, owner) => owner)
      .filter((owner) => owned[owner]!.length < targets[owner]! && [...frontiers[owner]!].some((cellIndex) => assignments[cellIndex] === -1));
    let owner = eligible.sort((left, right) => ((targets[right]! - owned[right]!.length) / targets[right]!) - ((targets[left]! - owned[left]!.length) / targets[left]!) || left - right)[0];
    if (owner === undefined) owner = normalized.map((_, index) => index).sort((left, right) => (targets[right]! - owned[right]!.length) - (targets[left]! - owned[left]!.length) || left - right)[0]!;
    const frontier = [...frontiers[owner]!].filter((cellIndex) => assignments[cellIndex] === -1);
    const pool = frontier.length ? frontier : cells.map((_, index) => index).filter((cellIndex) => assignments[cellIndex] === -1);
    const next = pool.sort((left, right) => distanceSquared(cells[left]!, centroids[owner]!) - distanceSquared(cells[right]!, centroids[owner]!) || left - right)[0];
    assign(owner, next!);
    remaining -= 1;
  }

  return normalized.map((subject, owner) => {
    const regionCells = owned[owner]!;
    const center = regionCells.reduce((sum, cellIndex) => ({ x: sum.x + cells[cellIndex]!.x + INDIA_INTERIOR_CELL_SIZE / 2, y: sum.y + cells[cellIndex]!.y + INDIA_INTERIOR_CELL_SIZE / 2 }), { x: 0, y: 0 });
    return {
      subject: subject.subject,
      capture: subject.capture,
      cellCount: regionCells.length,
      targetCellCount: targets[owner]!,
      path: territoryPath(regionCells, cells),
      labelX: center.x / regionCells.length,
      labelY: center.y / regionCells.length,
    };
  });
}

export const DYNAMIC_TERRITORY_INTERIOR_CELL_COUNT = INDIA_INTERIOR_CELL_COUNT;
