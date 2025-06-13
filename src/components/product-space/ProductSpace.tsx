import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import nodesEdges from "../../data/nodes_edges.json";
import metadata from "../../data/metadata.json";
import type { NodesEdgesData, Metadata, Node, Edge } from "./types";

const data: NodesEdgesData = nodesEdges;
const meta: Metadata = metadata;

type RenderableNode = Omit<Node, "x" | "y"> & { x: number; y: number };

const isRenderableNode = (node: Node): node is RenderableNode =>
  node.x !== null && node.y !== null;

type MetadataEntry = {
  sectorId?: string;
  name: string;
  code: string;
};

const ProductSpace = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<d3.Selection<
    SVGTextElement,
    unknown,
    null,
    undefined
  > | null>(null);

  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 200); // Adjust debounce delay (ms) as needed
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // SVG setup
    const { width, height } = size;

    const margins = { top: 20, right: 40, bottom: 20, left: 40 };

    const svgWidth = width - margins.left - margins.right;
    const svgHeight = height - margins.top - margins.bottom;

    const svg = d3
      .select(svgRef.current as SVGSVGElement)
      .attr("width", width)
      .attr("height", height);

    svg.select("#draw-layer").remove();

    const graph = svg
      .append("g")
      .attr("id", "draw-layer")
      .attr("transform", `translate(${margins.left},${margins.top})`);

    const viewport = graph.append("g");
    const overlay = graph.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });

    svg.call(zoom);

    tooltipRef.current = overlay
      .append("text")
      .attr("id", "tooltip")
      .attr("class", "constant-size");

    // Helper to process data and set up scales
    const processData = () => {
      const nodes = data.nodes.filter(isRenderableNode);
      const links = data.edges;

      const xExtent = d3.extent(nodes, (d) => d.x);
      const yExtent = d3.extent(nodes, (d) => d.y);

      const xScale = d3
        .scaleLinear()
        .domain(xExtent as [number, number])
        .range([0, svgWidth]);

      const yScale = d3
        .scaleLinear()
        .domain(yExtent as [number, number])
        .range([svgHeight, 0]);

      return { nodes, links, xScale, yScale };
    };

    // Helper to create a color map based on product data
    const createColorMap = () => {
      return new Map([
        ["product-HS92-1", "rgb(125, 218, 161)"],
        ["product-HS92-2", "#F5CF23"],
        ["product-HS92-3", "rgb(218, 180, 125)"],
        ["product-HS92-4", "rgb(187, 150, 138)"],
        ["product-HS92-5", "rgb(217, 123, 123)"],
        ["product-HS92-6", "rgb(197, 123, 217)"],
        ["product-HS92-7", "rgb(141, 123, 216)"],
        ["product-HS92-8", "rgb(123, 162, 217)"],
        ["product-HS92-9", "rgb(125, 218, 218)"],
        ["product-HS92-10", "#2a607c"],
        ["product-HS92-14", "rgb(178, 61, 109)"],
      ]);
    };

    // Process data
    const { nodes, links, xScale, yScale } = processData();
    const hs92ColorsMap = createColorMap();
    const metadataMap: Record<string, MetadataEntry> = Object.fromEntries(
      meta.productHs92.map((m) => [
        m.productId,
        {
          sectorId: m.productSector?.productId,
          name: m.productName,
          code: m.productCode,
        },
      ]),
    );

    const nodeMap = new Map(
      nodes.map((d: (typeof nodes)[0]) => [d.productId, d]),
    );

    // Helper function to add event listeners for circles (nodes)
    const addCircleEvents = (
      circles: d3.Selection<
        SVGCircleElement,
        RenderableNode,
        SVGGElement,
        unknown
      >,
      viewport: d3.Selection<SVGGElement, unknown, null, undefined>,
      overlay: d3.Selection<SVGGElement, unknown, null, undefined>,
      metadataMap: Record<string, MetadataEntry>,
    ) => {
      circles
        .on("mouseover", function (event: PointerEvent, d) {
          handleMouseOver.call(this, event, d, viewport, overlay, metadataMap);
        })
        .on("mousemove", function (event: PointerEvent) {
          handleMouseMove(event, overlay);
        })
        .on("mouseout", function () {
          handleMouseOut(viewport, overlay);
        });
    };

    // Handle mouseover event
    const handleMouseOver = function (
      this: SVGCircleElement,
      event: PointerEvent,
      d: RenderableNode,
      viewport: d3.Selection<SVGGElement, unknown, null, undefined>,
      overlay: d3.Selection<SVGGElement, unknown, null, undefined>,
      metadataMap: Record<string, MetadataEntry>,
    ) {
      const connectedLinks = viewport
        .selectAll<SVGPathElement, Edge>("path.link")
        .filter(function () {
          const link = d3.select(this).datum() as Edge;
          return link.source === d.productId || link.target === d.productId;
        })
        .style("stroke", "red")
        .style("stroke-width", 2)
        .raise();

      const connectedNodeIds = new Set<string>();
      connectedLinks.each(function (edge: Edge) {
        if (edge.source !== d.productId) connectedNodeIds.add(edge.source);
        if (edge.target !== d.productId) connectedNodeIds.add(edge.target);
      });

      viewport
        .selectAll<SVGCircleElement, RenderableNode>("circle.node")
        .filter((d) => connectedNodeIds.has(d.productId))
        .style("stroke", "red")
        .style("stroke-width", 3)
        .raise();

      d3.select(this)
        .style("cursor", "pointer")
        .style("stroke-width", 3)
        .style("stroke", "red")
        .raise();

      const tooltipText = `${metadataMap[d.productId].name} (${metadataMap[d.productId].code})`;
      const tooltipEl = tooltipRef
        .current!.attr("x", event.pageX + 5)
        .attr("y", event.pageY - 35)
        .text(tooltipText)
        .style("font-size", "18px")
        .style("fill", "black")
        .style("text-anchor", "middle");

      const bbox = (tooltipEl.node() as SVGGraphicsElement)!.getBBox();

      overlay
        .insert("rect", "text.label")
        .attr("class", "label-background constant-size")
        .attr("x", bbox.x - 4)
        .attr("y", bbox.y - 2)
        .attr("width", bbox.width + 8)
        .attr("height", bbox.height + 4)
        .attr("fill", "white")
        .attr("opacity", 0.85)
        .attr("stroke", "gray");

      tooltipEl.raise();
    };

    // Handle mousemove event
    const handleMouseMove = (
      event: PointerEvent,
      overlay: d3.Selection<SVGGElement, unknown, null, undefined>,
    ) => {
      const tooltipEl = tooltipRef.current!;
      tooltipEl.attr("x", event.pageX + 5).attr("y", event.pageY - 35);

      const bbox = (tooltipEl.node() as SVGGraphicsElement)!.getBBox();
      overlay
        .select(".label-background")
        .attr("x", bbox.x - 4)
        .attr("y", bbox.y - 2);
    };

    // Handle mouseout event
    const handleMouseOut = (
      viewport: d3.Selection<SVGGElement, unknown, null, undefined>,
      overlay: d3.Selection<SVGGElement, unknown, null, undefined>,
    ) => {
      viewport
        .selectAll("path.link")
        .style("stroke", "#CCCCCC")
        .style("stroke-width", 1)
        .lower();

      viewport
        .selectAll("circle.node")
        .style("stroke-width", 1)
        .style("stroke", "#CCCCCC");

      overlay.select("#tooltip").text("");
      overlay.select(".label-background").remove();
    };

    // Render nodes and links
    const circles = renderCircles(
      viewport,
      nodes,
      xScale,
      yScale,
      hs92ColorsMap,
      metadataMap,
    );
    renderLinks(viewport, links, nodeMap, xScale, yScale);
    addCircleEvents(circles, viewport, overlay, metadataMap);
  }, [size]);

  // Helper function to render circles (nodes)
  const renderCircles = (
    viewport: d3.Selection<SVGGElement, unknown, null, undefined>,
    nodes: RenderableNode[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    hs92ColorsMap: Map<string, string>,
    metadataMap: Record<string, MetadataEntry>,
  ) => {
    return viewport
      .selectAll<SVGCircleElement, RenderableNode>("circle.node")
      .data(nodes)
      .join("circle")
      .attr("class", "node")
      .attr("r", 4)
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr(
        "fill",
        (d) =>
          hs92ColorsMap.get(metadataMap[d.productId]?.sectorId ?? "") || "#000",
      )
      .style("stroke", "#CCCCCC")
      .style("stroke-width", 1);
  };

  // Helper function to render links (edges)
  const renderLinks = (
    viewport: d3.Selection<SVGGElement, unknown, null, undefined>,
    links: Edge[],
    nodeMap: Map<string, Node>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
  ) => {
    viewport
      .selectAll("path.link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", (d) => {
        const sourceNode = nodeMap.get(d.source);
        const targetNode = nodeMap.get(d.target);
        if (sourceNode && targetNode) {
          return `M ${xScale(sourceNode.x as number)} ${yScale(sourceNode.y as number)} L ${xScale(targetNode.x as number)} ${yScale(targetNode.y as number)}`;
        }
        return "";
      })
      .style("stroke-width", 1)
      .style("stroke", "#CCCCCC")
      .lower();
  };

  return <svg ref={svgRef}></svg>;
};

export default ProductSpace;
