package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strings"
)

var (
	verticalFlag = flag.Bool("vertical", false, "use vertical layout (top to bottom)")
	versionFlag  = flag.Bool("version", false, "show version")
)

type Graph struct {
	edges    map[string][]string
	indegree map[string]int
	nodes    map[string]bool
}

func NewGraph() *Graph {
	return &Graph{
		edges:    make(map[string][]string),
		indegree: make(map[string]int),
		nodes:    make(map[string]bool),
	}
}

func (g *Graph) AddEdge(from, to string) {
	if !g.nodes[from] {
		g.nodes[from] = true
		g.indegree[from] = 0
	}
	if !g.nodes[to] {
		g.nodes[to] = true
		g.indegree[to] = 0
	}
	// Check if edge already exists to avoid duplicates
	for _, existing := range g.edges[from] {
		if existing == to {
			return
		}
	}
	g.edges[from] = append(g.edges[from], to)
	g.indegree[to]++
}

func parseEdges(input string) ([][]string, []string, error) {
	var edges [][]string
	var singleNodes []string
	lines := strings.Split(input, "\n")
	edgePattern := regexp.MustCompile(`^\s*([^#\s][^->]*?)\s*->\s*([^#\s].*?)\s*$`)
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		// Remove inline comments (everything after first #)
		commentPos := strings.Index(line, "#")
		if commentPos >= 0 {
			line = strings.TrimSpace(line[:commentPos])
			if line == "" {
				continue
			}
		}
		
		matches := edgePattern.FindStringSubmatch(line)
		if len(matches) == 3 {
			from := strings.TrimSpace(matches[1])
			to := strings.TrimSpace(matches[2])
			edges = append(edges, []string{from, to})
		} else {
			// Single node without -> (e.g., "G")
			singleNodes = append(singleNodes, line)
		}
	}
	return edges, singleNodes, nil
}

func readInput(filename string) (string, error) {
	if filename == "-" || filename == "" {
		scanner := bufio.NewScanner(os.Stdin)
		var content strings.Builder
		for scanner.Scan() {
			content.WriteString(scanner.Text())
			content.WriteString("\n")
		}
		return content.String(), scanner.Err()
	}
	data, err := os.ReadFile(filename)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func topologicalSort(g *Graph) ([][]string, bool) {
	// Copy indegree map for processing
	indeg := make(map[string]int)
	for k, v := range g.indegree {
		indeg[k] = v
	}
	
	// Initialize queue with nodes having indegree 0
	queue := []string{}
	for node := range indeg {
		if indeg[node] == 0 {
			queue = append(queue, node)
		}
	}
	
	// Kahn's algorithm with layer tracking
	layers := [][]string{}
	
	// Sort initial queue for deterministic output
	sort.Strings(queue)
	
	for len(queue) > 0 {
		// Current layer consists of all nodes in the queue
		currentLayer := []string{}
		nextQueue := []string{}
		
		// Process all nodes in current layer
		for _, node := range queue {
			currentLayer = append(currentLayer, node)
			// For each neighbor, reduce indegree
			for _, neighbor := range g.edges[node] {
				indeg[neighbor]--
				if indeg[neighbor] == 0 {
					nextQueue = append(nextQueue, neighbor)
				}
			}
		}
		
		layers = append(layers, currentLayer)
		queue = nextQueue
		sort.Strings(queue)
	}
	
	// Check for cycles - count processed nodes
	processed := 0
	for _, layer := range layers {
		processed += len(layer)
	}
	
	hasCycle := processed < len(g.nodes)
	
	// If cycle exists, add remaining nodes to last layer
	if hasCycle {
		remaining := []string{}
		for node := range g.nodes {
			found := false
			for _, layer := range layers {
				for _, n := range layer {
					if n == node {
						found = true
						break
					}
				}
				if found {
					break
				}
			}
			if !found {
				remaining = append(remaining, node)
			}
		}
		if remaining != nil && len(remaining) > 0 {
			sort.Strings(remaining)
			layers = append(layers, remaining)
		}
	}
	
	return layers, hasCycle
}

func renderGraph(g *Graph, layers [][]string, hasCycle bool) {
	// For now, simple rendering
	if hasCycle {
		fmt.Printf("cycle detected\n")
	}
	
	// Simple horizontal layout
	if !*verticalFlag {
		// Print each layer horizontally
		for i, layer := range layers {
			if i > 0 {
				fmt.Print("   ")
			}
			for j, node := range layer {
				if j > 0 {
					fmt.Print("   ")
				}
				fmt.Printf("[%s]", node)
			}
			fmt.Println()
			
			// Print connections if not last layer
			if i < len(layers)-1 {
				for j := range layer {
					fmt.Print("      ")
					if j == 0 {
						fmt.Print("──▶")
					} else {
						fmt.Print("    ")
					}
				}
				fmt.Println()
			}
		}
	} else {
		// Vertical layout
		for i, layer := range layers {
			for _, node := range layer {
				fmt.Printf("[%s]\n", node)
			}
			if i < len(layers)-1 {
				fmt.Println("  ↓")
			}
		}
	}
}

func main() {
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "Usage of %s:\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "  gratui [file]\n")
		fmt.Fprintf(flag.CommandLine.Output(), "Options:\n")
		flag.PrintDefaults()
	}
	
	flag.Parse()
	
	if *versionFlag {
		fmt.Println("gratui v0.1.0")
		return
	}
	
	var filename string
	if len(flag.Args()) > 0 {
		filename = flag.Args()[0]
	} else {
		filename = "-"
	}
	
	content, err := readInput(filename)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading input: %v\n", err)
		os.Exit(1)
	}
	
	edges, singleNodes, err := parseEdges(content)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing edges: %v\n", err)
		os.Exit(1)
	}
	
	// Build graph
	graph := NewGraph()
	for _, edge := range edges {
		graph.AddEdge(edge[0], edge[1])
	}
	// Add single nodes
	for _, node := range singleNodes {
		if !graph.nodes[node] {
			graph.nodes[node] = true
			graph.indegree[node] = 0
		}
	}
	
	// Topological sort with cycle detection
	layers, hasCycle := topologicalSort(graph)
	
	// Render graph
	renderGraph(graph, layers, hasCycle)
}