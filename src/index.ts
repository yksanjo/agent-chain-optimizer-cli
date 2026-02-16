#!/usr/bin/env node
/**
 * Agent Chain Optimizer CLI
 * Command-line interface for workflow optimization
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createOptimizer } from 'agent-chain-optimizer';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('aco')
  .description('Agent Chain Optimizer CLI - Analyze and optimize multi-agent workflows')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze a workflow from JSON file')
  .argument('<file>', 'Path to workflow JSON file')
  .option('-o, --output <file>', 'Output file for analysis results')
  .action(async (file: string, options: { output?: string }) => {
    try {
      console.log(chalk.blue('Analyzing workflow...'));
      
      const workflowData = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const optimizer = createOptimizer({ autoOptimize: false });
      
      // Register agents if provided
      if (workflowData.agents) {
        for (const agent of workflowData.agents) {
          optimizer.registerAgent(agent);
        }
      }
      
      // Simulate workflow execution if needed
      if (workflowData.simulate) {
        const traceId = optimizer.startExecution(workflowData.id, 'cli-exec');
        
        for (const step of workflowData.steps || []) {
          optimizer.startStep('cli-exec', step, traceId);
          optimizer.completeStep('cli-exec', step.id, step.inputTokens || 100, step.outputTokens || 50, true);
        }
        
        optimizer.completeExecution('cli-exec', 'completed');
      }
      
      const analysis = optimizer.analyzeWorkflow(workflowData.id);
      
      console.log(chalk.green('\n=== Analysis Results ===\n'));
      console.log(`Total Latency: ${analysis.totalLatency.toFixed(2)}ms`);
      console.log(`Total Cost: $${analysis.totalCost.toFixed(4)}`);
      console.log(`Success Rate: ${(analysis.qualityMetrics.successRate * 100).toFixed(1)}%`);
      console.log(`\nLatency Metrics:`);
      console.log(`  P50: ${analysis.latencyMetrics.p50.toFixed(2)}ms`);
      console.log(`  P90: ${analysis.latencyMetrics.p90.toFixed(2)}ms`);
      console.log(`  P95: ${analysis.latencyMetrics.p95.toFixed(2)}ms`);
      console.log(`  P99: ${analysis.latencyMetrics.p99.toFixed(2)}ms`);
      
      if (analysis.stepAnalysis.length > 0) {
        console.log(chalk.yellow('\nBottleneck Steps:'));
        for (const step of analysis.stepAnalysis.filter(s => s.isBottleneck)) {
          console.log(`  - ${step.agentName}: ${step.latency.toFixed(2)}ms (${step.percentageOfTotal.toFixed(1)}% of total)`);
        }
      }
      
      if (options.output) {
        fs.writeFileSync(options.output, JSON.stringify(analysis, null, 2));
        console.log(chalk.green(`\nResults saved to ${options.output}`));
      }
      
      optimizer.dispose();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('optimize')
  .description('Optimize a workflow and generate optimized version')
  .argument('<file>', 'Path to workflow JSON file')
  .option('-o, --output <file>', 'Output file for optimized workflow')
  .action(async (file: string, options: { output?: string }) => {
    try {
      console.log(chalk.blue('Optimizing workflow...'));
      
      const workflowData = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const optimizer = createOptimizer({ autoOptimize: false });
      
      const { optimizedWorkflow, results } = optimizer.optimizeWorkflow(workflowData);
      
      console.log(chalk.green('\n=== Optimization Complete ===\n'));
      console.log(`Applied ${results.length} optimizations:`);
      
      for (const result of results) {
        console.log(`\n${result.type}:`);
        console.log(`  Latency reduction: ${result.improvements.latencyReduction.toFixed(1)}%`);
        console.log(`  Cost reduction: ${result.improvements.costReduction.toFixed(1)}%`);
      }
      
      const outputPath = options.output || file.replace('.json', '.optimized.json');
      fs.writeFileSync(outputPath, JSON.stringify(optimizedWorkflow, null, 2));
      console.log(chalk.green(`\nOptimized workflow saved to ${outputPath}`));
      
      optimizer.dispose();
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('monitor')
  .description('Start interactive monitoring session')
  .action(() => {
    console.log(chalk.blue('Starting interactive monitor...'));
    console.log(chalk.yellow('\nInteractive mode not yet implemented.'));
    console.log('Use "aco analyze <file>" for quick analysis.');
  });

program.parse();
