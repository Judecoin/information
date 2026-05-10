# Judecoin Core Algorithm

> **Date:** January 12, 2021  
> **Category:** Education

RandomJDX is a proof-of-work (PoW) algorithm optimized for general-purpose CPU chip mining.

Because RandomJDX uses a random code execution algorithm and certain memory hardware technologies, it is named RandomJDX. Its main purpose is to maintain ASIC resistance while minimizing the efficiency advantage of GPUs.

RandomJDX behaves like a keyed hash function: it accepts a key, takes arbitrary input, and produces a 256-bit result.

At the lower level, RandomJDX uses a virtual machine to execute programs in a special instruction set consisting of integer operations, floating-point operations, and branching.

These programs can be dynamically converted to native code for the CPU. An example of converting a RandomJDX program to x86-64 assembly is `program.asm`. A portable interpretation mode is also provided.

There are two working modes of the RandomJDX algorithm:

1. **Fast mode:** requires 2080 MB of shared memory and is suitable for mining.

2. **Lightweight mode:** requires 256 MB of shared memory, runs more slowly, and is suitable for validation.
